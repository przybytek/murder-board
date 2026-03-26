import React from 'react';
import type { BoardCard } from '@murder-board/shared';

interface CardProps {
  card: BoardCard;
  isSelected: boolean;
  isDragging: boolean;
  connectMode: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onClick: () => void;
  onDelete: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  suspect:  'Suspect',
  clue:     'Clue',
  evidence: 'Evidence',
  note:     'Note',
};

export const Card: React.FC<CardProps> = ({
  card,
  isSelected,
  isDragging,
  connectMode,
  onPointerDown,
  onClick,
  onDelete,
}) => {
  const classes = [
    'card',
    `card--${card.type}`,
    isSelected    ? 'card--selected'     : '',
    isDragging    ? 'card--dragging'     : '',
    connectMode   ? 'card--connect-mode' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ left: card.x, top: card.y, touchAction: 'none' }}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <div className="card__pin" />
      <div className="card__header">
        <span className="card__type-badge">{TYPE_LABELS[card.type]}</span>
        <button
          className="card__delete"
          onMouseDown={e => e.stopPropagation()}
          onClick={e => { e.stopPropagation(); onDelete(); }}
          title="Remove card"
        >
          ×
        </button>
      </div>
      <div className="card__title">{card.title}</div>
      {card.description && (
        <div className="card__description">{card.description}</div>
      )}
    </div>
  );
};
