import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CaseSelector } from '../CaseSelector'

describe('CaseSelector', () => {
  const mockOnCaseSelected = vi.fn()

  const firstCaseName = 'Maria Santos'
  const secondCaseName = 'John Mitchell'

  it('renders available cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    expect(screen.getByText(firstCaseName)).toBeDefined()
    expect(screen.getByText(secondCaseName)).toBeDefined()
  })

  it('shows locked state for unavailable cases', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    // Check that we have locked indicators
    const lockedIndicators = screen.getAllByText('Locked')
    expect(lockedIndicators.length).toBeGreaterThan(0)
  })

  it('allows selecting an available case', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    // Click Maria Santos
    fireEvent.click(screen.getByText(firstCaseName))

    // Details box should appear
    expect(screen.getByText(`Pre-Operative Briefing: ${firstCaseName}`)).toBeDefined()

    // "Begin Surgery" button should be present
    const beginButton = screen.getByText(/Begin Surgery/i)
    expect(beginButton).toBeDefined()

    // Click "Begin Surgery"
    fireEvent.click(beginButton)
    expect(mockOnCaseSelected).toHaveBeenCalledTimes(1)
    expect(mockOnCaseSelected).toHaveBeenCalledWith(
      expect.objectContaining({ name: firstCaseName })
    )
  })

  it('does not select locked case on click', () => {
    render(<CaseSelector onCaseSelected={mockOnCaseSelected} completedCaseIds={[]} />)

    // Click John Mitchell (Locked)
    fireEvent.click(screen.getByText(secondCaseName))

    // Details box should NOT show John Mitchell
    expect(screen.queryByText(`Pre-Operative Briefing: ${secondCaseName}`)).toBeNull()
  })
})
