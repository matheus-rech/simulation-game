import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  it('renders case cards as buttons', () => {
    const onCaseSelected = vi.fn();
    const completedCaseIds: string[] = [];

    render(
      <CaseSelector
        onCaseSelected={onCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    // Find the first case (Beginner 1) - it should be unlocked
    const firstCase = ALL_CASES[0];
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });

    expect(caseButton).toBeDefined();
    expect(caseButton.hasAttribute('disabled')).toBe(false);

    // Click it
    fireEvent.click(caseButton);
    // The component updates internal state, but doesn't call onCaseSelected until "Begin Surgery" is clicked

    // Check if the "Begin Surgery" button appears
    const beginButton = screen.getByRole('button', { name: /Begin Surgery/i });
    expect(beginButton).toBeDefined();

    // Click begin surgery
    fireEvent.click(beginButton);
    expect(onCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('renders locked cases as disabled buttons', () => {
    const onCaseSelected = vi.fn();
    const completedCaseIds: string[] = [];

    render(
      <CaseSelector
        onCaseSelected={onCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    // Find the second case (Intermediate 1) - it requires Beginner 1, so it should be locked
    const lockedCase = ALL_CASES[1];
    // Since it's locked, we expect it to be disabled if we implement it correctly.
    // However, the current implementation uses divs, so getByRole('button') will fail anyway.
    // If we implement it as disabled button:
    const lockedButton = screen.getByRole('button', { name: new RegExp(lockedCase.name, 'i') });

    expect(lockedButton).toBeDefined();
    expect(lockedButton.hasAttribute('disabled')).toBe(true);
  });
});
