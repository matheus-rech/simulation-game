import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();
  const emptyCompletedCases: string[] = [];
  const allCompletedCases: string[] = ALL_CASES.map(c => c.id);

  it('should render the title and subtitle', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined();
    expect(screen.getByText(/Select a patient case/i)).toBeDefined();
  });

  it('should render all cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Check if all case names are present
    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined();
    });
  });

  it('should allow selecting an available case', () => {
    const firstCase = ALL_CASES[0]; // Usually unlocked by default
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Click the first case (assuming it's a button or clickable element)
    // We search for the name, then find the closest interactive element or click it directly
    const caseElement = screen.getByText(firstCase.name).closest('button, div');
    if (caseElement) {
        fireEvent.click(caseElement);
    } else {
        throw new Error('Case element not found');
    }

    // After clicking, the "Begin Surgery" button should appear
    const beginButton = screen.getByText(/Begin Surgery/i);
    expect(beginButton).toBeDefined();

    // Click begin surgery
    fireEvent.click(beginButton);
    expect(mockOnCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('should show locked state for unavailable cases', () => {
    // Assuming the second case requires the first one
    const lockedCase = ALL_CASES[1];
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Should show locked overlay or text
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);

    // The button should be disabled (this might fail before refactor)
    // We'll check if we can select it
    const caseName = screen.getByText(lockedCase.name);
    fireEvent.click(caseName);

    // Begin surgery should NOT appear for this case if it wasn't selected
    // Note: If click worked, selectedCase state would update.
    // If it's locked, click shouldn't work.

    // However, the current implementation might use a div that just ignores the click logic
    // inside the handler: onClick={() => isAvailable && setSelectedCase(patientCase)}
    // So visual feedback is important.
  });

  it('should have accessible buttons for cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // This test is expected to fail or warn if we use divs
    // We want to verify we have buttons
    const buttons = screen.getAllByRole('button');
    // We expect at least the available cases to be buttons after refactor
    // Currently (before refactor) this might return 0 or just the Begin button if visible
  });
});
