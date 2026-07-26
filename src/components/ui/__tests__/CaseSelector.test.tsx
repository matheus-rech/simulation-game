import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CaseSelector } from '../CaseSelector'
import { ALL_CASES } from '../../../data/patientCases'

describe('CaseSelector', () => {
  it('renders available case cards as accessible buttons', () => {
    const onCaseSelected = vi.fn()
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />)

    const firstCaseName = ALL_CASES[0].name
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCaseName, 'i') })

    expect(caseButton).toBeTruthy()
    expect(caseButton.hasAttribute('disabled')).toBe(false)
  })

  it('renders locked case cards as disabled buttons', () => {
    const onCaseSelected = vi.fn()
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />)

    const lockedCase = ALL_CASES.find(c => c.unlockRequirement)
    if (!lockedCase) throw new Error('No locked cases found in test data')

    const lockedButton = screen.getByRole('button', { name: new RegExp(lockedCase.name, 'i') })

    expect(lockedButton).toBeTruthy()
    expect(lockedButton.hasAttribute('disabled')).toBe(true)
  })

  it('indicates selected state with aria-pressed', () => {
    const onCaseSelected = vi.fn()
    render(<CaseSelector onCaseSelected={onCaseSelected} completedCaseIds={[]} />)

    const firstCase = ALL_CASES[0]
    const caseButton = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') })

    // Initial state check
    expect(caseButton.getAttribute('aria-pressed')).toBe('false')

    // Click to select
    fireEvent.click(caseButton)

    // Check updated state
    const selectedButton = screen.getByRole('button', { name: new RegExp(firstCase.name, 'i') })
    expect(selectedButton.getAttribute('aria-pressed')).toBe('true')
  })
})
