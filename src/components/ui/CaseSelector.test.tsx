import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from './CaseSelector';
import { ALL_CASES } from '../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();
  const completedCaseIds: string[] = [];

  it('renders case cards as buttons with correct accessibility attributes', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    ALL_CASES.forEach((c) => {
      // Logic for availability
      const isAvailable = !c.unlockRequirement || completedCaseIds.includes(c.unlockRequirement);

      if (isAvailable) {
        // Should find a button with aria-label containing the case name
        const button = screen.getByRole('button', { name: new RegExp(`Select case: ${c.name}`, 'i') });
        expect(button).toBeTruthy();
        expect(button.hasAttribute('disabled')).toBe(false);
      } else {
        // Locked cases should be disabled
        // Note: getByRole looks for accessible name. The button text is complex, but we added aria-label.
        // However, if aria-label is used, it takes precedence.
        const button = screen.getByRole('button', { name: new RegExp(`Locked case: ${c.name}`, 'i') });
        expect(button).toBeTruthy();
        expect(button.hasAttribute('disabled')).toBe(true);
      }
    });
  });

  it('allows selecting an available case via click', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedCaseIds}
      />
    );

    const firstCase = ALL_CASES[0];
    const button = screen.getByRole('button', { name: new RegExp(`Select case: ${firstCase.name}`, 'i') });

    fireEvent.click(button);

    // After selection, the details box should appear
    expect(screen.getByText(new RegExp(`Pre-Operative Briefing: ${firstCase.name}`, 'i'))).toBeTruthy();
  });
});
