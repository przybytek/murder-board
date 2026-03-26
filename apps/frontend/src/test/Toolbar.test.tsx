import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Toolbar } from '../components/Toolbar';
import type { SaveStatus } from '../hooks/useBoard';

describe('Toolbar', () => {
  const onAddCard       = vi.fn();
  const onToggleConnect = vi.fn();
  const onClearBoard    = vi.fn();

  beforeEach(() => {
    onAddCard.mockClear();
    onToggleConnect.mockClear();
    onClearBoard.mockClear();
  });

  const onSelectCase = vi.fn();
  const onAddCase    = vi.fn();
  const onDeleteCase = vi.fn();

  const render$ = (connectMode = false, saveStatus: SaveStatus = 'idle') =>
    render(
      <Toolbar
        connectMode={connectMode}
        saveStatus={saveStatus}
        cases={[]}
        activeCaseId={undefined}
        onAddCard={onAddCard}
        onToggleConnect={onToggleConnect}
        onClearBoard={onClearBoard}
        onSelectCase={onSelectCase}
        onAddCase={onAddCase}
        onDeleteCase={onDeleteCase}
      />
    );

  it('renders all buttons', () => {
    render$();
    expect(screen.getByText(/Add Card/i)).toBeInTheDocument();
    expect(screen.getByText(/Connect/i)).toBeInTheDocument();
    expect(screen.getByText(/Clear Board/i)).toBeInTheDocument();
  });

  it('calls onAddCard when + Add Card is clicked', () => {
    render$();
    fireEvent.click(screen.getByText(/Add Card/i));
    expect(onAddCard).toHaveBeenCalled();
  });

  it('calls onToggleConnect when Connect is clicked', () => {
    render$();
    fireEvent.click(screen.getByText(/Connect/i));
    expect(onToggleConnect).toHaveBeenCalled();
  });

  it('calls onClearBoard when Clear Board is clicked', () => {
    render$();
    fireEvent.click(screen.getByText(/Clear Board/i));
    expect(onClearBoard).toHaveBeenCalled();
  });

  it('shows "Connecting…" label and hint when connectMode is true', () => {
    render$(true);
    expect(screen.getByText(/Connecting/i)).toBeInTheDocument();
    expect(screen.getByText(/Click two cards/i)).toBeInTheDocument();
  });

  it('does not show hint when connectMode is false', () => {
    render$(false);
    expect(screen.queryByText(/Click two cards/i)).not.toBeInTheDocument();
  });

  it('shows saving status', () => {
    render$(false, 'saving');
    expect(screen.getByText(/Saving/i)).toBeInTheDocument();
  });

  it('shows saved status', () => {
    render$(false, 'saved');
    expect(screen.getByText(/Saved/i)).toBeInTheDocument();
  });

  it('shows error status', () => {
    render$(false, 'error');
    expect(screen.getByText(/Save failed/i)).toBeInTheDocument();
  });

  it('shows nothing for idle status', () => {
    render$(false, 'idle');
    expect(screen.queryByText(/Saving|Saved|failed/i)).not.toBeInTheDocument();
  });
});
