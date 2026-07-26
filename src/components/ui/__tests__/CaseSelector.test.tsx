import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn()
  const completedCaseIds: string[] = []

  it('renders all cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // Check if title is present
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined()

    // Check if each case is rendered
    ALL_CASES.forEach(patientCase => {
      expect(screen.getByText(patientCase.name)).toBeDefined()
    })
  })

  it('allows selecting an available case', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // First case should be available
    const firstCase = ALL_CASES[0]
    // Find the button containing the case name
    const caseCard = screen.getByText(firstCase.name).closest('button')

    expect(caseCard).toBeDefined()

    if (caseCard) {
      fireEvent.click(caseCard)

      // Check if details box appears
      expect(screen.getByText(`Pre-Operative Briefing: ${firstCase.name}`)).toBeDefined()

      // Click start button
      const startButton = screen.getByText('Begin Surgery →')
      fireEvent.click(startButton)

      expect(mockOnCaseSelected).toHaveBeenCalledWith(firstCase)
    }
  })

  it('shows locked state for unavailable cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // Second case should be locked initially (if it requires unlock)
    const lockedCase = ALL_CASES.find(c => c.unlockRequirement)

    if (lockedCase) {
      // This text is inside the locked overlay
      expect(screen.getAllByText('Locked').length).toBeGreaterThan(0)
    }
  })
})
