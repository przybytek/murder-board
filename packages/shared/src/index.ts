export type CardType = 'suspect' | 'clue' | 'evidence' | 'note';

export interface BoardCard {
  id: string;
  type: CardType;
  title: string;
  description: string;
  x: number;
  y: number;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
}

export interface BoardState {
  cards: BoardCard[];
  connections: Connection[];
}

export interface Case {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  board: BoardState;
}

export interface CaseListItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}
