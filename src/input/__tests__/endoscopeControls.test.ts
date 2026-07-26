import { describe, expect, it } from 'vitest'
import {
  anatomyLevelForPhase,
  applyEndoscopeKey,
  EndoscopeControlState,
} from '../endoscopeControls'

const initialState: EndoscopeControlState = {
  tipPosition: { x: 0, y: 0, z: 1.2 },
  scopeAngle: { pitch: 0.05, yaw: 0 },
  rotationZ: 0,
  level: 1,
}

describe('applyEndoscopeKey', () => {
  it('moves the endoscope forward along its viewing direction', () => {
    const nextState = applyEndoscopeKey(initialState, 'i')

    expect(nextState).not.toBeNull()
    expect(nextState!.tipPosition.z).toBeLessThan(initialState.tipPosition.z)
  })

  it('updates pitch, yaw, and roll controls independently', () => {
    const pitched = applyEndoscopeKey(initialState, 'ArrowUp')!
    const yawed = applyEndoscopeKey(initialState, 'ArrowRight')!
    const rolled = applyEndoscopeKey(initialState, 'e')!

    expect(pitched.scopeAngle.pitch).toBeLessThan(initialState.scopeAngle.pitch)
    expect(yawed.scopeAngle.yaw).toBeGreaterThan(initialState.scopeAngle.yaw)
    expect(rolled.rotationZ).toBeGreaterThan(initialState.rotationZ)
  })

  it('makes every anatomy level reachable for simulation testing', () => {
    expect(applyEndoscopeKey(initialState, '5')!.level).toBe(5)
  })

  it('reveals anatomy as the serious-game phase advances', () => {
    expect([1, 2, 3, 4].map(anatomyLevelForPhase)).toEqual([1, 3, 5, 5])
  })

  it('ignores unrelated keyboard input', () => {
    expect(applyEndoscopeKey(initialState, 'h')).toBeNull()
  })
})
