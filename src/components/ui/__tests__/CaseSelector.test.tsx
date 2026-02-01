import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector - Accessibility & Interaction', () => {
  const mockOnCaseSelected = vi.fn();
  const emptyCompletedCases: string[] = [];

  it('should render case cards as buttons', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Get all buttons in the grid
    const caseButtons = screen.getAllByRole('button');
    expect(caseButtons.length).toBeGreaterThan(0);

    // Verify specifically for the first case
    // Using accessible name lookup which includes text content
    const firstCaseButton = screen.getByRole('button', { name: new RegExp(ALL_CASES[0].name, 'i') });
    expect(firstCaseButton).toBeDefined();
    expect(firstCaseButton.tagName).toBe('BUTTON');
  });

  it('should have disabled state for locked cases', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Find the intermediate case (which should be locked if beginner is not completed)
    const intermediateCase = ALL_CASES[1];
    // Note: Locked case might have "Locked" text which is part of its accessible name
    const lockedButton = screen.getByRole('button', { name: new RegExp(intermediateCase.name, 'i') });

    expect(lockedButton.hasAttribute('disabled')).toBe(true);
  });

  it('should indicate selected state with aria-pressed', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    const firstCase = ALL_CASES[0];
    const button = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });

    // Initially not selected (aria-pressed is boolean false in React, but rendered as attribute)
    // Actually React 19 might handle this differently, let's check attribute existence or value
    // If it's false, it might be "false" string or missing?
    // In the code: aria-pressed={isSelected}
    // If isSelected is false, aria-pressed="false"
    expect(button.getAttribute('aria-pressed')).toBe('false');

    // Click to select
    fireEvent.click(button);

    // Now should be selected
    expect(button.getAttribute('aria-pressed')).toBe('true');
  });

  it('should show "Begin Surgery" button only when case is selected', () => {
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    // Initially hidden
    expect(screen.queryByText(/Begin Surgery/i)).toBeNull();

    // Select a case
    const firstCase = ALL_CASES[0];
    const button = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });
    fireEvent.click(button);

    // Now visible
    const startButton = screen.getByText(/Begin Surgery/i);
    expect(startButton).toBeDefined();

    // Click start button
    fireEvent.click(startButton);
    expect(mockOnCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('should handle keyboard focus events', () => {
      render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={emptyCompletedCases}
      />
    );

    const firstCase = ALL_CASES[0];
    const button = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') });

    // Focus
    fireEvent.focus(button);
    // We can't easily test inline style changes via RTL without checking style prop directly
    // but we can verify the event doesn't crash
    expect(button).toBeDefined();

    // Blur
    fireEvent.blur(button);
    expect(button).toBeDefined();
  });
});
