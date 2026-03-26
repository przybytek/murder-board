import { DynamoDB } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyHandler } from 'aws-lambda';

const TABLE_NAME = process.env.TABLE_NAME!;
const BOARD_KEY  = 'BOARD';

const ddb = DynamoDBDocument.from(new DynamoDB());

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const result = await ddb.get({
        TableName: TABLE_NAME,
        Key: { pk: BOARD_KEY },
      });

      const body = result.Item
        ? { cards: result.Item.cards ?? [], connections: result.Item.connections ?? [] }
        : { cards: [], connections: [] };

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify(body),
      };
    }

    if (event.httpMethod === 'PUT') {
      const parsed = event.body ? JSON.parse(event.body) : null;

      if (
        !parsed ||
        !Array.isArray(parsed.cards) ||
        !Array.isArray(parsed.connections) ||
        parsed.cards.length > 500 ||
        parsed.connections.length > 1000
      ) {
        return {
          statusCode: 400,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Invalid board state' }),
        };
      }

      await ddb.put({
        TableName: TABLE_NAME,
        Item: {
          pk:          BOARD_KEY,
          cards:       parsed.cards,
          connections: parsed.connections,
          updatedAt:   new Date().toISOString(),
        },
      });

      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({ cards: parsed.cards, connections: parsed.connections }),
      };
    }

    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  } catch (err) {
    console.error('Board handler error:', err);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
