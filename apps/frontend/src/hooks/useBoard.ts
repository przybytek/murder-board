import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardCard, BoardState, Connection, CardType } from '@murder-board/shared';
import { fetchBoard, saveBoard } from '../api';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 1200;

export function useBoard() {
  const [state, setState]           = useState<BoardState>({ cards: [], connections: [] });
  const [loading, setLoading]       = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  // Tracks the last state object that was fetched from / persisted to the server.
  // When state === serverRef.current, nothing has changed and we skip saving.
  const serverRef = useRef<BoardState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load initial state from API (or localStorage fallback)
  useEffect(() => {
    fetchBoard()
      .then(s => {
        serverRef.current = s;
        setState(s);
      })
      .catch(() => setSaveStatus('error'))
      .finally(() => setLoading(false));
  }, []);

  // Debounced save whenever state changes after the initial load
  useEffect(() => {
    if (state === serverRef.current) return; // nothing changed since last sync
    if (loading) return;

    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      serverRef.current = state; // optimistic
      saveBoard(state)
        .then(() => setSaveStatus('saved'))
        .catch(() => {
          serverRef.current = null; // force retry on next change
          setSaveStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, loading]);

  const addCard = useCallback((type: CardType, title: string, description: string) => {
    const card: BoardCard = {
      id: Date.now().toString(),
      type,
      title,
      description,
      x: Math.random() * 500 + 80,
      y: Math.random() * 300 + 80,
    };
    setState(s => ({ ...s, cards: [...s.cards, card] }));
  }, []);

  const deleteCard = useCallback((id: string) => {
    setState(s => ({
      cards: s.cards.filter(c => c.id !== id),
      connections: s.connections.filter(conn => conn.from !== id && conn.to !== id),
    }));
  }, []);

  const updateCardPosition = useCallback((id: string, x: number, y: number) => {
    setState(s => ({
      ...s,
      cards: s.cards.map(c => (c.id === id ? { ...c, x, y } : c)),
    }));
  }, []);

  const addConnection = useCallback((from: string, to: string) => {
    setState(s => {
      const duplicate = s.connections.some(
        conn =>
          (conn.from === from && conn.to === to) ||
          (conn.from === to   && conn.to === from)
      );
      if (duplicate) return s;
      const conn: Connection = { id: Date.now().toString(), from, to };
      return { ...s, connections: [...s.connections, conn] };
    });
  }, []);

  const clearBoard = useCallback(() => {
    setState({ cards: [], connections: [] });
  }, []);

  return {
    cards: state.cards,
    connections: state.connections,
    loading,
    saveStatus,
    addCard,
    deleteCard,
    updateCardPosition,
    addConnection,
    clearBoard,
  };
}
