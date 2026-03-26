import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useBoard } from '../hooks/useBoard';
import { Card } from './Card';
import { Toolbar } from './Toolbar';
import { AddCardModal } from './AddCardModal';
import type { CardType } from '@murder-board/shared';

// Approx card dimensions used for centering connection endpoints
const CARD_W = 188;
const CARD_H = 110;

const Board: React.FC = () => {
  const boardRef = useRef<HTMLDivElement>(null);
  const {
    cards, connections, loading, saveStatus,
    caseList, activeCase, selectCase, addNewCase, removeCase,
    addCard, deleteCard, updateCardPosition, addConnection, deleteConnection, clearBoard,
  } = useBoard();

  const [dragging, setDragging] = useState<{ id: string; offsetX: number; offsetY: number } | null>(
    null
  );
  const dragMovedRef = useRef(false);

  const [connectMode, setConnectMode]   = useState(false);
  const [connectFrom, setConnectFrom]   = useState<string | null>(null);
  const [showModal, setShowModal]       = useState(false);
  const [hoveredConn, setHoveredConn]   = useState<string | null>(null);

  // Attach window-level mousemove/mouseup so drags work even outside the board
  useEffect(() => {
    if (!dragging) return;

    const onMove = (e: MouseEvent) => {
      const board = boardRef.current;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = Math.max(0, e.clientX - rect.left - dragging.offsetX);
      const y = Math.max(0, e.clientY - rect.top  - dragging.offsetY);
      dragMovedRef.current = true;
      updateCardPosition(dragging.id, x, y);
    };

    const onUp = () => setDragging(null);

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [dragging, updateCardPosition]);

  const handleCardMouseDown = useCallback(
    (e: React.MouseEvent, id: string) => {
      if (connectMode) return;
      e.preventDefault();
      e.stopPropagation();
      const board = boardRef.current;
      if (!board) return;
      const card = cards.find(c => c.id === id);
      if (!card) return;
      const rect = board.getBoundingClientRect();
      dragMovedRef.current = false;
      setDragging({
        id,
        offsetX: e.clientX - rect.left - card.x,
        offsetY: e.clientY - rect.top  - card.y,
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
      {/* Red yarn connections */}
      <svg className="board__connections">
        {connections.map(conn => {
          const from = centre(conn.from);
          const to   = centre(conn.to);
          if (!from || !to) return null;
          const mx = (from.x + to.x) / 2;
          const my = (from.y + to.y) / 2;
          const isHovered = hoveredConn === conn.id;
          return (
            <g
              key={conn.id}
              onMouseEnter={() => setHoveredConn(conn.id)}
              onMouseLeave={() => setHoveredConn(null)}
            >
              {/* Wider invisible hit area so hover is easy to trigger */}
              <line
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
                stroke="transparent"
                strokeWidth={20}
              />
              <line
                className={`connection-line${isHovered ? ' connection-line--hovered' : ''}`}
                x1={from.x} y1={from.y}
                x2={to.x}   y2={to.y}
              />
              {isHovered && (
                <g
                  className="connection-delete"
                  transform={`translate(${mx}, ${my})`}
                  onClick={() => deleteConnection(conn.id)}
                >
                  <circle r={10} />
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
          onMouseDown={e => handleCardMouseDown(e, card.id)}
          onClick={() => handleCardClick(card.id)}
          onDelete={() => deleteCard(card.id)}
        />
      ))}

      {/* Toolbar */}
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
            ? '🔴 Now click the second card to connect'
            : '🧵 Click the first card to start a connection'}
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
