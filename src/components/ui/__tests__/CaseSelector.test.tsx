import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector - Accessibility', () => {
  const mockOnCaseSelected = vi.fn();
  const completedCaseIds: string[] = [];

  it('should render case cards as interactive buttons', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    // Get the first case (Beginner 1) which should be available
    const firstCase = ALL_CASES[0];
    const caseCard = screen.getByText(firstCase.name).closest('button');

    expect(caseCard).not.toBeNull();
    // Manual check without jest-dom
    expect(caseCard?.getAttribute('type')).toBe('button');
  });

  it('should indicate selection state via aria-pressed', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    // Get button for first case
    const caseName = screen.getByText(ALL_CASES[0].name);
    const cardButton = caseName.closest('button');

    expect(cardButton).not.toBeNull();
    // Check initial state (not selected)
    // The component sets aria-pressed={isSelected} which is false initially
    expect(cardButton?.getAttribute('aria-pressed')).toBe('false');
  });

  it('should identify locked cases as disabled', () => {
    // Advanced cases are locked by default if completedCaseIds is empty
    const advancedCase = ALL_CASES.find(c => c.difficulty === 'advanced');
    if (!advancedCase) throw new Error('No advanced case found');

    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    const lockedCardName = screen.getByText(advancedCase.name);
    const lockedButton = lockedCardName.closest('button');

    expect(lockedButton).not.toBeNull();
    expect(lockedButton?.hasAttribute('disabled')).toBe(true);
  });
});
