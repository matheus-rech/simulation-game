import { useRef, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'

/**
 * PerformanceProfiler - Multi-agent performance monitoring
 *
 * Tracks key performance metrics across rendering, memory, and system layers:
 * - FPS (frames per second)
 * - Frame time (ms per frame)
 * - Memory usage (heap size)
 * - Draw calls and triangle count
 * - Geometry and texture memory
 */

export interface PerformanceMetrics {
  fps: number
  frameTime: number
  memory: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null
  renderer: {
    drawCalls: number
    triangles: number
    geometries: number
    textures: number
  }
  timestamp: number
}

export interface PerformanceProfilerProps {
  /** Sampling interval in ms (default 1000ms) */
  samplingInterval?: number
  /** Callback when metrics are collected */
  onMetrics?: (metrics: PerformanceMetrics) => void
  /** Enable console logging */
  verbose?: boolean
}

export function PerformanceProfiler({
  samplingInterval = 1000,
  onMetrics,
  verbose = false,
}: PerformanceProfilerProps) {
  const { gl } = useThree()
  const frameCount = useRef(0)
  const lastSampleTime = useRef(Date.now())
  const frameTimes = useRef<number[]>([])
  const lastFrameTime = useRef(Date.now())

  useFrame(() => {
    frameCount.current++

    // Track frame time
    const now = Date.now()
    const frameTime = now - lastFrameTime.current
    lastFrameTime.current = now
    frameTimes.current.push(frameTime)

    // Keep only last 60 frame times (1 second at 60fps)
    if (frameTimes.current.length > 60) {
      frameTimes.current.shift()
    }

    // Sample metrics at interval
    const elapsed = now - lastSampleTime.current
    if (elapsed >= samplingInterval) {
      const fps = (frameCount.current / elapsed) * 1000
      const avgFrameTime = frameTimes.current.reduce((a, b) => a + b, 0) / frameTimes.current.length

      const metrics: PerformanceMetrics = {
        fps: Math.round(fps),
        frameTime: Math.round(avgFrameTime * 10) / 10,
        memory: getMemoryMetrics(),
        renderer: getRendererMetrics(gl),
        timestamp: now,
      }

      if (onMetrics) {
        onMetrics(metrics)
      }

      if (verbose) {
        logMetrics(metrics)
      }

      // Reset counters
      frameCount.current = 0
      lastSampleTime.current = now
    }
  })

  return null
}

/**
 * Get memory metrics (Chrome/Edge only)
 */
function getMemoryMetrics() {
  if ('memory' in performance) {
    const mem = (performance as any).memory
    return {
      usedJSHeapSize: mem.usedJSHeapSize,
      totalJSHeapSize: mem.totalJSHeapSize,
      jsHeapSizeLimit: mem.jsHeapSizeLimit,
    }
  }
  return null
}

/**
 * Get WebGL renderer metrics
 */
function getRendererMetrics(gl: any) {
  const info = gl.info

  return {
    drawCalls: info.render.calls,
    triangles: info.render.triangles,
    geometries: info.memory.geometries,
    textures: info.memory.textures,
  }
}

/**
 * Log metrics to console
 */
function logMetrics(metrics: PerformanceMetrics) {
  console.group('🔍 Performance Metrics')
  console.log(`FPS: ${metrics.fps}`)
  console.log(`Frame Time: ${metrics.frameTime}ms`)

  if (metrics.memory) {
    const usedMB = (metrics.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
    const totalMB = (metrics.memory.totalJSHeapSize / 1024 / 1024).toFixed(2)
    const limitMB = (metrics.memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)
    console.log(`Memory: ${usedMB}MB / ${totalMB}MB (limit: ${limitMB}MB)`)
  }

  console.log('Renderer:', metrics.renderer)
  console.groupEnd()
}

/**
 * Hook for using performance metrics
 */
export function usePerformanceMetrics(samplingInterval = 1000) {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  return { metrics, setMetrics, samplingInterval }
}

/**
 * Performance analysis utilities
 */
export const PerformanceAnalyzer = {
  /**
   * Check if FPS is below target
   */
  isBelowTarget(metrics: PerformanceMetrics, targetFPS = 60): boolean {
    return metrics.fps < targetFPS
  },

  /**
   * Check if memory usage is high
   */
  isHighMemory(metrics: PerformanceMetrics, thresholdMB = 100): boolean {
    if (!metrics.memory) return false
    const usedMB = metrics.memory.usedJSHeapSize / 1024 / 1024
    return usedMB > thresholdMB
  },

  /**
   * Check if draw calls are excessive
   */
  isHighDrawCalls(metrics: PerformanceMetrics, threshold = 100): boolean {
    return metrics.renderer.drawCalls > threshold
  },

  /**
   * Get performance grade (A-F)
   */
  getGrade(metrics: PerformanceMetrics): string {
    if (metrics.fps >= 60) return 'A'
    if (metrics.fps >= 45) return 'B'
    if (metrics.fps >= 30) return 'C'
    if (metrics.fps >= 20) return 'D'
    return 'F'
  },

  /**
   * Get optimization recommendations
   */
  getRecommendations(metrics: PerformanceMetrics): string[] {
    const recommendations: string[] = []

    if (this.isBelowTarget(metrics, 60)) {
      recommendations.push('FPS below target (60). Consider reducing geometry complexity.')
    }

    if (this.isHighMemory(metrics, 100)) {
      recommendations.push('Memory usage high (>100MB). Check for geometry/texture leaks.')
    }

    if (this.isHighDrawCalls(metrics, 100)) {
      recommendations.push('Draw calls high (>100). Consider geometry batching or instancing.')
    }

    if (metrics.renderer.triangles > 100000) {
      recommendations.push('Triangle count high (>100K). Implement LOD system.')
    }

    return recommendations
  },
}
