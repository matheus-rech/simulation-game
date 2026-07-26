import { BufferGeometry } from 'three'

/**
 * GeometryOptimizer - Multi-agent geometry performance optimization
 *
 * Provides intelligent caching, simplification, and memory management
 * for procedurally generated anatomical geometries.
 *
 * Performance targets:
 * - Reduce CSG operation overhead through caching
 * - Minimize memory footprint via geometry sharing
 * - Implement LOD (Level of Detail) for distance-based optimization
 */

interface GeometryCache {
  [key: string]: {
    geometry: BufferGeometry
    createdAt: number
    accessCount: number
    lastAccessed: number
  }
}

class GeometryOptimizerClass {
  private cache: GeometryCache = {}
  private maxCacheSize = 50 // Maximum cached geometries
  private maxCacheAge = 5 * 60 * 1000 // 5 minutes in ms

  /**
   * Get or create geometry with caching
   */
  getOrCreate(key: string, factory: () => BufferGeometry): BufferGeometry {
    // Check cache
    if (this.cache[key]) {
      const entry = this.cache[key]
      entry.accessCount++
      entry.lastAccessed = Date.now()
      return entry.geometry
    }

    // Create new geometry
    const geometry = factory()

    // Add to cache
    this.cache[key] = {
      geometry,
      createdAt: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
    }

    // Evict old entries if cache is full
    this.evictIfNeeded()

    return geometry
  }

  /**
   * Evict least recently used entries
   */
  private evictIfNeeded() {
    const entries = Object.entries(this.cache)

    // Evict by age
    const now = Date.now()
    entries.forEach(([key, entry]) => {
      if (now - entry.createdAt > this.maxCacheAge) {
        this.remove(key)
      }
    })

    // Evict by size (LRU)
    if (entries.length > this.maxCacheSize) {
      const sorted = entries.sort(
        (a, b) => a[1].lastAccessed - b[1].lastAccessed
      )
      const toRemove = sorted.slice(0, entries.length - this.maxCacheSize)
      toRemove.forEach(([key]) => this.remove(key))
    }
  }

  /**
   * Remove geometry from cache and dispose
   */
  remove(key: string) {
    if (this.cache[key]) {
      this.cache[key].geometry.dispose()
      delete this.cache[key]
    }
  }

  /**
   * Clear all cached geometries
   */
  clear() {
    Object.keys(this.cache).forEach((key) => this.remove(key))
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Object.values(this.cache)
    return {
      size: entries.length,
      totalAccessCount: entries.reduce((sum, e) => sum + e.accessCount, 0),
      avgAccessCount:
        entries.reduce((sum, e) => sum + e.accessCount, 0) / entries.length || 0,
      oldestEntry: Math.min(...entries.map((e) => e.createdAt)),
    }
  }

  /**
   * Simplify geometry by reducing vertex count
   */
  simplify(geometry: BufferGeometry, targetReduction = 0.5): BufferGeometry {
    // Clone to avoid modifying original
    const simplified = geometry.clone()

    // Get vertex count
    const positionAttribute = simplified.attributes.position
    if (!positionAttribute) return simplified

    const vertexCount = positionAttribute.count

    // Calculate target vertex count
    const targetCount = Math.floor(vertexCount * (1 - targetReduction))

    // Simple decimation: keep every Nth vertex
    const step = Math.ceil(vertexCount / targetCount)

    if (step > 1) {
      const positions = positionAttribute.array
      const newPositions = new Float32Array(targetCount * 3)

      let newIndex = 0
      for (let i = 0; i < vertexCount; i += step) {
        const offset = i * 3
        newPositions[newIndex * 3] = positions[offset]
        newPositions[newIndex * 3 + 1] = positions[offset + 1]
        newPositions[newIndex * 3 + 2] = positions[offset + 2]
        newIndex++
      }

      simplified.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(newPositions, 3)
      )
      simplified.computeVertexNormals()
    }

    return simplified
  }

  /**
   * Create LOD (Level of Detail) variants
   */
  createLOD(geometry: BufferGeometry): BufferGeometry[] {
    return [
      geometry, // LOD 0: Full detail (distance 0-5)
      this.simplify(geometry, 0.3), // LOD 1: 70% vertices (distance 5-10)
      this.simplify(geometry, 0.6), // LOD 2: 40% vertices (distance 10+)
    ]
  }

  /**
   * Batch dispose multiple geometries
   */
  disposeAll(geometries: BufferGeometry[]) {
    geometries.forEach((g) => g.dispose())
  }

  /**
   * Analyze geometry complexity
   */
  analyze(geometry: BufferGeometry) {
    const positionAttribute = geometry.attributes.position
    const indexAttribute = geometry.index

    const vertexCount = positionAttribute ? positionAttribute.count : 0
    const triangleCount = indexAttribute
      ? indexAttribute.count / 3
      : vertexCount / 3

    const memoryEstimate =
      vertexCount * 3 * 4 + // positions (3 floats per vertex)
      (indexAttribute ? indexAttribute.count * 2 : 0) + // indices (shorts)
      (geometry.attributes.normal ? vertexCount * 3 * 4 : 0) + // normals
      (geometry.attributes.uv ? vertexCount * 2 * 4 : 0) // uvs

    return {
      vertexCount,
      triangleCount,
      memoryBytes: memoryEstimate,
      memoryMB: memoryEstimate / 1024 / 1024,
      hasNormals: !!geometry.attributes.normal,
      hasUVs: !!geometry.attributes.uv,
      isIndexed: !!indexAttribute,
    }
  }
}

// Singleton instance
export const GeometryOptimizer = new GeometryOptimizerClass()

// Import Three.js for Float32BufferAttribute
import * as THREE from 'three'
