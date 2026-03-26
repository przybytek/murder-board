import type { BoardState, Case, CaseListItem } from '@murder-board/shared';

// Set VITE_API_URL in apps/frontend/.env.local after deploying the CDK stack.
// Without it the app falls back to localStorage so local dev still works.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');

const LOCAL_CASES_KEY = 'murder-board-cases';

// ── localStorage case helpers ─────────────────────────────────────────────────

function loadLocalCases(): Case[] {
  const raw = localStorage.getItem(LOCAL_CASES_KEY);
  if (raw) { try { return JSON.parse(raw) as Case[]; } catch { /* fall through */ } }
  return [];
}

function saveLocalCases(cases: Case[]): void {
  localStorage.setItem(LOCAL_CASES_KEY, JSON.stringify(cases));
}

// ── Cases API ─────────────────────────────────────────────────────────────────

export async function fetchCases(): Promise<CaseListItem[]> {
  if (!API_URL) {
    return loadLocalCases().map(({ id, name, description, createdAt, updatedAt }) =>
      ({ id, name, description, createdAt, updatedAt }));
  }
  const res = await fetch(`${API_URL}/cases`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to list cases`);
  return res.json() as Promise<CaseListItem[]>;
}

export async function fetchCase(id: string): Promise<Case> {
  if (!API_URL) {
    const c = loadLocalCases().find(c => c.id === id);
    if (!c) throw new Error(`Case ${id} not found`);
    return c;
  }
  const res = await fetch(`${API_URL}/cases/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to load case`);
  return res.json() as Promise<Case>;
}

export async function createCase(name: string, description: string): Promise<Case> {
  if (!API_URL) {
    const now = new Date().toISOString();
    const cases = loadLocalCases();
    const next: Case = {
      id: String(Date.now()),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      board: { cards: [], connections: [] },
    };
    saveLocalCases([...cases, next]);
    return next;
  }
  const res = await fetch(`${API_URL}/cases`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to create case`);
  return res.json() as Promise<Case>;
}

export async function updateCase(id: string, patch: Partial<Pick<Case, 'name' | 'description' | 'board'>>): Promise<Case> {
  if (!API_URL) {
    const cases = loadLocalCases();
    const idx = cases.findIndex(c => c.id === id);
    if (idx === -1) throw new Error(`Case ${id} not found`);
    const updated: Case = { ...cases[idx], ...patch, updatedAt: new Date().toISOString() };
    cases[idx] = updated;
    saveLocalCases(cases);
    return updated;
  }
  const res = await fetch(`${API_URL}/cases/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to update case`);
  return res.json() as Promise<Case>;
}

export async function deleteCase(id: string): Promise<void> {
  if (!API_URL) {
    saveLocalCases(loadLocalCases().filter(c => c.id !== id));
    return;
  }
  const res = await fetch(`${API_URL}/cases/${encodeURIComponent(id)}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to delete case`);
}

// ── Legacy single-board API (kept so existing tests don't break) ──────────────

/** @deprecated use fetchCase / updateCase with the cases API */
export async function fetchBoard(): Promise<BoardState> {
  return (await fetchCase('__legacy__')).board;
}

/** @deprecated use updateCase with the cases API */
export async function saveBoard(board: BoardState): Promise<void> {
  await updateCase('__legacy__', { board });
}

