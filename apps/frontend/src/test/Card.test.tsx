import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Card } from '../components/Card';
import type { BoardCard } from '@murder-board/shared';

const makeCard = (overrides: Partial<BoardCard> = {}): BoardCard => ({
  id: '1',
  type: 'suspect',
  title: 'John Doe',
  description: 'Seen near scene',
  x: 100,
  y: 200,
  ...overrides,
});

describe('Card', () => {
  const onMouseDown = vi.fn();
  const onClick     = vi.fn();
  const onDelete    = vi.fn();

  beforeEach(() => { onMouseDown.mockClear(); onClick.mockClear(); onDelete.mockClear(); });

  it('renders title and description', () => {
    render(
      <Card card={makeCard()} isSelected={false} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Seen near scene')).toBeInTheDocument();
  });

  it('renders the correct type badge for each type', () => {
    const types: Array<BoardCard['type']> = ['suspect', 'clue', 'evidence', 'note'];
    const labels = ['Suspect', 'Clue', 'Evidence', 'Note'];
    types.forEach((type, i) => {
      const { unmount } = render(
        <Card card={makeCard({ type })} isSelected={false} isDragging={false}
          connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
      );
      expect(screen.getByText(labels[i])).toBeInTheDocument();
      unmount();
    });
  });

  it('applies card--selected class when isSelected', () => {
    const { container } = render(
      <Card card={makeCard()} isSelected={true} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    expect(container.firstChild).toHaveClass('card--selected');
  });

  it('applies card--dragging class when isDragging', () => {
    const { container } = render(
      <Card card={makeCard()} isSelected={false} isDragging={true}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    expect(container.firstChild).toHaveClass('card--dragging');
  });

  it('applies card--connect-mode class when connectMode', () => {
    const { container } = render(
      <Card card={makeCard()} isSelected={false} isDragging={false}
        connectMode={true} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    expect(container.firstChild).toHaveClass('card--connect-mode');
  });

  it('calls onDelete when delete button is clicked', () => {
    render(
      <Card card={makeCard()} isSelected={false} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    fireEvent.click(screen.getByTitle('Remove card'));
    expect(onDelete).toHaveBeenCalled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('calls onClick when the card is clicked', () => {
    const { container } = render(
      <Card card={makeCard()} isSelected={false} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    fireEvent.click(container.firstChild!);
    expect(onClick).toHaveBeenCalled();
  });

  it('positions card via style', () => {
    const { container } = render(
      <Card card={makeCard({ x: 150, y: 250 })} isSelected={false} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    const el = container.firstChild as HTMLElement;
    expect(el.style.left).toBe('150px');
    expect(el.style.top).toBe('250px');
  });

  it('renders without description when empty', () => {
    render(
      <Card card={makeCard({ description: '' })} isSelected={false} isDragging={false}
        connectMode={false} onMouseDown={onMouseDown} onClick={onClick} onDelete={onDelete} />
    );
    expect(document.querySelector('.card__description')).not.toBeInTheDocument();
  });
});
