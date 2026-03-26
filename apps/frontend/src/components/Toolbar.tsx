import React from 'react';
import type { SaveStatus } from '../hooks/useBoard';
import type { CaseListItem } from '@murder-board/shared';
import { CaseSelector } from './CaseSelector';

interface ToolbarProps {
  connectMode: boolean;
  saveStatus: SaveStatus;
  cases: CaseListItem[];
  activeCaseId: string | undefined;
  onAddCard: () => void;
  onToggleConnect: () => void;
  onClearBoard: () => void;
  onSelectCase: (id: string) => void;
  onAddCase: (name: string, description: string) => void;
  onDeleteCase: (id: string) => void;
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
  cases,
  activeCaseId,
  onAddCard,
  onToggleConnect,
  onClearBoard,
  onSelectCase,
  onAddCase,
  onDeleteCase,
}) => (
  <div className="toolbar">
    <span className="toolbar__title">Murder Board</span>

    <CaseSelector
      cases={cases}
      activeCaseId={activeCaseId}
      onSelect={onSelectCase}
      onAdd={onAddCase}
      onDelete={onDeleteCase}
    />

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

