import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { BoardState, Case } from '@murder-board/shared';

vi.mock('../api', () => {
  const board: BoardState = {
    cards: [
      { id: '1', type: 'suspect', title: 'Alice', description: 'Suspect one', x: 80,  y: 130 },
      { id: '2', type: 'clue',    title: 'Knife',  description: 'A weapon',   x: 300, y: 200 },
    ],
    connections: [],
  };
  const caseItem = { id: '1', name: 'Test Case', description: '', createdAt: '', updatedAt: '', board };
  return {
    fetchCases: vi.fn().mockResolvedValue([{ id: '1', name: 'Test Case', description: '', createdAt: '', updatedAt: '' }]),
    fetchCase:  vi.fn().mockResolvedValue(caseItem),
    createCase: vi.fn().mockResolvedValue(caseItem),
    updateCase: vi.fn().mockResolvedValue(caseItem),
    deleteCase: vi.fn().mockResolvedValue(undefined),
    // legacy
    fetchBoard: vi.fn().mockResolvedValue(board),
    saveBoard:  vi.fn().mockResolvedValue(undefined),
  };
});

import Board from '../components/Board';

async function renderBoard() {
  const result = render(<Board />);
  await waitFor(() =>
    expect(document.querySelector('.board:not(.board--loading)')).toBeInTheDocument()
  );
  return result;
}

describe('Board', () => {
  it('shows loading overlay initially, then renders board', async () => {
    await renderBoard();
    expect(document.querySelector('.board')).toBeInTheDocument();
  });

  it('renders cards from loaded state', async () => {
    await renderBoard();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Knife')).toBeInTheDocument();
  });

  it('toggles connect mode on/off via toolbar', async () => {
    await renderBoard();
    const connectBtn = screen.getByText(/Connect/i);
    fireEvent.click(connectBtn);
    expect(document.querySelector('.board--connecting')).toBeInTheDocument();
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText(/Connecting/i));
    expect(document.querySelector('.board--connecting')).not.toBeInTheDocument();
  });

  it('shows connect hint when connect mode is active', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Connect/i));
    expect(screen.getByText(/first card to start/i)).toBeInTheDocument();
  });

  it('selecting first card in connect mode updates hint', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Connect/i));
    const cards = document.querySelectorAll('.card');
    fireEvent.click(cards[0]);
    expect(screen.getByText(/second card to connect/i)).toBeInTheDocument();
    expect(cards[0]).toHaveClass('card--selected');
  });

  it('connecting same card twice deselects it', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Connect/i));
    const card = document.querySelectorAll('.card')[0];
    fireEvent.click(card);
    fireEvent.click(card);
    expect(card).not.toHaveClass('card--selected');
  });

  it('connecting two different cards draws an SVG line', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Connect/i));
    const [c1, c2] = document.querySelectorAll('.card');
    fireEvent.click(c1);
    fireEvent.click(c2);
    await waitFor(() =>
      expect(document.querySelectorAll('.connection-line').length).toBeGreaterThan(0)
    );
  });

  it('opens the Add Card modal when + Add Card is clicked', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Add Card/i));
    expect(screen.getByText('Add New Card')).toBeInTheDocument();
  });

  it('adds a card via the modal', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Add Card/i));
    fireEvent.change(screen.getByPlaceholderText(/Enter title/i), {
      target: { value: 'New Suspect' },
    });
    fireEvent.click(screen.getByText('Add Card', { selector: '.modal__btn--submit' }));
    await waitFor(() => expect(screen.getByText('New Suspect')).toBeInTheDocument());
  });

  it('deletes a card when × is clicked', async () => {
    await renderBoard();
    const deleteBtns = screen.getAllByTitle('Remove card');
    fireEvent.click(deleteBtns[0]);
    await waitFor(() =>
      expect(document.querySelectorAll('.card').length).toBe(1)
    );
  });

  it('clears all cards when Clear Board is clicked', async () => {
    await renderBoard();
    fireEvent.click(screen.getByText(/Clear Board/i));
    await waitFor(() =>
      expect(document.querySelectorAll('.card').length).toBe(0)
    );
  });

  it('renders the case selector dropdown', async () => {
    await renderBoard();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Test Case')).toBeInTheDocument();
  });

  it('switching case via dropdown calls fetchCase', async () => {
    const { fetchCase } = await import('../api');
    await renderBoard();
    // Simulate selecting a different case id
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1' } });
    await waitFor(() => expect(fetchCase).toHaveBeenCalled());
  });

  it('shows + New Case button and opens form', async () => {
    await renderBoard();
    expect(screen.getByText('+ New Case')).toBeInTheDocument();
    fireEvent.click(screen.getByText('+ New Case'));
    expect(screen.getByPlaceholderText('Case name')).toBeInTheDocument();
  });
});
