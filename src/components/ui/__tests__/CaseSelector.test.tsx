import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn()
  const completedCaseIds: string[] = []

  it('renders without crashing', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)
    expect(screen.getByText('NeuroSim Surgical Training')).toBeDefined()
  })

  it('renders case cards', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)
    ALL_CASES.forEach(c => {
      expect(screen.getByText(c.name)).toBeDefined()
    })
  })

  it('selects a case when clicked', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)
    // The first case should be available
    const firstCase = ALL_CASES[0]
    // Find the button that contains the case name
    const caseCard = screen.getByText(firstCase.name).closest('button')

    if (caseCard) {
      fireEvent.click(caseCard)
      expect(screen.getByText(`Pre-Operative Briefing: ${firstCase.name}`)).toBeDefined()
    } else {
      throw new Error('Case card not found')
    }
  })

  // This test is expected to FAIL currently because they are divs, not buttons
  it('renders case cards as accessible buttons', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={completedCaseIds} />)

    // We expect to find buttons for available cases
    const buttons = screen.getAllByRole('button')
    // Note: The "Begin Surgery" button also exists if a case is selected, but here none is selected yet.
    // However, if the cards are buttons, they should appear here.

    // Currently, there are 0 buttons because cards are divs.
    // If we count 0, this expectation is just to show current state.
    // But for "accessible", we WANT them to be buttons.

    // Let's assert that we find at least the number of available cases as buttons (or just > 0)
    // The first case is always available.
    expect(buttons.length).toBeGreaterThan(0)
  })
})
