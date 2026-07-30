import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector - Accessibility & Interaction', () => {
  const mockOnCaseSelected = vi.fn();
  const mockCompletedCaseIds = ['case-001-beginner']; // Assume first case is completed

  it('should render all cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined();
    });
  });

  it('should render cases as interactive buttons', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    // This should find buttons for available cases
    const buttons = screen.getAllByRole('button');
    // We expect at least the available cases to be buttons (plus the "Begin Surgery" button if a case was selected, but none is selected initially)
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should show locked state for unavailable cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Find locked cases - checking for text "Locked"
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);
  });

  it('should call onCaseSelected when "Begin Surgery" is clicked', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    // Click the first available case to select it
    const firstCaseName = ALL_CASES[0].name;
    const caseCard = screen.getByText(firstCaseName);
    fireEvent.click(caseCard);

    // Now find the "Begin Surgery" button
    const startButton = screen.getByText(/Begin Surgery/i);
    fireEvent.click(startButton);

    expect(mockOnCaseSelected).toHaveBeenCalledWith(ALL_CASES[0]);
  });
});
