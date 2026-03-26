import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';

beforeEach(() => {
  localStorage.clear();
});

describe('App Component', () => {
  it('renders the murder board', () => {
    render(<App />);
    expect(document.querySelector('.board')).toBeInTheDocument();
  });

  it('renders the toolbar with Add Card button', () => {
    render(<App />);
    expect(screen.getByText(/Add Card/i)).toBeInTheDocument();
  });

  it('renders the default sample cards', () => {
    render(<App />);
    expect(document.querySelectorAll('.card').length).toBeGreaterThan(0);
  });

  it('shows the connect button', () => {
    render(<App />);
    expect(screen.getByText(/Connect/i)).toBeInTheDocument();
  });
});
