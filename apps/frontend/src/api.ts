import type { BoardState } from '@murder-board/shared';

// Set VITE_API_URL in apps/frontend/.env.local after deploying the CDK stack.
// Without it the app falls back to localStorage so local dev still works.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '');
const LOCAL_KEY = 'murder-board-state';

const DEFAULT_STATE: BoardState = {
  cards: [
    { id: '1', type: 'suspect',  title: 'John Doe',         description: 'Seen near the scene at midnight.', x: 80,  y: 130 },
    { id: '2', type: 'clue',     title: 'Bloody Knife',     description: 'Found in the garden bed.',         x: 380, y: 180 },
    { id: '3', type: 'evidence', title: 'Security Footage', description: 'Camera captures 11:45 PM.',        x: 680, y: 130 },
    { id: '4', type: 'note',     title: 'Motive?',          description: 'Check financial records.',         x: 230, y: 380 },
  ],
  connections: [
    { id: 'c1', from: '1', to: '2' },
    { id: 'c2', from: '2', to: '3' },
  ],
};

export async function fetchBoard(): Promise<BoardState> {
  if (!API_URL) {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? (JSON.parse(raw) as BoardState) : DEFAULT_STATE;
  }

  const res = await fetch(`${API_URL}/board`);
  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to load board`);

  const data = (await res.json()) as BoardState;
  // First deploy: server returns empty arrays → seed with defaults
  return data.cards.length === 0 ? DEFAULT_STATE : data;
}

export async function saveBoard(state: BoardState): Promise<void> {
  if (!API_URL) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(state));
    return;
  }

  const res = await fetch(`${API_URL}/board`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: failed to save board`);
}
