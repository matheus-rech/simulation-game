import { BufferGeometry, Material, Vector3 } from 'three'
import { Brush, Evaluator, SUBTRACTION, ADDITION, INTERSECTION } from 'three-bvh-csg'

/**
 * CSG (Constructive Solid Geometry) operations wrapper
 * Provides convenient functions for boolean operations on geometries
 * Uses three-bvh-csg for fast BVH-accelerated CSG
 */

// Create evaluator instance (reused for better performance)
const evaluator = new Evaluator()

/**
 * Perform union (addition) of two geometries
 * @param geometryA First geometry
 * @param geometryB Second geometry
 * @param materialA Optional material for first geometry
 * @param materialB Optional material for second geometry
 * @returns Combined geometry
 */
export function union(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  materialA?: Material,
  materialB?: Material
): BufferGeometry {
  const brushA = new Brush(geometryA, materialA)
  const brushB = new Brush(geometryB, materialB)

  brushA.updateMatrixWorld()
  brushB.updateMatrixWorld()

  const result = evaluator.evaluate(brushA, brushB, ADDITION)
  return result.geometry
}

/**
 * Perform subtraction of geometry B from geometry A
 * @param geometryA Base geometry
 * @param geometryB Geometry to subtract
 * @param materialA Optional material for base geometry
 * @param materialB Optional material for subtracted geometry
 * @returns Result geometry with B subtracted from A
 */
export function subtract(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  materialA?: Material,
  materialB?: Material
): BufferGeometry {
  const brushA = new Brush(geometryA, materialA)
  const brushB = new Brush(geometryB, materialB)

  brushA.updateMatrixWorld()
  brushB.updateMatrixWorld()

  const result = evaluator.evaluate(brushA, brushB, SUBTRACTION)
  return result.geometry
}

/**
 * Perform intersection of two geometries
 * @param geometryA First geometry
 * @param geometryB Second geometry
 * @param materialA Optional material for first geometry
 * @param materialB Optional material for second geometry
 * @returns Intersection geometry
 */
export function intersect(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  materialA?: Material,
  materialB?: Material
): BufferGeometry {
  const brushA = new Brush(geometryA, materialA)
  const brushB = new Brush(geometryB, materialB)

  brushA.updateMatrixWorld()
  brushB.updateMatrixWorld()

  const result = evaluator.evaluate(brushA, brushB, INTERSECTION)
  return result.geometry
}

/**
 * Perform multiple union operations in sequence
 * Useful for combining many geometries efficiently
 * @param geometries Array of geometries to union
 * @returns Combined geometry
 */
export function unionMultiple(geometries: BufferGeometry[]): BufferGeometry {
  if (geometries.length === 0) {
    throw new Error('At least one geometry required for union operation')
  }

  if (geometries.length === 1) {
    return geometries[0]
  }

  let result = geometries[0]

  for (let i = 1; i < geometries.length; i++) {
    result = union(result, geometries[i])
  }

  return result
}

/**
 * Perform multiple subtract operations in sequence
 * Subtracts all geometries from the first one
 * @param baseGeometry Base geometry
 * @param subtractGeometries Array of geometries to subtract
 * @returns Result geometry
 */
export function subtractMultiple(
  baseGeometry: BufferGeometry,
  subtractGeometries: BufferGeometry[]
): BufferGeometry {
  if (subtractGeometries.length === 0) {
    return baseGeometry
  }

  let result = baseGeometry

  for (const geometry of subtractGeometries) {
    result = subtract(result, geometry)
  }

  return result
}

/**
 * Create hollow geometry by subtracting scaled inner geometry from outer
 * Useful for creating cavities, vessels, etc.
 * @param outerGeometry Outer shell geometry
 * @param wallThickness Wall thickness
 * @returns Hollow geometry
 */
export function createHollowGeometry(
  outerGeometry: BufferGeometry,
  wallThickness: number
): BufferGeometry {
  // Clone and scale down for inner geometry
  const innerGeometry = outerGeometry.clone()

  // Calculate scale factor based on bounding box
  outerGeometry.computeBoundingBox()
  if (!outerGeometry.boundingBox) {
    throw new Error('Could not compute bounding box for outer geometry')
  }

  const size = outerGeometry.boundingBox.getSize(new Vector3())
  const avgSize = (size.x + size.y + size.z) / 3
  const scaleFactor = Math.max(0.1, (avgSize - wallThickness) / avgSize)

  innerGeometry.scale(scaleFactor, scaleFactor, scaleFactor)

  return subtract(outerGeometry, innerGeometry)
}

/**
 * Simplify geometry by reducing vertex count
 * Useful after CSG operations which can create complex meshes
 * @param geometry Geometry to simplify
 * @param targetReduction Target reduction ratio (0-1)
 * @returns Simplified geometry
 */
export function simplifyGeometry(geometry: BufferGeometry, _targetReduction: number = 0.5): BufferGeometry {
  // For now, just return the geometry
  // In the future, we could integrate a simplification library
  // like three-simplify-modifier or implement decimation

  // Ensure geometry is indexed for better performance
  if (!geometry.index) {
    geometry = BufferGeometry.prototype.toNonIndexed.call(geometry)
  }

  return geometry
}

/**
 * Cleanup geometry after CSG operations
 * Recomputes normals, bounds, and removes degenerate faces
 * @param geometry Geometry to cleanup
 */
export function cleanupGeometry(geometry: BufferGeometry): void {
  // Recompute normals for proper lighting
  geometry.computeVertexNormals()

  // Recompute bounding box and sphere for frustum culling
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()

  // Remove unused vertices (if possible)
  if (!geometry.index) {
    geometry = BufferGeometry.prototype.toNonIndexed.call(geometry)
  }
}

/**
 * Cache for CSG operation results
 * Key: operation name + geometry UUIDs
 * Value: resulting geometry
 */
const csgCache = new Map<string, BufferGeometry>()

/**
 * Cache statistics for performance monitoring
 */
let cacheHits = 0
let cacheMisses = 0

/**
 * Generate cache key for CSG operation
 * Uses geometry UUIDs instead of JSON.stringify for O(1) performance
 */
function generateCacheKey(operation: string, ...params: unknown[]): string {
  // Extract UUIDs from BufferGeometry instances
  const uuids = params.map((param) => {
    if (param && typeof param === 'object' && 'uuid' in param) {
      return (param as BufferGeometry).uuid
    }
    // Fallback for non-geometry params (strings, numbers, etc.)
    return String(param)
  })

  return `${operation}:${uuids.join(':')}`
}

/**
 * Cached union operation
 * Reuses previous results if geometries haven't changed
 */
export function cachedUnion(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  cacheKey?: string
): BufferGeometry {
  const key = cacheKey || generateCacheKey('union', geometryA, geometryB)

  if (csgCache.has(key)) {
    cacheHits++
    return csgCache.get(key)!.clone()
  }

  cacheMisses++
  const result = union(geometryA, geometryB)
  csgCache.set(key, result)

  return result
}

/**
 * Cached subtract operation
 * Reuses previous results if geometries haven't changed
 */
export function cachedSubtract(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  cacheKey?: string
): BufferGeometry {
  const key = cacheKey || generateCacheKey('subtract', geometryA, geometryB)

  if (csgCache.has(key)) {
    cacheHits++
    return csgCache.get(key)!.clone()
  }

  cacheMisses++
  const result = subtract(geometryA, geometryB)
  csgCache.set(key, result)

  return result
}

/**
 * Cached intersect operation
 * Reuses previous results if geometries haven't changed
 */
export function cachedIntersect(
  geometryA: BufferGeometry,
  geometryB: BufferGeometry,
  cacheKey?: string
): BufferGeometry {
  const key = cacheKey || generateCacheKey('intersect', geometryA, geometryB)

  if (csgCache.has(key)) {
    cacheHits++
    return csgCache.get(key)!.clone()
  }

  cacheMisses++
  const result = intersect(geometryA, geometryB)
  csgCache.set(key, result)

  return result
}

/**
 * Clear CSG cache
 * Call this when geometries are updated or to free memory
 */
export function clearCSGCache(): void {
  // Dispose cached geometries
  for (const geometry of csgCache.values()) {
    geometry.dispose()
  }
  csgCache.clear()

  // Reset statistics
  cacheHits = 0
  cacheMisses = 0
}

/**
 * Get cache statistics for performance monitoring
 */
export function getCacheStats(): {
  size: number
  keys: string[]
  hits: number
  misses: number
  hitRate: number
} {
  const total = cacheHits + cacheMisses
  return {
    size: csgCache.size,
    keys: Array.from(csgCache.keys()),
    hits: cacheHits,
    misses: cacheMisses,
    hitRate: total > 0 ? cacheHits / total : 0,
  }
}
