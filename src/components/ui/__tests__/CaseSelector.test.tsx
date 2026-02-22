import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn()

  it('should render all cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)
    ALL_CASES.forEach(c => {
      expect(screen.getByText(c.name)).toBeDefined()
    })
  })

  it('should render case cards as buttons for accessibility', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)
    // We expect buttons for each case.
    const buttons = screen.queryAllByRole('button')
    expect(buttons.length).toBe(ALL_CASES.length)
  })

  it('should mark locked cases as disabled', () => {
    // Assuming case-002 requires case-001, so with empty completedCaseIds, case-002 is locked
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    const buttons = screen.getAllByRole('button')
    // We expect one button per case.
    expect(buttons.length).toBe(ALL_CASES.length)

    // Assuming order is preserved, the second button corresponds to the second case
    const lockedButton = buttons[1]
    expect(lockedButton.hasAttribute('disabled')).toBe(true)
  })

  it('should toggle selection state and show details', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
    const firstButton = buttons[0]

    // Click it
    fireEvent.click(firstButton)

    // Should show details
    expect(screen.getByText(/Pre-Operative Briefing/)).toBeDefined()

    // Verify aria-pressed
    expect(firstButton.getAttribute('aria-pressed')).toBe('true')
  })

  it('should render Training Mode button and invoke callback on click', () => {
    const mockOnEnterCurriculumMode = vi.fn()
    render(
      <CaseSelector
        onCaseSelected={mockOnCaseSelected}
        completedCaseIds={[]}
        onEnterCurriculumMode={mockOnEnterCurriculumMode}
      />
    )

    const trainingButton = screen.getByRole('button', { name: /Enter Skills Training Mode/ })
    expect(trainingButton).toBeDefined()

    fireEvent.click(trainingButton)
    expect(mockOnEnterCurriculumMode).toHaveBeenCalledTimes(1)
  })
})
