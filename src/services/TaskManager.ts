/**
 * Task Manager - Tracks surgical objectives and phase progression
 *
 * Manages task completion, phase advancement, and provides contextual feedback
 */

import { PatientCase, SurgicalObjective } from '../data/patientCases'

export interface TaskProgress {
  currentPhase: number
  completedObjectives: string[]
  phaseStartTime: number
  totalStartTime: number
  score: number
}

export interface TaskFeedback {
  type: 'success' | 'warning' | 'error' | 'info'
  message: string
  objectiveId?: string
}

export class TaskManager {
  private patientCase: PatientCase
  private progress: TaskProgress
  private onProgressUpdate: (progress: TaskProgress) => void
  private onFeedback: (feedback: TaskFeedback) => void

  constructor(
    patientCase: PatientCase,
    onProgressUpdate: (progress: TaskProgress) => void,
    onFeedback: (feedback: TaskFeedback) => void
  ) {
    this.patientCase = patientCase
    this.onProgressUpdate = onProgressUpdate
    this.onFeedback = onFeedback

    this.progress = {
      currentPhase: 1,
      completedObjectives: [],
      phaseStartTime: Date.now(),
      totalStartTime: Date.now(),
      score: 100,
    }
  }

  /**
   * Get current surgical objective
   */
  getCurrentObjective(): SurgicalObjective | null {
    return (
      this.patientCase.objectives.find(
        obj =>
          obj.phase === this.progress.currentPhase &&
          !this.progress.completedObjectives.includes(obj.id)
      ) || null
    )
  }

  /**
   * Get all objectives for current phase
   */
  getCurrentPhaseObjectives(): SurgicalObjective[] {
    return this.patientCase.objectives.filter(obj => obj.phase === this.progress.currentPhase)
  }

  /**
   * Get next objective in sequence
   */
  getNextObjective(): SurgicalObjective | null {
    const currentPhaseObjs = this.getCurrentPhaseObjectives()
    const nextInPhase = currentPhaseObjs.find(
      obj => !this.progress.completedObjectives.includes(obj.id)
    )

    if (nextInPhase) return nextInPhase

    // Check next phase
    return (
      this.patientCase.objectives.find(obj => obj.phase === this.progress.currentPhase + 1) || null
    )
  }

  /**
   * Mark objective as completed
   */
  completeObjective(objectiveId: string): void {
    if (this.progress.completedObjectives.includes(objectiveId)) {
      return // Already completed
    }

    const objective = this.patientCase.objectives.find(obj => obj.id === objectiveId)
    if (!objective) {
      console.warn(`Objective ${objectiveId} not found`)
      return
    }

    // Check if within time limit
    const elapsed = (Date.now() - this.progress.phaseStartTime) / 1000
    const timeBonus = objective.timeLimit && elapsed < objective.timeLimit ? 5 : 0

    // Update progress
    this.progress.completedObjectives.push(objectiveId)
    this.progress.score += timeBonus

    // Provide feedback
    this.onFeedback({
      type: 'success',
      message: `✓ ${objective.title} completed! ${timeBonus > 0 ? `(+${timeBonus} time bonus)` : ''}`,
      objectiveId,
    })

    // Check if phase is complete
    const phaseObjectives = this.getCurrentPhaseObjectives()
    const allPhaseComplete = phaseObjectives.every(obj =>
      this.progress.completedObjectives.includes(obj.id)
    )

    if (allPhaseComplete) {
      this.advancePhase()
    }

    this.onProgressUpdate({ ...this.progress })
  }

  /**
   * Advance to next surgical phase
   */
  private advancePhase(): void {
    const nextPhase = this.progress.currentPhase + 1
    const hasNextPhase = this.patientCase.objectives.some(obj => obj.phase === nextPhase)

    if (!hasNextPhase) {
      // Surgery complete!
      this.onFeedback({
        type: 'success',
        message: `🎉 Surgery completed! Final score: ${this.progress.score}/100`,
      })
      return
    }

    this.progress.currentPhase = nextPhase
    this.progress.phaseStartTime = Date.now()

    const nextObjective = this.getCurrentObjective()
    this.onFeedback({
      type: 'info',
      message: `Advancing to Phase ${nextPhase}: ${nextObjective?.title}`,
    })

    this.onProgressUpdate({ ...this.progress })
  }

  /**
   * Apply score penalty (from collision, complication, etc.)
   */
  applyPenalty(points: number, reason: string): void {
    this.progress.score = Math.max(0, this.progress.score + points) // points will be negative

    this.onFeedback({
      type: points <= -10 ? 'error' : 'warning',
      message: `${reason} (${points} points)`,
    })

    this.onProgressUpdate({ ...this.progress })
  }

  /**
   * Get phase progress percentage
   */
  getPhaseProgress(): number {
    const phaseObjs = this.getCurrentPhaseObjectives()
    const completedInPhase = phaseObjs.filter(obj =>
      this.progress.completedObjectives.includes(obj.id)
    ).length

    return phaseObjs.length > 0 ? (completedInPhase / phaseObjs.length) * 100 : 0
  }

  /**
   * Get overall progress percentage
   */
  getOverallProgress(): number {
    return this.patientCase.objectives.length > 0
      ? (this.progress.completedObjectives.length / this.patientCase.objectives.length) * 100
      : 0
  }

  /**
   * Get elapsed time in seconds
   */
  getElapsedTime(): number {
    return Math.floor((Date.now() - this.progress.totalStartTime) / 1000)
  }

  /**
   * Get time remaining in current phase (if time limit exists)
   */
  getPhaseTimeRemaining(): number | null {
    const currentObj = this.getCurrentObjective()
    if (!currentObj?.timeLimit) return null

    const elapsed = Math.floor((Date.now() - this.progress.phaseStartTime) / 1000)
    return Math.max(0, currentObj.timeLimit - elapsed)
  }

  /**
   * Get total time remaining for case
   */
  getTotalTimeRemaining(): number {
    const elapsed = this.getElapsedTime()
    const totalLimit = this.patientCase.timeLimit * 60 // convert to seconds
    return Math.max(0, totalLimit - elapsed)
  }

  /**
   * Check if surgery is over time
   */
  isOverTime(): boolean {
    return this.getTotalTimeRemaining() === 0
  }

  /**
   * Check if all objectives completed
   */
  isCompleted(): boolean {
    return this.progress.completedObjectives.length === this.patientCase.objectives.length
  }

  /**
   * Get current progress state
   */
  getProgress(): TaskProgress {
    return { ...this.progress }
  }

  /**
   * Get patient case
   */
  getCase(): PatientCase {
    return this.patientCase
  }

  /**
   * Format time as MM:SS
   */
  static formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /**
   * Get performance grade based on score
   */
  static getGrade(score: number): string {
    if (score >= 90) return 'A'
    if (score >= 80) return 'B'
    if (score >= 70) return 'C'
    if (score >= 60) return 'D'
    return 'F'
  }

  /**
   * Get performance assessment message
   */
  static getPerformanceMessage(score: number, elapsedSeconds: number, timeLimit: number): string {
    const grade = TaskManager.getGrade(score)
    const timePercent = (elapsedSeconds / (timeLimit * 60)) * 100

    let message = `Grade ${grade} (${score}/100)\n\n`

    if (grade === 'A') {
      message += 'Excellent performance! '
    } else if (grade === 'B') {
      message += 'Good work. '
    } else if (grade === 'C') {
      message += 'Satisfactory. '
    } else {
      message += 'Needs improvement. '
    }

    if (timePercent < 80) {
      message += 'Efficient time management.'
    } else if (timePercent < 100) {
      message += 'Adequate time management.'
    } else {
      message += 'Exceeded time limit - work on efficiency.'
    }

    return message
  }
}
