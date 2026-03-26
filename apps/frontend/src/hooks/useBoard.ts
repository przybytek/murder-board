import { useState, useCallback, useEffect, useRef } from 'react';
import type { BoardCard, BoardState, Connection, CardType, Case, CaseListItem } from '@murder-board/shared';
import { fetchCases, fetchCase, createCase, updateCase, deleteCase } from '../api';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

const DEBOUNCE_MS = 1200;

export function useBoard() {
  const [caseList,      setCaseList]      = useState<CaseListItem[]>([]);
  const [activeCase,    setActiveCase]    = useState<Case | null>(null);
  const [state,         setState]         = useState<BoardState>({ cards: [], connections: [] });
  const [loading,       setLoading]       = useState(true);
  const [saveStatus,    setSaveStatus]    = useState<SaveStatus>('idle');

  const serverRef = useRef<BoardState | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load case list on mount, then open first case ──────────────────────────
  useEffect(() => {
    fetchCases()
      .then(async (list) => {
        setCaseList(list);
        if (list.length > 0) {
          const c = await fetchCase(list[0].id);
          serverRef.current = c.board;
          setActiveCase(c);
          setState(c.board);
        }
      })
      .catch(() => setSaveStatus('error'))
      .finally(() => setLoading(false));
  }, []);

  // ── Debounced save whenever board state changes ─────────────────────────────
  useEffect(() => {
    if (state === serverRef.current) return;
    if (loading || !activeCase) return;

    setSaveStatus('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      serverRef.current = state;
      updateCase(activeCase.id, { board: state })
        .then(() => setSaveStatus('saved'))
        .catch(() => {
          serverRef.current = null;
          setSaveStatus('error');
        });
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, loading, activeCase]);

  // ── Case management ─────────────────────────────────────────────────────────

  const selectCase = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const c = await fetchCase(id);
      serverRef.current = c.board;
      setActiveCase(c);
      setState(c.board);
    } catch {
      setSaveStatus('error');
    } finally {
      setLoading(false);
    }
  }, []);

  const addNewCase = useCallback(async (name: string, description: string) => {
    const c = await createCase(name, description);
    setCaseList(prev => [...prev, { id: c.id, name: c.name, description: c.description, createdAt: c.createdAt, updatedAt: c.updatedAt }]);
    serverRef.current = c.board;
    setActiveCase(c);
    setState(c.board);
    return c;
  }, []);

  const removeCase = useCallback(async (id: string) => {
    await deleteCase(id);
    const nextList = caseList.filter(c => c.id !== id);
    setCaseList(nextList);
    if (activeCase?.id === id) {
      if (nextList.length > 0) {
        const c = await fetchCase(nextList[0].id);
        serverRef.current = c.board;
        setActiveCase(c);
        setState(c.board);
      } else {
        setActiveCase(null);
        setState({ cards: [], connections: [] });
      }
    }
  }, [caseList, activeCase]);

  // ── Board mutation helpers ──────────────────────────────────────────────────

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

  const deleteConnection = useCallback((id: string) => {
    setState(s => ({
      ...s,
      connections: s.connections.filter(conn => conn.id !== id),
    }));
  }, []);

  const clearBoard = useCallback(() => {
    setState({ cards: [], connections: [] });
  }, []);

  return {
    // case management
    caseList,
    activeCase,
    selectCase,
    addNewCase,
    removeCase,
    // board state
    cards: state.cards,
    connections: state.connections,
    loading,
    saveStatus,
    // board mutations
    addCard,
    deleteCard,
    updateCardPosition,
    addConnection,
    deleteConnection,
    clearBoard,
  };
}
