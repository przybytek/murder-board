import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddCardModal } from '../components/AddCardModal';

describe('AddCardModal', () => {
  const onAdd   = vi.fn();
  const onClose = vi.fn();

  beforeEach(() => { onAdd.mockClear(); onClose.mockClear(); });

  it('renders all fields and buttons', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    expect(screen.getByPlaceholderText(/Enter title/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter description/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Add Card')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('submit button is disabled when title is empty', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    expect(screen.getByText('Add Card')).toBeDisabled();
  });

  it('submit button enables when title is filled', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter title/i), {
      target: { value: 'New Card' },
    });
    expect(screen.getByText('Add Card')).not.toBeDisabled();
  });

  it('calls onAdd with correct args on submit', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'clue' } });
    fireEvent.change(screen.getByPlaceholderText(/Enter title/i), {
      target: { value: 'My Clue' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter description/i), {
      target: { value: 'Some detail' },
    });
    fireEvent.click(screen.getByText('Add Card'));

    expect(onAdd).toHaveBeenCalledWith('clue', 'My Clue', 'Some detail');
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onClose).toHaveBeenCalled();
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(document.querySelector('.modal-overlay')!);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close when clicking inside the modal', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.click(document.querySelector('.modal')!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('trims whitespace from title and description', () => {
    render(<AddCardModal onAdd={onAdd} onClose={onClose} />);
    fireEvent.change(screen.getByPlaceholderText(/Enter title/i), {
      target: { value: '  Knife  ' },
    });
    fireEvent.click(screen.getByText('Add Card'));
    expect(onAdd).toHaveBeenCalledWith('suspect', 'Knife', '');
  });
});
