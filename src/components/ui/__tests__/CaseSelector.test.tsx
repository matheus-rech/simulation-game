import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn()
  const completedCaseIds: string[] = []

  it('renders all cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined()
    })
  })

  it('renders cases as accessible buttons', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // We expect each case to be a button
    // This will fail if they are divs
    const buttons = screen.getAllByRole('button', { hidden: true }) // hidden: true to include disabled buttons if any, though standard disabled buttons are still in a11y tree usually

    // We expect at least as many buttons as cases
    expect(buttons.length).toBeGreaterThanOrEqual(ALL_CASES.length)
  })

  it('handles keyboard navigation', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // Just checking if we can tab to the first case
    // This requires the elements to be focusable
    const firstCase = screen.getByText(ALL_CASES[0].name).closest('button')
    // If it's a div, closest('button') will be null
    expect(firstCase).not.toBeNull()
  })
})
