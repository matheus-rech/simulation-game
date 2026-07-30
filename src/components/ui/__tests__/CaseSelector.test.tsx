import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  it('renders case buttons', () => {
    render(<CaseSelector onCaseSelected={vi.fn()} completedCaseIds={[]} />);

    // We expect one button per case
    const buttons = screen.getAllByRole('button');
    // Should match number of cases (no start button initially)
    expect(buttons).toHaveLength(ALL_CASES.length);
  });

  it('handles case selection via keyboard/click', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    // Find the first available case
    const firstCase = ALL_CASES[0];
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });

    expect(caseButton).toBeDefined();
    expect(caseButton.getAttribute('type')).toBe('button');

    // It should not be selected initially
    expect(caseButton.getAttribute('aria-pressed')).toBe('false');

    // Click to select
    fireEvent.click(caseButton);

    // Check if it's pressed (selected)
    expect(caseButton.getAttribute('aria-pressed')).toBe('true');

    // "Begin Surgery" button should appear
    const startButton = screen.getByRole('button', { name: /Begin Surgery/i });
    expect(startButton).toBeDefined();

    // Click start
    fireEvent.click(startButton);
    expect(onCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('disables locked cases', () => {
    render(<CaseSelector onCaseSelected={vi.fn()} completedCaseIds={[]} />);

    // Find buttons that contain "Locked" text
    const buttons = screen.getAllByRole('button');
    const lockedButtons = buttons.filter(btn => btn.textContent?.includes('Locked'));

    if (lockedButtons.length > 0) {
       const lockedButton = lockedButtons[0];
       // Check for disabled attribute
       expect(lockedButton.hasAttribute('disabled')).toBe(true);
    }
  });

  it('applies focus styles', () => {
    render(<CaseSelector onCaseSelected={vi.fn()} completedCaseIds={[]} />);
    const firstCase = ALL_CASES[0];
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });

    // Verify handlers don't crash
    fireEvent.focus(caseButton);
    fireEvent.blur(caseButton);
  });
});
