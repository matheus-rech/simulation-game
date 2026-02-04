import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'
import React from 'react'

describe('CaseSelector', () => {
  it('renders case cards as interactive buttons', () => {
    const handleCaseSelected = vi.fn()
    const completedCaseIds: string[] = []

    render(<CaseSelector onCaseSelected={handleCaseSelected} completedCaseIds={completedCaseIds} />)

    // Find the first case (Beginner case)
    const firstCase = ALL_CASES[0]

    // This expectation is the key - it expects a BUTTON with the patient name
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCase.name) })

    expect(caseButton).toBeDefined()
    // Use manual attribute check instead of jest-dom matchers
    expect(caseButton.hasAttribute('disabled')).toBe(false)

    // Simulate click
    fireEvent.click(caseButton)

    // Verify that the details section appears with the "Begin Surgery" button
    const startButton = screen.getByText(/Begin Surgery/i)
    expect(startButton).toBeDefined()

    // Click start button
    fireEvent.click(startButton)

    // Verify callback
    expect(handleCaseSelected).toHaveBeenCalledWith(firstCase)
  })

  it('handles locked cases correctly', () => {
    const handleCaseSelected = vi.fn()
    const completedCaseIds: string[] = []

    render(<CaseSelector onCaseSelected={handleCaseSelected} completedCaseIds={completedCaseIds} />)

    // Find a locked case (Advanced case usually requires previous ones)
    // Assuming the 3rd case is locked initially
    const lockedCase = ALL_CASES[2]

    // Should still be found as a button, but disabled
    const caseButton = screen.getByRole('button', { name: new RegExp(lockedCase.name) })

    // Use manual attribute check instead of jest-dom matchers
    expect(caseButton.hasAttribute('disabled')).toBe(true)
  })
})
