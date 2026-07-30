import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn();
  const mockCompletedCaseIds: string[] = [];

  it('renders correctly', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined();
    // Buttons for cases
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('renders case buttons with accessible attributes', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    const firstCase = ALL_CASES[0];
    const button = screen.getByText(firstCase.name).closest('button');

    expect(button).toBeDefined();
    expect(button?.hasAttribute('disabled')).toBe(false);
    expect(button?.getAttribute('aria-pressed')).toBe('false');
  });

  it('selects a case when clicked and shows details', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    const firstCase = ALL_CASES[0];
    const button = screen.getByText(firstCase.name).closest('button');
    fireEvent.click(button!);

    // Now it should be pressed
    expect(button?.getAttribute('aria-pressed')).toBe('true');

    // Details should appear
    expect(screen.getByText(`Pre-Operative Briefing: ${firstCase.name}`)).toBeDefined();

    // "Begin Surgery" button should appear
    const startButton = screen.getByText('Begin Surgery →');
    expect(startButton).toBeDefined();
  });

  it('calls onCaseSelected when start button is clicked', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={mockCompletedCaseIds}
      />
    );

    const firstCase = ALL_CASES[0];
    const caseButton = screen.getByText(firstCase.name).closest('button');
    fireEvent.click(caseButton!);

    const startButton = screen.getByText('Begin Surgery →');
    fireEvent.click(startButton);

    expect(mockOnCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('handles locked cases correctly', () => {
    // Assuming the second case requires the first one to be completed
    const lockedCase = ALL_CASES.find(c => c.unlockRequirement);
    if (!lockedCase) return; // Skip if no locked cases

    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]} // No completed cases
      />
    );

    const lockedButton = screen.getByText(lockedCase.name).closest('button');
    expect(lockedButton?.hasAttribute('disabled')).toBe(true);

    fireEvent.click(lockedButton!);
    expect(screen.queryByText(`Pre-Operative Briefing: ${lockedCase.name}`)).toBeNull();
  });
});
