import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector - Accessibility', () => {
  const mockOnCaseSelected = vi.fn()

  it('should render case cards as buttons', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    // The first case is always available.
    const firstCase = ALL_CASES[0]
    const caseTitle = screen.getByText(firstCase.name)

    // In the accessible version, the card container should be a button
    const caseCardButton = caseTitle.closest('button')
    expect(caseCardButton).not.toBeNull()
    expect(caseCardButton?.getAttribute('type')).toBe('button')
  })

  it('should disable locked cases', () => {
    // Render with no completed cases, so intermediate/advanced cases should be locked
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    // The second case (John Mitchell) requires the first one to be completed
    const lockedCase = ALL_CASES[1]
    const caseTitle = screen.getByText(lockedCase.name)

    const caseCardButton = caseTitle.closest('button')
    expect(caseCardButton).not.toBeNull()
    // In React, 'disabled' attribute is boolean property on the element
    // but in testing-library output it renders as attribute.
    expect(caseCardButton?.hasAttribute('disabled')).toBe(true)
  })
})
