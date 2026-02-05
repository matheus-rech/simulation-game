import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CaseSelector } from '../CaseSelector';
import { ALL_CASES } from '../../../data/patientCases';

describe('CaseSelector', () => {
  it('renders all cases', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    // Check if titles of all cases are present
    ALL_CASES.forEach(patientCase => {
      const elements = screen.getAllByText(patientCase.name);
      expect(elements.length).toBeGreaterThan(0);
    });
  });

  it('selects a case when clicked and shows start button', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    const firstCase = ALL_CASES[0];
    // Find the button. Using closest('button') is robust.
    const button = screen.getByText(firstCase.name).closest('button');
    expect(button).toBeTruthy();

    if (button) {
      fireEvent.click(button);
    }

    // Check if "Begin Surgery" button appears
    const startButton = screen.getByText(/Begin Surgery/i);
    expect(startButton).toBeTruthy();

    // Click start button
    fireEvent.click(startButton);
    expect(onCaseSelected).toHaveBeenCalledWith(firstCase);
  });

  it('renders locked cases as disabled', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    // Find a locked case (e.g. Intermediate requires Beginner)
    // We assume the first case is beginner and available, and others might be locked if dependency exists.
    // Let's find one that has unlockRequirement.
    const lockedCase = ALL_CASES.find(c => c.unlockRequirement);

    if (lockedCase) {
      const lockedButton = screen.getByText(lockedCase.name).closest('button');
      expect(lockedButton).toBeTruthy();
      expect(lockedButton?.hasAttribute('disabled')).toBe(true);
    }
  });

  it('sets aria-pressed when selected', () => {
    const onCaseSelected = vi.fn();
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />);

    const firstCase = ALL_CASES[0];
    const button = screen.getByText(firstCase.name).closest('button');

    // Initially not selected (or false depending on implementation, here we check for 'false' string or null if not set, but standard is 'false' or 'true' if we set it)
    // In our code: aria-pressed={isSelected}. So it should be 'false' or 'true'.
    // React renders boolean false as "false" string in aria attributes usually?
    // Actually React might not render attribute if false? No, for aria-pressed it usually renders 'false'.
    // Let's check the behavior.

    // Note: In React, aria-pressed={false} renders aria-pressed="false".
    expect(button?.getAttribute('aria-pressed')).toBe('false');

    if (button) {
      fireEvent.click(button);
      // Rerender happens automatically in tests usually? No, the component state updates.
      // We need to wait for update? render/fireEvent are synchronous but state updates might need waitFor if async.
      // But React state updates inside event handlers in tests are usually flushed immediately by fireEvent.
      expect(button.getAttribute('aria-pressed')).toBe('true');
    }
  });
});
