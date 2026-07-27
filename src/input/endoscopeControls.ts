import { Euler, Vector3 } from 'three'
import type { ScopeAngle } from '../components/EndoscopeView'
import type { Vector3D } from '../components/3d/VFX'

export interface EndoscopeControlState {
  tipPosition: Vector3D
  scopeAngle: ScopeAngle
  rotationZ: number
  level: number
}

const MOVE_STEP = 0.18
const ANGLE_STEP = 0.035
const ROLL_STEP = 0.04

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(Math.max(value, minimum), maximum)

function moveTip(
  state: EndoscopeControlState,
  localDirection: Vector3
): EndoscopeControlState {
  const rotation = new Euler(
    state.scopeAngle.pitch,
    state.scopeAngle.yaw,
    state.rotationZ
  )
  const movement = localDirection
    .clone()
    .applyEuler(rotation)
    .multiplyScalar(MOVE_STEP)

  return {
    ...state,
    tipPosition: {
      x: clamp(state.tipPosition.x + movement.x, -2.5, 2.5),
      y: clamp(state.tipPosition.y + movement.y, -2.5, 2.5),
      z: clamp(state.tipPosition.z + movement.z, -8, 1.2),
    },
  }
}

export function anatomyLevelForPhase(phase: number): number {
  if (phase <= 1) return 1
  if (phase === 2) return 3
  return 5
}

export function applyEndoscopeKey(
  state: EndoscopeControlState,
  key: string
): EndoscopeControlState | null {
  switch (key.toLowerCase()) {
    case 'i':
      return moveTip(state, new Vector3(0, 0, -1))
    case 'k':
      return moveTip(state, new Vector3(0, 0, 1))
    case 'j':
      return moveTip(state, new Vector3(-1, 0, 0))
    case 'l':
      return moveTip(state, new Vector3(1, 0, 0))
    case 'arrowup':
      return {
        ...state,
        scopeAngle: {
          ...state.scopeAngle,
          pitch: clamp(state.scopeAngle.pitch - ANGLE_STEP, -1.1, 1.1),
        },
      }
    case 'arrowdown':
      return {
        ...state,
        scopeAngle: {
          ...state.scopeAngle,
          pitch: clamp(state.scopeAngle.pitch + ANGLE_STEP, -1.1, 1.1),
        },
      }
    case 'arrowleft':
      return {
        ...state,
        scopeAngle: {
          ...state.scopeAngle,
          yaw: clamp(state.scopeAngle.yaw - ANGLE_STEP, -Math.PI, Math.PI),
        },
      }
    case 'arrowright':
      return {
        ...state,
        scopeAngle: {
          ...state.scopeAngle,
          yaw: clamp(state.scopeAngle.yaw + ANGLE_STEP, -Math.PI, Math.PI),
        },
      }
    case 'q':
      return {
        ...state,
        rotationZ: clamp(state.rotationZ - ROLL_STEP, -Math.PI, Math.PI),
      }
    case 'e':
      return {
        ...state,
        rotationZ: clamp(state.rotationZ + ROLL_STEP, -Math.PI, Math.PI),
      }
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
      return {
        ...state,
        level: Number(key),
      }
    default:
      return null
  }
}
