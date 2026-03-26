import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useBoard } from '../hooks/useBoard';
import { Card } from './Card';
import { Toolbar } from './Toolbar';
import { AddCardModal } from './AddCardModal';
import type { CardType } from '@murder-board/shared';

// Approx card dimensions used for centering connection endpoints
const CARD_W = 188;
const CARD_H = 110;

// Dead-zone: pointer must move this many px before a tap becomes a drag
const DRAG_THRESHOLD = 6;

// Returns the toolbar's bottom edge in canvas Y coordinates
const getToolbarClearance = (board: HTMLElement) => {
  const toolbar = board.querySelector<HTMLElement>('.toolbar');
  if (toolbar) return toolbar.getBoundingClientRect().bottom - board.getBoundingClientRect().top + board.scrollTop + 8;
  return 100 + board.scrollTop;
};

const Board: React.FC = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const {
    cards, connections, loading, saveStatus,
    caseList, activeCase, selectCase, addNewCase, removeCase,
    addCard, deleteCard, updateCardPosition, addConnection, deleteConnection, clearBoard,
  } = useBoard();

  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const dragMovedRef  = useRef(false);
  const dragStartRef  = useRef<{ x: number; y: number } | null>(null);

  const [connectMode, setConnectMode] = useState(false);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [showModal, setShowModal]     = useState(false);
  const [hoveredConn, setHoveredConn] = useState<string | null>(null);
  const [selectedConn, setSelectedConn] = useState<string | null>(null);

  // Pointer-based drag — works for mouse, touch, and stylus
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: PointerEvent) => {
      const board = boardRef.current;
      if (!board) return;
      // Apply dead-zone threshold before treating movement as a drag
      if (dragStartRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        if (Math.hypot(dx, dy) > DRAG_THRESHOLD) dragMovedRef.current = true;
      }
      if (!dragMovedRef.current) return;
      const rect = board.getBoundingClientRect();
      const minY = getToolbarClearance(board);
      const x = Math.max(0, e.clientX - rect.left + board.scrollLeft - dragging.offsetX);
      const y = Math.max(minY,  e.clientY - rect.top  + board.scrollTop  - dragging.offsetY);
      updateCardPosition(dragging.id, x, y);
    };

    const onUp = () => { setDragging(null); dragStartRef.current = null; };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup',   onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup',   onUp);
    };
  }, [dragging, updateCardPosition]);

  const handleCardPointerDown = useCallback(
    (e: React.PointerEvent, id: string) => {
      if (connectMode) return;
      e.preventDefault();
      e.stopPropagation();
      const board = boardRef.current;
      if (!board) return;
      const card = cards.find(c => c.id === id);
      if (!card) return;
      const rect = board.getBoundingClientRect();
      dragMovedRef.current = false;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      setSelectedConn(null);
      setDragging({
        id,
        offsetX: e.clientX - rect.left + board.scrollLeft - card.x,
        offsetY: e.clientY - rect.top  + board.scrollTop  - card.y,
      });
    },
    [connectMode, cards]
  );

  const handleCardClick = useCallback(
    (id: string) => {
      if (!connectMode) return;
      if (dragMovedRef.current) return; // ignore accidental click after drag
      if (!connectFrom) {
        setConnectFrom(id);
      } else if (connectFrom === id) {
        setConnectFrom(null); // deselect same card
      } else {
        addConnection(connectFrom, id);
        setConnectFrom(null);
      }
    },
    [connectMode, connectFrom, addConnection]
  );

  const handleToggleConnect = useCallback(() => {
    setConnectMode(m => !m);
    setConnectFrom(null);
  }, []);

  const handleAddCard = useCallback(
    (type: CardType, title: string, description: string) => {
      addCard(type, title, description);
    },
    [addCard]
  );

  // Centre of a card for drawing connection endpoints
  const centre = (id: string) => {
    const card = cards.find(c => c.id === id);
    if (!card) return null;
    return { x: card.x + CARD_W / 2, y: card.y + CARD_H / 2 };
  };

  if (loading) {
    return (
      <div className="board board--loading">
        <div className="board__loading-overlay">Loading board…</div>
      </div>
    );
  }

  const boardClass = [
    'board',
    connectMode ? 'board--connecting' : '',
    dragging    ? 'board--dragging'   : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={boardRef} className={boardClass}>
      {/* Scrollable canvas — cards and connections live here */}
      <div className="board__canvas" onClick={() => setSelectedConn(null)}>
        <svg className="board__connections">
          {connections.map(conn => {
            const from = centre(conn.from);
            const to   = centre(conn.to);
            if (!from || !to) return null;
            const mx = (from.x + to.x) / 2;
            const my = (from.y + to.y) / 2;
            const isActive = hoveredConn === conn.id || selectedConn === conn.id;
            return (
              <g
                key={conn.id}
                style={{ pointerEvents: 'all' }}
                onClick={(e) => { e.stopPropagation(); setSelectedConn(prev => prev === conn.id ? null : conn.id); }}
                onMouseEnter={() => setHoveredConn(conn.id)}
                onMouseLeave={() => setHoveredConn(null)}
              >
                {/* Wide invisible hit/touch area */}
                <line
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                  stroke="transparent"
                  strokeWidth={28}
                  style={{ pointerEvents: 'stroke' }}
                />
                <line
                  className={`connection-line${isActive ? ' connection-line--hovered' : ''}`}
                  x1={from.x} y1={from.y}
                  x2={to.x}   y2={to.y}
                />
                {isActive && (
                  <g
                    className="connection-delete"
                    transform={`translate(${mx}, ${my})`}
                    onClick={(e) => { e.stopPropagation(); deleteConnection(conn.id); setSelectedConn(null); }}
                  >
                    <circle r={14} />
                    <text textAnchor="middle" dominantBaseline="central">×</text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Cards */}
        {cards.map(card => (
          <Card
            key={card.id}
            card={card}
            isSelected={connectFrom === card.id}
            isDragging={dragging?.id === card.id}
            connectMode={connectMode}
            onPointerDown={e => handleCardPointerDown(e, card.id)}
            onClick={() => handleCardClick(card.id)}
            onDelete={() => deleteCard(card.id)}
          />
        ))}
      </div>

      {/* Toolbar — fixed to viewport, outside scrollable canvas */}
      <Toolbar
        connectMode={connectMode}
        saveStatus={saveStatus}
        cases={caseList}
        activeCaseId={activeCase?.id}
        onAddCard={() => setShowModal(true)}
        onToggleConnect={handleToggleConnect}
        onClearBoard={clearBoard}
        onSelectCase={selectCase}
        onAddCase={addNewCase}
        onDeleteCase={removeCase}
      />

      {/* Connect-mode hint */}
      {connectMode && (
        <div className="connect-hint">
          {connectFrom
            ? '🔴 Tap the second card to connect'
            : '🧵 Tap the first card to start a connection'}
        </div>
      )}

      {/* Add card modal */}
      {showModal && (
        <AddCardModal onAdd={handleAddCard} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
};

export default Board;
