/**
 * AI Mentor Integration Example
 *
 * Complete working example of integrating AI surgical mentor into the app.
 * Copy relevant sections into App.tsx to enable AI mentorship.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { EndoscopeView, ScopeAngle } from '../components/EndoscopeView'
import { Vector3D } from '../components/3d/VFX'
import { CrisisEvent } from '../components/3d/collision/types'
import { SafetyZone } from '../components/3d/safety/SafetyCorridorManager'
import { useAIMentor, createDefaultSimulationState } from '../hooks/useAIMentor'
import { MentorOverlay } from '../components/ui/MentorOverlay'

// ============================================================================
// Example 1: Basic Integration
// ============================================================================

export function AppWithBasicMentor() {
  // Existing state
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(100)
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 })
  const [tipPosition, setTipPosition] = useState<Vector3D>({ x: 0, y: 0, z: 1.2 })
  const [collisionCount, setCollisionCount] = useState(0)
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([])

  // Create simulation state for AI mentor
  const simulationState = createDefaultSimulationState(level, score, tipPosition, scopeAngle)

  // Initialize AI mentor with basic config
  const mentor = useAIMentor(simulationState, {
    enabled: true,
    analysisInterval: 3000, // Analyze every 3 seconds
    useStreaming: true,
    includeHistory: true,
  })

  // Register canvas for scene capture
  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      mentor.registerCanvas(canvas)
    }
  }, [mentor])

  const handleRaycastCollision = useCallback((point: Vector3D) => {
    setCollisionCount(count => count + 1)
    setScore(prev => Math.max(prev - 2, 0))
  }, [])

  const handleCrisis = useCallback((crisis: CrisisEvent) => {
    setActiveCrisis(crisis)
    setScore(prev => Math.max(prev - 50, 0))
  }, [])

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      {/* Existing 3D view */}
      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={0}
        collision={null}
        onRaycastCollision={handleRaycastCollision}
        onCrisis={handleCrisis}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
      />

      {/* AI Mentor Overlay */}
      <MentorOverlay
        response={mentor.response}
        isAnalyzing={mentor.isAnalyzing}
        error={mentor.error}
        isStreaming={mentor.config.useStreaming}
        streamingText={mentor.streamingText}
        showConfidence={true}
        position="top-right"
      />

      {/* Debug info */}
      {mentor.isReady && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            color: '#4CAF50',
            fontSize: '0.8rem',
          }}
        >
          ✓ AI Mentor Active
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Example 2: Advanced Integration with Controls
// ============================================================================

export function AppWithAdvancedMentor() {
  // State
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(100)
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 })
  const [tipPosition, setTipPosition] = useState<Vector3D>({ x: 0, y: 0, z: 1.2 })
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([])

  // AI Mentor config (user-controllable)
  const [mentorEnabled, setMentorEnabled] = useState(true)
  const [mentorInterval, setMentorInterval] = useState(3000)
  const [useStreaming, setUseStreaming] = useState(true)

  const simulationState = createDefaultSimulationState(level, score, tipPosition, scopeAngle)

  const mentor = useAIMentor(simulationState, {
    enabled: mentorEnabled,
    analysisInterval: mentorInterval,
    useStreaming,
    includeHistory: true,
  })

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      mentor.registerCanvas(canvas)
    }
  }, [mentor])

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={0}
        collision={null}
        onRaycastCollision={() => {}}
        onCrisis={() => {}}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
      />

      {/* AI Mentor Overlay */}
      {mentorEnabled && (
        <MentorOverlay
          response={mentor.response}
          isAnalyzing={mentor.isAnalyzing}
          error={mentor.error}
          isStreaming={useStreaming}
          streamingText={mentor.streamingText}
          showConfidence={true}
          position="top-right"
        />
      )}

      {/* Mentor Controls */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          background: 'rgba(15, 10, 10, 0.85)',
          padding: 16,
          borderRadius: 8,
          color: '#f7e5da',
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '0.9rem' }}>AI Mentor Controls</h3>

        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={mentorEnabled}
            onChange={e => setMentorEnabled(e.target.checked)}
          />{' '}
          Enable Mentor
        </label>

        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem' }}>
          <input
            type="checkbox"
            checked={useStreaming}
            onChange={e => setUseStreaming(e.target.checked)}
          />{' '}
          Streaming Mode
        </label>

        <label style={{ display: 'block', marginBottom: 8, fontSize: '0.85rem' }}>
          Analysis Interval: {mentorInterval / 1000}s
          <input
            type="range"
            min="2000"
            max="10000"
            step="1000"
            value={mentorInterval}
            onChange={e => setMentorInterval(Number(e.target.value))}
            style={{ display: 'block', width: '100%', marginTop: 4 }}
          />
        </label>

        <div
          style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(247, 229, 218, 0.1)' }}
        >
          <button
            onClick={mentor.triggerAnalysis}
            style={{
              padding: '6px 12px',
              background: 'rgba(100, 150, 255, 0.2)',
              border: '1px solid rgba(100, 150, 255, 0.4)',
              borderRadius: 4,
              color: '#a0c4ff',
              cursor: 'pointer',
              marginRight: 8,
            }}
            type="button"
          >
            Analyze Now
          </button>

          <button
            onClick={mentor.clearHistory}
            style={{
              padding: '6px 12px',
              background: 'rgba(247, 229, 218, 0.08)',
              border: '1px solid rgba(247, 229, 218, 0.3)',
              borderRadius: 4,
              color: '#f7e5da',
              cursor: 'pointer',
            }}
            type="button"
          >
            Clear History
          </button>
        </div>

        <div style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.7 }}>
          {mentor.isReady ? '✓ Ready' : '⚠ Not initialized'}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Example 3: Structure Highlighting Integration
// ============================================================================

export function AppWithStructureHighlighting() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(100)
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 })
  const [tipPosition, setTipPosition] = useState<Vector3D>({ x: 0, y: 0, z: 1.2 })
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([])

  // Track highlighted structures
  const [highlightedStructures, setHighlightedStructures] = useState<Set<string>>(new Set())

  const simulationState = createDefaultSimulationState(level, score, tipPosition, scopeAngle)
  const mentor = useAIMentor(simulationState, { enabled: true })

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      mentor.registerCanvas(canvas)
    }
  }, [mentor])

  const handleHighlightStructure = (structure: string) => {
    const newHighlighted = new Set(highlightedStructures)
    if (newHighlighted.has(structure)) {
      newHighlighted.delete(structure)
    } else {
      newHighlighted.add(structure)
    }
    setHighlightedStructures(newHighlighted)

    // TODO: Pass highlightedStructures to EndoscopeView to enable visual highlighting
    console.log('Highlight structure:', structure, 'Active:', newHighlighted.has(structure))
  }

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={0}
        collision={null}
        onRaycastCollision={() => {}}
        onCrisis={() => {}}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
        // TODO: Add highlightedStructures prop
        // highlightedStructures={Array.from(highlightedStructures)}
      />

      <MentorOverlay
        response={mentor.response}
        isAnalyzing={mentor.isAnalyzing}
        error={mentor.error}
        showConfidence={true}
        position="top-right"
        onHighlightStructure={handleHighlightStructure}
      />
    </div>
  )
}

// ============================================================================
// Example 4: Crisis Response Integration
// ============================================================================

export function AppWithCrisisResponse() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(100)
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 })
  const [tipPosition, setTipPosition] = useState<Vector3D>({ x: 0, y: 0, z: 1.2 })
  const [activeCrisis, setActiveCrisis] = useState<CrisisEvent | null>(null)
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([])

  const simulationState = {
    ...createDefaultSimulationState(level, score, tipPosition, scopeAngle),
    activeCrisis,
    safetyZones,
  }

  const mentor = useAIMentor(simulationState, { enabled: true })

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      mentor.registerCanvas(canvas)
    }
  }, [mentor])

  const handleCrisis = useCallback(
    (crisis: CrisisEvent) => {
      setActiveCrisis(crisis)
      setScore(prev => Math.max(prev - 50, 0))

      // Trigger immediate analysis on crisis
      setTimeout(() => {
        mentor.triggerAnalysis()
      }, 100)
    },
    [mentor]
  )

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={0}
        collision={null}
        onRaycastCollision={() => {}}
        onCrisis={handleCrisis}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
      />

      {/* Crisis alert takes priority */}
      {activeCrisis && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            padding: 24,
            background: 'rgba(183, 28, 43, 0.95)',
            borderRadius: 12,
            color: '#ffffff',
            zIndex: 1000,
            border: '2px solid #ff4444',
            textAlign: 'center',
          }}
        >
          <h2>🚨 CRITICAL EVENT</h2>
          <p>{activeCrisis.description}</p>
          <button
            onClick={() => setActiveCrisis(null)}
            style={{
              marginTop: 12,
              padding: '8px 16px',
              background: '#fff',
              color: '#B71C2B',
              border: 'none',
              borderRadius: 4,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            type="button"
          >
            Acknowledge
          </button>
        </div>
      )}

      {/* Mentor provides crisis management guidance */}
      <MentorOverlay
        response={mentor.response}
        isAnalyzing={mentor.isAnalyzing}
        error={mentor.error}
        showConfidence={true}
        position="top-right"
      />
    </div>
  )
}

// ============================================================================
// Example 5: Performance Monitoring
// ============================================================================

export function AppWithPerformanceMonitoring() {
  const [level, setLevel] = useState(1)
  const [score, setScore] = useState(100)
  const [scopeAngle, setScopeAngle] = useState<ScopeAngle>({ pitch: 0.05, yaw: 0 })
  const [tipPosition, setTipPosition] = useState<Vector3D>({ x: 0, y: 0, z: 1.2 })
  const [safetyZones, setSafetyZones] = useState<SafetyZone[]>([])

  // Performance tracking
  const [analysisCount, setAnalysisCount] = useState(0)
  const [avgLatency, setAvgLatency] = useState(0)
  const [cacheHitRate, setCacheHitRate] = useState(0)

  const simulationState = createDefaultSimulationState(level, score, tipPosition, scopeAngle)
  const mentor = useAIMentor(simulationState, { enabled: true })

  useEffect(() => {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      mentor.registerCanvas(canvas)
    }
  }, [mentor])

  // Track analysis performance
  useEffect(() => {
    if (!mentor.isAnalyzing) {
      setAnalysisCount(prev => prev + 1)
      // TODO: Track actual latency from service
    }
  }, [mentor.isAnalyzing])

  return (
    <div style={{ height: '100vh', width: '100vw', background: '#0f0a0a' }}>
      <EndoscopeView
        level={level}
        scopeAngle={scopeAngle}
        tipPosition={tipPosition}
        rotationZ={0}
        collision={null}
        onRaycastCollision={() => {}}
        onCrisis={() => {}}
        onSafetyChange={setSafetyZones}
        showSafetySpheres={false}
      />

      <MentorOverlay
        response={mentor.response}
        isAnalyzing={mentor.isAnalyzing}
        error={mentor.error}
        showConfidence={true}
        position="top-right"
      />

      {/* Performance Stats */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          background: 'rgba(15, 10, 10, 0.85)',
          padding: 12,
          borderRadius: 8,
          color: '#f7e5da',
          fontSize: '0.75rem',
          minWidth: 200,
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>AI Mentor Stats</h4>
        <div>Analysis Count: {analysisCount}</div>
        <div>Avg Latency: {avgLatency.toFixed(0)}ms</div>
        <div>Cache Hit Rate: {(cacheHitRate * 100).toFixed(0)}%</div>
        <div>Status: {mentor.isReady ? '✓ Ready' : '⚠ Not Ready'}</div>
      </div>
    </div>
  )
}
