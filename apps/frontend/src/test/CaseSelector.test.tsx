import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { CaseSelector } from '../components/CaseSelector';
import type { CaseListItem } from '@murder-board/shared';

const CASES: CaseListItem[] = [
  { id: '1', name: 'Jack the Ripper', description: 'Victorian murders', createdAt: '', updatedAt: '' },
  { id: '2', name: 'Zodiac Killer',   description: 'Cipher murders',    createdAt: '', updatedAt: '' },
];

describe('CaseSelector', () => {
  const onSelect = vi.fn();
  const onAdd    = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    onSelect.mockClear();
    onAdd.mockClear();
    onDelete.mockClear();
  });

  const render$ = (cases = CASES, activeCaseId = '1') =>
    render(
      <CaseSelector
        cases={cases}
        activeCaseId={activeCaseId}
        onSelect={onSelect}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    );

  it('renders the case dropdown with all options', () => {
    render$();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Jack the Ripper')).toBeInTheDocument();
    expect(screen.getByText('Zodiac Killer')).toBeInTheDocument();
  });

  it('calls onSelect when a different option is chosen', () => {
    render$();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '2' } });
    expect(onSelect).toHaveBeenCalledWith('2');
  });

  it('shows the delete button when multiple cases exist', () => {
    render$();
    expect(screen.getByTitle('Delete this case')).toBeInTheDocument();
  });

  it('does NOT show the delete button when only one case exists', () => {
    render$([CASES[0]], '1');
    expect(screen.queryByTitle('Delete this case')).not.toBeInTheDocument();
  });

  it('shows the + New Case button', () => {
    render$();
    expect(screen.getByText('+ New Case')).toBeInTheDocument();
  });

  it('shows the new-case form when + New Case is clicked', () => {
    render$();
    fireEvent.click(screen.getByText('+ New Case'));
    expect(screen.getByPlaceholderText('Case name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeInTheDocument();
  });

  it('hides the form when Cancel is clicked', () => {
    render$();
    fireEvent.click(screen.getByText('+ New Case'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByPlaceholderText('Case name')).not.toBeInTheDocument();
  });

  it('calls onAdd with name and description when Create is submitted', () => {
    render$();
    fireEvent.click(screen.getByText('+ New Case'));
    fireEvent.change(screen.getByPlaceholderText('Case name'), { target: { value: 'My Case' } });
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), { target: { value: 'Desc' } });
    fireEvent.click(screen.getByText('Create'));
    expect(onAdd).toHaveBeenCalledWith('My Case', 'Desc');
  });

  it('does not submit the form when name is empty', () => {
    render$();
    fireEvent.click(screen.getByText('+ New Case'));
    // name left empty — form has required attribute, browser prevents submit
    // We can verify onAdd is not called when value is whitespace only
    fireEvent.change(screen.getByPlaceholderText('Case name'), { target: { value: '   ' } });
    fireEvent.click(screen.getByText('Create'));
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('shows "No cases" option when cases array is empty', () => {
    render(
      <CaseSelector cases={[]} activeCaseId={undefined} onSelect={onSelect} onAdd={onAdd} onDelete={onDelete} />
    );
    expect(screen.getByText('No cases')).toBeInTheDocument();
  });

  it('clears the form after successful create', () => {
    render$();
    fireEvent.click(screen.getByText('+ New Case'));
    fireEvent.change(screen.getByPlaceholderText('Case name'), { target: { value: 'New' } });
    fireEvent.click(screen.getByText('Create'));
    // form is hidden after submit
    expect(screen.queryByPlaceholderText('Case name')).not.toBeInTheDocument();
  });
});
