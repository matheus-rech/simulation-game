import { useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

/**
 * PerformanceMonitor - Real-time performance statistics
 *
 * Tracks:
 * - FPS (frames per second)
 * - Frame time (milliseconds per frame)
 * - Memory usage (if available)
 * - Triangle count
 * - Draw calls
 * - Texture memory
 *
 * Updates at 2 Hz (every 500ms) to avoid performance impact
 */

export interface PerformanceStats {
  fps: number
  frameTime: number
  memory: {
    used: number
    limit: number
  } | null
  triangles: number
  drawCalls: number
  geometries: number
  textures: number
}

export interface PerformanceMonitorProps {
  /** Show the overlay */
  visible?: boolean
  /** Update frequency in ms (default: 500) */
  updateInterval?: number
}

export function PerformanceMonitor({
  visible = true,
  updateInterval = 500,
}: PerformanceMonitorProps) {
  const { gl, scene } = useThree()
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    memory: null,
    triangles: 0,
    drawCalls: 0,
    geometries: 0,
    textures: 0,
  })

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const lastUpdate = useRef(performance.now())

  // Update stats every frame (but only display periodically)
  useFrame(() => {
    const now = performance.now()
    frameCount.current++

    // Update display every updateInterval ms
    if (now - lastUpdate.current >= updateInterval) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastUpdate.current))
      const frameTime = (now - lastUpdate.current) / frameCount.current

      // Count scene objects
      let triangles = 0
      let geometries = 0
      scene.traverse((object: any) => {
        if (object.geometry) {
          geometries++
          if (object.geometry.index) {
            triangles += object.geometry.index.count / 3
          } else if (object.geometry.attributes.position) {
            triangles += object.geometry.attributes.position.count / 3
          }
        }
      })

      // Get memory info (if available)
      let memory = null
      if ((performance as any).memory) {
        const memInfo = (performance as any).memory
        memory = {
          used: Math.round(memInfo.usedJSHeapSize / 1048576), // MB
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576), // MB
        }
      }

      // Get renderer info
      const info = gl.info
      const drawCalls = info.render.calls
      const textures = info.memory.textures

      setStats({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        memory,
        triangles: Math.round(triangles),
        drawCalls,
        geometries,
        textures,
      })

      // Reset counters
      frameCount.current = 0
      lastUpdate.current = now
    }

    lastTime.current = now
  })

  if (!visible) return null

  return (
    <div
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        background: 'rgba(15, 10, 10, 0.9)',
        borderRadius: 8,
        padding: 12,
        color: '#f7e5da',
        fontFamily: "'Courier New', monospace",
        fontSize: '0.75rem',
        zIndex: 100,
        border: '1px solid rgba(247, 229, 218, 0.3)',
        minWidth: 180,
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{ marginBottom: 8, fontWeight: 600, fontSize: '0.85rem' }}>
        ⚡ Performance
      </div>

      <StatLine
        label="FPS"
        value={stats.fps}
        unit=""
        color={stats.fps >= 55 ? '#4ade80' : stats.fps >= 30 ? '#fbbf24' : '#ef4444'}
      />
      <StatLine label="Frame" value={stats.frameTime} unit="ms" />
      <StatLine label="Triangles" value={formatNumber(stats.triangles)} unit="" />
      <StatLine label="Draw Calls" value={stats.drawCalls} unit="" />
      <StatLine label="Geometries" value={stats.geometries} unit="" />
      <StatLine label="Textures" value={stats.textures} unit="" />

      {stats.memory && (
        <>
          <div style={{ margin: '8px 0', borderTop: '1px solid rgba(247, 229, 218, 0.2)' }} />
          <StatLine
            label="Memory"
            value={stats.memory.used}
            unit={`MB / ${stats.memory.limit} MB`}
            color={
              stats.memory.used / stats.memory.limit > 0.8
                ? '#ef4444'
                : stats.memory.used / stats.memory.limit > 0.6
                  ? '#fbbf24'
                  : '#4ade80'
            }
          />
        </>
      )}
    </div>
  )
}

/**
 * Stat line component
 */
function StatLine({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: number | string
  unit: string
  color?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
      }}
    >
      <span style={{ opacity: 0.7 }}>{label}:</span>
      <span style={{ fontWeight: 600, color: color || '#f7e5da' }}>
        {value} {unit}
      </span>
    </div>
  )
}

/**
 * Format large numbers with commas
 */
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * Hook to use performance stats in parent components
 */
export function usePerformanceStats(): PerformanceStats {
  const { gl, scene } = useThree()
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    memory: null,
    triangles: 0,
    drawCalls: 0,
    geometries: 0,
    textures: 0,
  })

  const frameCount = useRef(0)
  const lastUpdate = useRef(performance.now())

  useFrame(() => {
    const now = performance.now()
    frameCount.current++

    if (now - lastUpdate.current >= 500) {
      const fps = Math.round((frameCount.current * 1000) / (now - lastUpdate.current))
      const frameTime = (now - lastUpdate.current) / frameCount.current

      let triangles = 0
      let geometries = 0
      scene.traverse((object: any) => {
        if (object.geometry) {
          geometries++
          if (object.geometry.index) {
            triangles += object.geometry.index.count / 3
          } else if (object.geometry.attributes.position) {
            triangles += object.geometry.attributes.position.count / 3
          }
        }
      })

      let memory = null
      if ((performance as any).memory) {
        const memInfo = (performance as any).memory
        memory = {
          used: Math.round(memInfo.usedJSHeapSize / 1048576),
          limit: Math.round(memInfo.jsHeapSizeLimit / 1048576),
        }
      }

      const info = gl.info

      setStats({
        fps,
        frameTime: Math.round(frameTime * 100) / 100,
        memory,
        triangles: Math.round(triangles),
        drawCalls: info.render.calls,
        geometries,
        textures: info.memory.textures,
      })

      frameCount.current = 0
      lastUpdate.current = now
    }
  })

  return stats
}
