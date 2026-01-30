import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  it('renders all cases', () => {
    const handleSelected = vi.fn();
    render(<CaseSelector onCaseSelected={handleSelected} completedCaseIds={[]} />);

    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).not.toBeNull();
    });
  });

  it('renders case cards as accessible buttons', () => {
    const handleSelected = vi.fn();
    render(<CaseSelector onCaseSelected={handleSelected} completedCaseIds={[]} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(ALL_CASES.length);

    expect(buttons[0].textContent).toContain(ALL_CASES[0].name);
  });

  it('handles case selection and enables "Begin Surgery"', () => {
    const handleSelected = vi.fn();
    render(<CaseSelector onCaseSelected={handleSelected} completedCaseIds={[]} />);

    const buttons = screen.getAllByRole('button');
    // We assume the first case is available (not disabled)
    fireEvent.click(buttons[0]);

    const startButton = screen.getByText(/Begin Surgery/i);
    expect(startButton).not.toBeNull();

    fireEvent.click(startButton);
    expect(handleSelected).toHaveBeenCalledWith(ALL_CASES[0]);
  });

  it('disables locked cases', () => {
     const handleSelected = vi.fn();
     render(<CaseSelector onCaseSelected={handleSelected} completedCaseIds={[]} />);

     const lockedCase = ALL_CASES[1];
     const lockedButton = screen.getByText(lockedCase.name).closest('button');

     expect(lockedButton).not.toBeNull();
     expect(lockedButton?.hasAttribute('disabled')).toBe(true);
  });
});
