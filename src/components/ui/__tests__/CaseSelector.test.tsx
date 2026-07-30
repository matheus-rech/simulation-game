import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();
  const defaultProps = {
    onCaseSelected: mockOnCaseSelected,
    completedCaseIds: [],
  };

  it('should render the title', () => {
    render(<CaseSelector {...defaultProps} />);
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined();
  });

  it('should render all cases as buttons', () => {
    render(<CaseSelector {...defaultProps} />);
    // ALL_CASES has 3 cases
    const buttons = screen.getAllByRole('button');
    // It might find the "Begin Surgery" button if a case is selected (which isn't initially)
    // or if the card itself is a button.
    // So initially there should be 3 buttons (the cases).

    expect(buttons.length).toBeGreaterThanOrEqual(ALL_CASES.length);

    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined();
    });
  });

  it('should allow selecting an available case', () => {
    render(<CaseSelector {...defaultProps} />);

    // The first case is always available.
    const firstCase = ALL_CASES[0];
    const caseElement = screen.getByText(firstCase.name).closest('button');

    expect(caseElement).not.toBeNull();
    if (caseElement) {
        fireEvent.click(caseElement);

        // After selection, the "Begin Surgery" button should appear
        expect(screen.getByText('Begin Surgery →')).toBeDefined();
    }
  });

  it('should not allow selecting a locked case', () => {
    render(<CaseSelector {...defaultProps} />);

    // The second case is locked if completedCaseIds is empty
    const secondCase = ALL_CASES[1];
    const caseElement = screen.getByText(secondCase.name).closest('button');

    expect(caseElement).not.toBeNull();
    if (caseElement) {
        expect(caseElement.hasAttribute('disabled')).toBe(true);
        fireEvent.click(caseElement);

        // "Begin Surgery" should NOT appear for locked case
        expect(screen.queryByText('Begin Surgery →')).toBeNull();
    }
  });

  it('should render case cards as accessible buttons', () => {
      render(<CaseSelector {...defaultProps} />);
      // This test is specifically targeting the improvement
      // It expects case cards to be buttons
      const caseButtons = screen.queryAllByRole('button');

      expect(caseButtons.length).toBeGreaterThanOrEqual(ALL_CASES.length);
  });
});
