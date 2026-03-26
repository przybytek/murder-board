import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Minimal localStorage mock for jsdom environments where it may be incomplete
const store: Record<string, string> = {};
const localStorageMock = {
  getItem:  (key: string) => store[key] ?? null,
  setItem:  (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear:    () => { Object.keys(store).forEach(k => delete store[k]); },
  get length() { return Object.keys(store).length; },
  key: (i: number) => Object.keys(store)[i] ?? null,
};
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Allow vitest to use React act() automatically
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

export { vi };
