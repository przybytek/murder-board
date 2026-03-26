import React, { useState } from 'react';
import type { CardType } from '@murder-board/shared';

interface AddCardModalProps {
  onAdd: (type: CardType, title: string, description: string) => void;
  onClose: () => void;
}

export const AddCardModal: React.FC<AddCardModalProps> = ({ onAdd, onClose }) => {
  const [type, setType] = useState<CardType>('suspect');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd(type, title.trim(), description.trim());
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal__title">Add New Card</div>

        <form onSubmit={handleSubmit}>
          <div className="modal__field">
            <label className="modal__label">Type</label>
            <select
              className="modal__select"
              value={type}
              onChange={e => setType(e.target.value as CardType)}
            >
              <option value="suspect">Suspect</option>
              <option value="clue">Clue</option>
              <option value="evidence">Evidence</option>
              <option value="note">Note</option>
            </select>
          </div>

          <div className="modal__field">
            <label className="modal__label">Title</label>
            <input
              className="modal__input"
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Enter title…"
              autoFocus
            />
          </div>

          <div className="modal__field">
            <label className="modal__label">Description</label>
            <textarea
              className="modal__textarea"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Enter description…"
            />
          </div>

          <div className="modal__actions">
            <button type="button" className="modal__btn modal__btn--cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="modal__btn modal__btn--submit"
              disabled={!title.trim()}
            >
              Add Card
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
