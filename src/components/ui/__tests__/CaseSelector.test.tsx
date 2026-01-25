import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();

  it('should render all cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Check if case names are present
    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined();
    });
  });

  it('should render cases as buttons', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // We expect buttons for each case
    // Note: Use getAllByRole to ensure they are semantically buttons
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(ALL_CASES.length);
  });

  it('should disable locked cases', () => {
    // With empty completedCaseIds, only the first case should be unlocked
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // First case (Beginner) should be enabled
    const firstCaseButton = screen.getByText(ALL_CASES[0].name).closest('button');
    expect(firstCaseButton).not.toBeNull();
    expect(firstCaseButton?.disabled).toBe(false);

    // Second case (Intermediate, locked) should be disabled
    const secondCaseButton = screen.getByText(ALL_CASES[1].name).closest('button');
    expect(secondCaseButton).not.toBeNull();
    expect(secondCaseButton?.disabled).toBe(true);
  });

  it('should unlock cases when prerequisites are met', () => {
    // Complete the first case
    const completedIds = [ALL_CASES[0].id];

    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={completedIds}
      />
    );

    // Second case should now be enabled
    const secondCaseButton = screen.getByText(ALL_CASES[1].name).closest('button');
    expect(secondCaseButton?.disabled).toBe(false);
  });

  it('should select a case when clicked', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    const firstCaseName = ALL_CASES[0].name;
    const firstCaseButton = screen.getByText(firstCaseName).closest('button');

    if (firstCaseButton) {
      fireEvent.click(firstCaseButton);
    }

    // Clicking case selects it internally, showing the "Begin Surgery" button
    // It does NOT call onCaseSelected yet.

    // Check if "Begin Surgery" button appears
    expect(screen.getByText(/Begin Surgery/i)).toBeDefined();
    expect(screen.getByText(/Pre-Operative Briefing/i)).toBeDefined();
  });

  it('should call onCaseSelected when Start Button is clicked', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Click first case
    const firstCaseButton = screen.getByText(ALL_CASES[0].name).closest('button');
    if (firstCaseButton) fireEvent.click(firstCaseButton);

    // Click Start Button
    const startButton = screen.getByText(/Begin Surgery/i);
    fireEvent.click(startButton);

    expect(mockOnCaseSelected).toHaveBeenCalledWith(ALL_CASES[0]);
  });

  it('should show "Locked" overlay for locked cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Check for "Locked" text
    const lockedElements = screen.getAllByText('Locked');
    expect(lockedElements.length).toBeGreaterThan(0);
  });
});
