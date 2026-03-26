import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import type { Case, CaseListItem, BoardState } from '../../packages/shared/src/index';

const TABLE_NAME = process.env.TABLE_NAME!;
const ddb = DynamoDBDocument.from(new DynamoDB());

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

function ok(body: unknown, status = 200) {
  return { statusCode: status, headers: CORS, body: JSON.stringify(body) };
}
function err(message: string, status = 400) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error: message }) };
}

function caseKey(id: string) { return `CASE#${id}`; }
function listKey()           { return 'CASES'; }

// ── Validation ────────────────────────────────────────────────────────────────
function isValidBoard(b: unknown): b is BoardState {
  if (!b || typeof b !== 'object') return false;
  const board = b as Record<string, unknown>;
  return (
    Array.isArray(board.cards) &&
    Array.isArray(board.connections) &&
    (board.cards as unknown[]).length <= 500 &&
    (board.connections as unknown[]).length <= 1000
  );
}

// ── List index helpers ────────────────────────────────────────────────────────
function toListItem(c: Case): CaseListItem {
  return { id: c.id, name: c.name, description: c.description, createdAt: c.createdAt, updatedAt: c.updatedAt };
}

async function getList(): Promise<CaseListItem[]> {
  const result = await ddb.get({ TableName: TABLE_NAME, Key: { pk: listKey() } });
  return (result.Item?.items ?? []) as CaseListItem[];
}

async function saveList(items: CaseListItem[]) {
  await ddb.put({ TableName: TABLE_NAME, Item: { pk: listKey(), items } });
}

// ── Route: GET /cases ─────────────────────────────────────────────────────────
async function listCases() {
  return ok(await getList());
}

// ── Route: POST /cases ────────────────────────────────────────────────────────
async function createCase(event: APIGatewayProxyEvent) {
  const body = event.body ? JSON.parse(event.body) : null;
  if (!body?.name?.trim()) return err('name is required');

  const now = new Date().toISOString();
  const newCase: Case = {
    id:          Date.now().toString(),
    name:        String(body.name).trim().slice(0, 100),
    description: String(body.description ?? '').trim().slice(0, 500),
    createdAt:   now,
    updatedAt:   now,
    board:       isValidBoard(body.board) ? body.board : { cards: [], connections: [] },
  };

  await ddb.put({ TableName: TABLE_NAME, Item: { pk: caseKey(newCase.id), ...newCase } });

  const items = await getList();
  items.push(toListItem(newCase));
  await saveList(items);

  return ok(newCase, 201);
}

// ── Route: GET /cases/{id} ────────────────────────────────────────────────────
async function getCase(id: string) {
  const result = await ddb.get({ TableName: TABLE_NAME, Key: { pk: caseKey(id) } });
  if (!result.Item) return err('Case not found', 404);
  return ok(result.Item);
}

// ── Route: PUT /cases/{id} ────────────────────────────────────────────────────
async function updateCase(id: string, event: APIGatewayProxyEvent) {
  const body = event.body ? JSON.parse(event.body) : null;
  if (!body) return err('Body required');

  const existing = await ddb.get({ TableName: TABLE_NAME, Key: { pk: caseKey(id) } });
  if (!existing.Item) return err('Case not found', 404);

  const updates: Partial<Case> = {};
  if (body.name !== undefined)        updates.name        = String(body.name).trim().slice(0, 100);
  if (body.description !== undefined) updates.description = String(body.description).trim().slice(0, 500);
  if (body.board !== undefined) {
    if (!isValidBoard(body.board)) return err('Invalid board state');
    updates.board = body.board;
  }

  const updated: Case = { ...(existing.Item as Case), ...updates, updatedAt: new Date().toISOString() };
  await ddb.put({ TableName: TABLE_NAME, Item: { pk: caseKey(id), ...updated } });

  const items = await getList();
  const idx = items.findIndex(i => i.id === id);
  if (idx >= 0) items[idx] = toListItem(updated);
  await saveList(items);

  return ok(updated);
}

// ── Route: DELETE /cases/{id} ─────────────────────────────────────────────────
async function deleteCase(id: string) {
  const existing = await ddb.get({ TableName: TABLE_NAME, Key: { pk: caseKey(id) } });
  if (!existing.Item) return err('Case not found', 404);

  await ddb.delete({ TableName: TABLE_NAME, Key: { pk: caseKey(id) } });

  const items = await getList();
  await saveList(items.filter(i => i.id !== id));

  return ok({ deleted: true });
}

// ── Main handler ──────────────────────────────────────────────────────────────
export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const method = event.httpMethod;
    const caseId = event.pathParameters?.id;

    if (!caseId) {
      if (method === 'GET')  return listCases();
      if (method === 'POST') return createCase(event);
      return err('Method not allowed', 405);
    }

    if (method === 'GET')    return getCase(caseId);
    if (method === 'PUT')    return updateCase(caseId, event);
    if (method === 'DELETE') return deleteCase(caseId);

    return err('Method not allowed', 405);
  } catch (e) {
    console.error('Handler error:', e);
    return err('Internal server error', 500);
  }
};
