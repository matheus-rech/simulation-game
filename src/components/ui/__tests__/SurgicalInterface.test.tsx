import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CASE_BEGINNER_1 } from '../../../data/patientCases'
import { TaskProgress } from '../../../services/TaskManager'
import { SurgicalInterface } from '../SurgicalInterface'

const taskProgress: TaskProgress = {
  currentPhase: 1,
  completedObjectives: [],
  phaseStartTime: 0,
  totalStartTime: 0,
  score: 100,
}

describe('SurgicalInterface layering', () => {
  it('keeps the DOM HUD above the WebGL canvas', () => {
    const { container } = render(
      <SurgicalInterface
        patientCase={CASE_BEGINNER_1}
        taskProgress={taskProgress}
        currentObjective={CASE_BEGINNER_1.objectives[0]}
        elapsedTime={0}
        timeRemaining={CASE_BEGINNER_1.timeLimit * 60}
        phaseProgress={0}
        onExitCase={vi.fn()}
      />
    )

    const overlay = container.firstElementChild as HTMLElement
    expect(Number(overlay.style.zIndex)).toBeGreaterThan(0)
  })
})
