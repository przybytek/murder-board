import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardState } from '@murder-board/shared';

// Mock the API module so tests never hit the network or real localStorage
vi.mock('../api', () => {
  const state: BoardState = {
    cards: [
      { id: '1', type: 'suspect',  title: 'John Doe',      description: 'Test suspect', x: 80,  y: 130 },
      { id: '2', type: 'clue',     title: 'Bloody Knife',  description: 'Test clue',    x: 380, y: 180 },
    ],
    connections: [{ id: 'c1', from: '1', to: '2' }],
  };
  return {
    fetchBoard: vi.fn().mockResolvedValue(state),
    saveBoard:  vi.fn().mockResolvedValue(undefined),
  };
});

import App from '../App';

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('App Component', () => {
  it('renders the murder board after loading', async () => {
    render(<App />);
    await waitFor(() =>
      expect(document.querySelector('.board:not(.board--loading)')).toBeInTheDocument()
    );
  });

  it('renders the toolbar with Add Card button', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Add Card/i)).toBeInTheDocument());
  });

  it('renders the default sample cards', async () => {
    render(<App />);
    await waitFor(() =>
      expect(document.querySelectorAll('.card').length).toBeGreaterThan(0)
    );
  });

  it('shows the connect button', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText(/Connect/i)).toBeInTheDocument());
  });
});
