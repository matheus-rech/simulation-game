import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();

  it('renders all available cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Check if the title is rendered
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined();

    // Check if the first case name is rendered
    expect(screen.getByText(ALL_CASES[0].name)).toBeDefined();
  });

  it('selects a case when clicked', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
      />
    );

    // Click the first case (unlocked by default)
    const firstCaseName = ALL_CASES[0].name;
    const caseCard = screen.getByText(firstCaseName);
    fireEvent.click(caseCard);

    // Should show the "Begin Surgery" button after selection
    const beginButton = screen.getByText('Begin Surgery →');
    expect(beginButton).toBeDefined();

    // Click begin button
    fireEvent.click(beginButton);
    expect(mockOnCaseSelected).toHaveBeenCalledWith(expect.objectContaining({
        id: ALL_CASES[0].id
    }));
  });

  it('does not select a locked case when clicked', () => {
    // Determine a locked case (requires previous case completion)
    // Assuming the second case requires the first case to be completed
    const lockedCase = ALL_CASES.find(c => c.unlockRequirement);

    if (!lockedCase) {
        // If no locked cases exist in data, skip this test logic or force a scenario
        console.warn('No locked cases found in test data');
        return;
    }

    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]} // No completed cases, so lockedCase should be locked
      />
    );

    const lockedCaseName = lockedCase.name;
    const lockedCard = screen.getByText(lockedCaseName);

    // Attempt to click
    fireEvent.click(lockedCard);

    // "Begin Surgery" should NOT appear if selection failed (or if it selected but button is for a different case? No, selection shouldn't happen)
    // Actually, if we click a locked card, setSelectedCase shouldn't run.
    // We can check if the "Pre-Operative Briefing: [Locked Case Name]" appears.

    const briefingTitle = screen.queryByText(`Pre-Operative Briefing: ${lockedCase.name}`);
    expect(briefingTitle).toBeNull();
  });
});
