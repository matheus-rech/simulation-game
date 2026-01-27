import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCollisionManager } from '../CollisionManager'
import { TissueType } from '../../materials/TissueMaterials'
import { CrisisType } from '../types'

describe('CollisionManager - Hook Integration Tests', () => {
  // Mock callbacks
  const mockOnScoreChange = vi.fn()
  const mockOnCollision = vi.fn()
  const mockOnCrisis = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Basic Collision Handling', () => {
    it('should handle basic collision event', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
          onCollision: mockOnCollision,
        })
      )

      const position = { x: 1, y: 2, z: 3 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA, 0.8)
      })

      // Should call collision callback
      expect(mockOnCollision).toHaveBeenCalledTimes(1)
      expect(mockOnCollision).toHaveBeenCalledWith(
        expect.objectContaining({
          position,
          tissueType: TissueType.MUCOSA,
          intensity: 0.8,
        })
      )

      // Should update score (Mucosa has penalty of 1)
      expect(mockOnScoreChange).toHaveBeenCalledWith(-1)
    })

    it('should work without callbacks', () => {
      const { result } = renderHook(() => useCollisionManager())

      expect(() => {
        result.current.handleCollision({ x: 0, y: 0, z: 0 }, TissueType.BONE)
      }).not.toThrow()
    })

    it('should use default intensity of 1.0', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCollision: mockOnCollision,
        })
      )

      act(() => {
        result.current.handleCollision({ x: 0, y: 0, z: 0 }, TissueType.BONE)
      })

      expect(mockOnCollision).toHaveBeenCalledWith(
        expect.objectContaining({
          intensity: 1.0,
        })
      )
    })
  })

  describe('Debouncing', () => {
    it('should debounce rapid collisions', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        result.current.handleCollision(position, TissueType.MUCOSA)
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      // Only first collision should be processed
      expect(mockOnScoreChange).toHaveBeenCalledTimes(1)
    })

    it('should allow collisions after debounce period', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      // Advance time past debounce period (250ms)
      act(() => {
        vi.advanceTimersByTime(300)
      })

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      // Both collisions should be processed
      expect(mockOnScoreChange).toHaveBeenCalledTimes(2)
    })

    it('should maintain debounce at exactly 250ms', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.BONE)
      })

      // Advance time to just before debounce expires
      act(() => {
        vi.advanceTimersByTime(249)
      })

      act(() => {
        result.current.handleCollision(position, TissueType.BONE)
      })

      // Second collision should be ignored (within debounce)
      expect(mockOnScoreChange).toHaveBeenCalledTimes(1)

      // Advance 1ms more (total 250ms)
      act(() => {
        vi.advanceTimersByTime(1)
      })

      act(() => {
        result.current.handleCollision(position, TissueType.BONE)
      })

      // Third collision should be processed (after debounce)
      expect(mockOnScoreChange).toHaveBeenCalledTimes(2)
    })
  })

  describe('Tissue-Specific Responses', () => {
    it('should apply correct score penalties for each tissue', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      // Test each tissue type
      const tissueTests: Array<[TissueType, number]> = [
        [TissueType.MUCOSA, -1],
        [TissueType.BONE, -3],
        [TissueType.DURA, -5],
        [TissueType.TUMOR, -2],
        [TissueType.PSEUDOCAPSULE, -3],
        [TissueType.ICA, -100],
        [TissueType.MWCS, -10],
      ]

      tissueTests.forEach(([tissue, expectedPenalty], index) => {
        mockOnScoreChange.mockClear()

        act(() => {
          // Advance time to bypass debounce
          if (index > 0) vi.advanceTimersByTime(300)
          result.current.handleCollision(position, tissue)
        })

        expect(mockOnScoreChange).toHaveBeenCalledWith(expectedPenalty)
      })
    })

    it('should identify critical tissues correctly', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCollision: mockOnCollision,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      // Test non-critical tissue
      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      // Test critical tissue (ICA)
      act(() => {
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.ICA)
      })

      expect(mockOnCollision).toHaveBeenCalledTimes(2)
    })
  })

  describe('Crisis Triggering', () => {
    it('should trigger ICA injury crisis on ICA collision', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 1, y: 2, z: 3 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
      })

      // Should trigger crisis
      expect(mockOnCrisis).toHaveBeenCalledTimes(1)
      expect(mockOnCrisis).toHaveBeenCalledWith(
        expect.objectContaining({
          type: CrisisType.ICA_INJURY,
          description: expect.stringContaining('CRITICAL'),
        })
      )
    })

    it('should trigger CSF leak on dura collision (probabilistic)', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      // Try multiple times to account for 30% probability
      let crisisTriggered = false

      for (let i = 0; i < 50; i++) {
        mockOnCrisis.mockClear()

        act(() => {
          vi.advanceTimersByTime(300)
          result.current.handleCollision(position, TissueType.DURA)
        })

        if (mockOnCrisis.mock.calls.length > 0) {
          crisisTriggered = true
          expect(mockOnCrisis).toHaveBeenCalledWith(
            expect.objectContaining({
              type: CrisisType.CSF_LEAK,
            })
          )
          break
        }
      }

      // With 50 tries and 30% probability, should trigger at least once
      expect(crisisTriggered).toBe(true)
    })

    it('should not trigger crisis on non-critical tissues', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      // Test all non-crisis tissues
      const nonCrisisTissues = [
        TissueType.MUCOSA,
        TissueType.BONE,
        TissueType.TUMOR,
        TissueType.PSEUDOCAPSULE,
        TissueType.MWCS,
      ]

      nonCrisisTissues.forEach((tissue, index) => {
        act(() => {
          if (index > 0) vi.advanceTimersByTime(300)
          result.current.handleCollision(position, tissue)
        })
      })

      // No crisis should be triggered
      expect(mockOnCrisis).not.toHaveBeenCalled()
    })

    it('should include collision details in crisis event', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCrisis: mockOnCrisis,
        })
      )

      const position = { x: 5, y: 10, z: 15 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA, 0.9)
      })

      expect(mockOnCrisis).toHaveBeenCalledWith(
        expect.objectContaining({
          collision: expect.objectContaining({
            position,
            tissueType: TissueType.ICA,
            intensity: 0.9,
          }),
        })
      )
    })
  })

  describe('Statistics Tracking', () => {
    it('should track total collisions', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.DURA)
      })

      const stats = result.current.getStats()

      expect(stats.total).toBe(3)
    })

    it('should track collisions by tissue type', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      const stats = result.current.getStats()

      expect(stats.byTissue[TissueType.MUCOSA]).toBe(2)
      expect(stats.byTissue[TissueType.BONE]).toBe(1)
      expect(stats.byTissue[TissueType.DURA]).toBe(0)
    })

    it('should track critical collisions', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.ICA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      const stats = result.current.getStats()

      expect(stats.critical).toBe(1) // Only ICA is critical
    })

    it('should track last collision', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position1 = { x: 1, y: 1, z: 1 }
      const position2 = { x: 2, y: 2, z: 2 }

      act(() => {
        result.current.handleCollision(position1, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position2, TissueType.BONE)
      })

      const stats = result.current.getStats()

      expect(stats.lastCollision).toEqual(
        expect.objectContaining({
          position: position2,
          tissueType: TissueType.BONE,
        })
      )
    })

    it('should return null for last collision when no collisions occurred', () => {
      const { result } = renderHook(() => useCollisionManager())

      const stats = result.current.getStats()

      expect(stats.lastCollision).toBeNull()
    })
  })

  describe('Crisis History', () => {
    it('should track all crises', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
      })

      const crises = result.current.getActiveCrises()

      expect(crises).toHaveLength(1)
      expect(crises[0]).toEqual(
        expect.objectContaining({
          type: CrisisType.ICA_INJURY,
        })
      )
    })

    it('should accumulate multiple crises', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      // Trigger ICA crisis
      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
        vi.advanceTimersByTime(300)
      })

      // Try to trigger CSF leak (probabilistic)
      act(() => {
        for (let i = 0; i < 50; i++) {
          vi.advanceTimersByTime(300)
          result.current.handleCollision(position, TissueType.DURA)
        }
      })

      const crises = result.current.getActiveCrises()

      // Should have at least the ICA crisis
      expect(crises.length).toBeGreaterThanOrEqual(1)
      expect(crises.some(c => c.type === CrisisType.ICA_INJURY)).toBe(true)
    })
  })

  describe('Reset Functionality', () => {
    it('should reset collision history', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      let stats = result.current.getStats()
      expect(stats.total).toBe(2)

      act(() => {
        result.current.reset()
      })

      stats = result.current.getStats()
      expect(stats.total).toBe(0)
    })

    it('should reset crisis history', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.ICA)
      })

      let crises = result.current.getActiveCrises()
      expect(crises).toHaveLength(1)

      act(() => {
        result.current.reset()
      })

      crises = result.current.getActiveCrises()
      expect(crises).toHaveLength(0)
    })

    it('should reset debounce timer', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onScoreChange: mockOnScoreChange,
        })
      )

      const position = { x: 0, y: 0, z: 0 }

      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      expect(mockOnScoreChange).toHaveBeenCalledTimes(1)

      act(() => {
        result.current.reset()
      })

      mockOnScoreChange.mockClear()

      // Should allow immediate collision after reset
      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
      })

      expect(mockOnScoreChange).toHaveBeenCalledTimes(1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero intensity', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCollision: mockOnCollision,
        })
      )

      act(() => {
        result.current.handleCollision({ x: 0, y: 0, z: 0 }, TissueType.MUCOSA, 0)
      })

      expect(mockOnCollision).toHaveBeenCalledWith(
        expect.objectContaining({
          intensity: 0,
        })
      )
    })

    it('should handle high intensity', () => {
      const { result } = renderHook(() =>
        useCollisionManager({
          onCollision: mockOnCollision,
        })
      )

      act(() => {
        result.current.handleCollision({ x: 0, y: 0, z: 0 }, TissueType.BONE, 10.0)
      })

      expect(mockOnCollision).toHaveBeenCalledWith(
        expect.objectContaining({
          intensity: 10.0,
        })
      )
    })

    it('should handle rapid resets', () => {
      const { result } = renderHook(() => useCollisionManager())

      expect(() => {
        result.current.reset()
        result.current.reset()
        result.current.reset()
      }).not.toThrow()
    })

    it('should maintain separate collision counts after multiple resets', () => {
      const { result } = renderHook(() => useCollisionManager())

      const position = { x: 0, y: 0, z: 0 }

      // Session 1
      act(() => {
        result.current.handleCollision(position, TissueType.MUCOSA)
        result.current.reset()
      })

      // Session 2
      act(() => {
        result.current.handleCollision(position, TissueType.BONE)
        vi.advanceTimersByTime(300)
        result.current.handleCollision(position, TissueType.BONE)
      })

      const stats = result.current.getStats()
      expect(stats.total).toBe(2)
      expect(stats.byTissue[TissueType.MUCOSA]).toBe(0)
      expect(stats.byTissue[TissueType.BONE]).toBe(2)
    })
  })
})
