import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  it('renders all available cases', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    // Check that all patient names are rendered
    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined();
    });
  });

  it('allows selecting an available case', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    // The first case (Beginner) should be available by default
    const firstCase = ALL_CASES[0];
    // Click on the case name (this should bubble up to the card container)
    fireEvent.click(screen.getByText(firstCase.name));

    // After selection, the "Begin Surgery" button should appear
    const beginButton = screen.getByText(/Begin Surgery/i);
    expect(beginButton).toBeDefined();

    // Clicking "Begin Surgery" should call the handler
    fireEvent.click(beginButton);
    expect(onCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('prevents selecting a locked case', () => {
    const onCaseSelected = vi.fn();
    // No completed cases, so only the first one is available. Second one (Intermediate) should be locked.
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    const secondCase = ALL_CASES[1]; // Intermediate case requiring beginner completion
    // Click on the locked case name
    fireEvent.click(screen.getByText(secondCase.name));

    // "Begin Surgery" should NOT appear for the locked case (unless we clicked the first one previously, but here we only clicked the locked one)
    // Actually, if we click a locked case, selectedCase state shouldn't change.
    // If selectedCase is null, "Begin Surgery" is not rendered.
    expect(screen.queryByText(/Begin Surgery/i)).toBeNull();

    // Verify "Locked" overlay text is present
    expect(screen.getAllByText('Locked').length).toBeGreaterThan(0);
  });
});
