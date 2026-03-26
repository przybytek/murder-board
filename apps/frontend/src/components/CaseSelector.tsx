import React, { useState } from 'react';
import type { CaseListItem } from '@murder-board/shared';

interface CaseSelectorProps {
  cases: CaseListItem[];
  activeCaseId: string | undefined;
  onSelect: (id: string) => void;
  onAdd: (name: string, description: string) => void;
  onDelete: (id: string) => void;
}

export const CaseSelector: React.FC<CaseSelectorProps> = ({
  cases,
  activeCaseId,
  onSelect,
  onAdd,
  onDelete,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName]   = useState('');
  const [newDesc, setNewDesc]   = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowForm(false);
  };

  return (
    <div className="case-selector">
      <span className="case-selector__label">Case:</span>

      <select
        className="case-selector__select"
        value={activeCaseId ?? ''}
        onChange={e => onSelect(e.target.value)}
      >
        {cases.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
        {cases.length === 0 && <option value="">No cases</option>}
      </select>

      {activeCaseId && cases.length > 1 && (
        <button
          className="case-selector__btn case-selector__btn--delete"
          title="Delete this case"
          onClick={() => {
            if (window.confirm('Delete this case? This cannot be undone.')) {
              onDelete(activeCaseId);
            }
          }}
        >
          🗑
        </button>
      )}

      <button
        className="case-selector__btn case-selector__btn--new"
        title="New case"
        onClick={() => setShowForm(v => !v)}
      >
        + New Case
      </button>

      {showForm && (
        <form className="case-selector__form" onSubmit={handleAdd}>
          <input
            className="case-selector__input"
            placeholder="Case name"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            autoFocus
            required
          />
          <input
            className="case-selector__input"
            placeholder="Description (optional)"
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
          />
          <button type="submit" className="case-selector__btn case-selector__btn--confirm">Create</button>
          <button type="button" className="case-selector__btn" onClick={() => setShowForm(false)}>Cancel</button>
        </form>
      )}
    </div>
  );
};
