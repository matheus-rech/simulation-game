import { useEffect, useState, useCallback } from 'react'

/**
 * DebugControls - Development utilities for debugging and optimization
 *
 * Keyboard shortcuts:
 * - W: Toggle wireframe mode
 * - S: Toggle stats overlay (FPS, memory)
 * - C: Toggle collision sphere visualization
 * - H: Show/hide help overlay
 *
 * Features:
 * - Wireframe rendering for geometry inspection
 * - Performance statistics
 * - Collision visualization
 * - Real-time toggling without page reload
 *
 * NOTE: This component handles keyboard input and UI only.
 * Scene manipulation (wireframe) is handled by WireframeController inside Canvas.
 */

export interface DebugState {
  wireframe: boolean
  stats: boolean
  collisionSpheres: boolean
  showHelp: boolean
}

export interface DebugControlsProps {
  /** Initial debug state */
  initialState?: Partial<DebugState>
  /** Callback when debug state changes */
  onStateChange?: (state: DebugState) => void
}

const DEFAULT_STATE: DebugState = {
  wireframe: false,
  stats: false,
  collisionSpheres: false,
  showHelp: false,
}

export function DebugControls({ initialState, onStateChange }: DebugControlsProps) {
  const [debugState, setDebugState] = useState<DebugState>({
    ...DEFAULT_STATE,
    ...initialState,
  })

  // Keyboard event handler
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if typing in input field
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return
      }

      const key = event.key.toLowerCase()

      setDebugState((prev) => {
        const newState = { ...prev }

        switch (key) {
          case 'w':
            newState.wireframe = !prev.wireframe
            console.log(`🔧 Wireframe: ${newState.wireframe ? 'ON' : 'OFF'}`)
            break
          case 's':
            newState.stats = !prev.stats
            console.log(`🔧 Stats Overlay: ${newState.stats ? 'ON' : 'OFF'}`)
            break
          case 'c':
            newState.collisionSpheres = !prev.collisionSpheres
            console.log(`🔧 Collision Spheres: ${newState.collisionSpheres ? 'ON' : 'OFF'}`)
            break
          case 'h':
            newState.showHelp = !prev.showHelp
            break
          default:
            return prev // No change
        }

        // Notify parent
        onStateChange?.(newState)
        return newState
      })
    },
    [onStateChange]
  )

  // Register keyboard listeners
  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleKeyPress])

  // Help overlay (if enabled)
  if (debugState.showHelp) {
    return (
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(15, 10, 10, 0.95)',
          borderRadius: 12,
          padding: 24,
          color: '#f7e5da',
          fontFamily: "'Courier New', monospace",
          zIndex: 100,
          border: '1px solid rgba(247, 229, 218, 0.3)',
          minWidth: 320,
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', textAlign: 'center' }}>
          🔧 Debug Controls
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <DebugHelpItem shortcut="W" description="Toggle Wireframe" />
          <DebugHelpItem shortcut="S" description="Toggle Stats Overlay" />
          <DebugHelpItem shortcut="C" description="Toggle Collision Spheres" />
          <DebugHelpItem shortcut="H" description="Hide This Help" />
        </div>
        <p
          style={{
            margin: '16px 0 0 0',
            fontSize: '0.85rem',
            opacity: 0.7,
            textAlign: 'center',
          }}
        >
          Press H to close
        </p>
      </div>
    )
  }

  // Minimal UI indicator when help is hidden
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        background: 'rgba(15, 10, 10, 0.7)',
        borderRadius: 8,
        padding: '8px 12px',
        color: '#f7e5da',
        fontFamily: "'Courier New', monospace",
        fontSize: '0.75rem',
        zIndex: 10,
        border: '1px solid rgba(247, 229, 218, 0.2)',
        opacity: 0.6,
      }}
    >
      Press H for debug controls
    </div>
  )
}

/**
 * Help item component
 */
function DebugHelpItem({ shortcut, description }: { shortcut: string; description: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <kbd
        style={{
          background: 'rgba(247, 229, 218, 0.1)',
          border: '1px solid rgba(247, 229, 218, 0.3)',
          borderRadius: 4,
          padding: '4px 8px',
          fontWeight: 600,
          minWidth: 32,
          textAlign: 'center',
        }}
      >
        {shortcut}
      </kbd>
      <span style={{ opacity: 0.9 }}>{description}</span>
    </div>
  )
}

/**
 * Hook to use debug state from parent components
 */
export function useDebugState() {
  const [debugState, setDebugState] = useState<DebugState>(DEFAULT_STATE)

  return {
    debugState,
    setDebugState,
    isWireframe: debugState.wireframe,
    isStatsVisible: debugState.stats,
    isCollisionVisible: debugState.collisionSpheres,
  }
}
