import React from 'react';
import type { SaveStatus } from '../hooks/useBoard';

interface ToolbarProps {
  connectMode: boolean;
  saveStatus: SaveStatus;
  onAddCard: () => void;
  onToggleConnect: () => void;
  onClearBoard: () => void;
}

const SAVE_LABEL: Record<SaveStatus, string> = {
  idle:   '',
  saving: '💾 Saving…',
  saved:  '✓ Saved',
  error:  '⚠ Save failed',
};

export const Toolbar: React.FC<ToolbarProps> = ({
  connectMode,
  saveStatus,
  onAddCard,
  onToggleConnect,
  onClearBoard,
}) => (
  <div className="toolbar">
    <span className="toolbar__title">Murder Board</span>

    <button className="toolbar__btn toolbar__btn--add" onClick={onAddCard}>
      + Add Card
    </button>

    <button
      className={`toolbar__btn toolbar__btn--connect${connectMode ? ' active' : ''}`}
      onClick={onToggleConnect}
      title="Connect two cards with yarn"
    >
      {connectMode ? '🔴 Connecting…' : '🧵 Connect'}
    </button>

    <button className="toolbar__btn toolbar__btn--clear" onClick={onClearBoard}>
      Clear Board
    </button>

    {connectMode && (
      <span className="toolbar__hint">Click two cards to connect them</span>
    )}

    {SAVE_LABEL[saveStatus] && (
      <span className={`toolbar__save-status toolbar__save-status--${saveStatus}`}>
        {SAVE_LABEL[saveStatus]}
      </span>
    )}
  </div>
);
