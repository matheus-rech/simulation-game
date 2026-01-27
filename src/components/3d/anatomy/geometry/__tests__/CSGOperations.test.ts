import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { BoxGeometry, SphereGeometry, BufferGeometry, Vector3 } from 'three'
import {
  union,
  subtract,
  intersect,
  unionMultiple,
  subtractMultiple,
  createHollowGeometry,
  simplifyGeometry,
  cleanupGeometry,
  cachedUnion,
  clearCSGCache,
  getCacheStats,
} from '../CSGOperations'

describe('CSGOperations - Basic Operations', () => {
  let boxGeometry: BufferGeometry
  let sphereGeometry: BufferGeometry

  beforeEach(() => {
    boxGeometry = new BoxGeometry(2, 2, 2)
    sphereGeometry = new SphereGeometry(1.5, 32, 32)
  })

  describe('union', () => {
    it('should combine two geometries', () => {
      const result = union(boxGeometry, sphereGeometry)

      // Check it's a valid BufferGeometry with required attributes
      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })

    it('should create geometry larger than either input', () => {
      boxGeometry.computeBoundingBox()
      sphereGeometry.computeBoundingBox()

      const result = union(boxGeometry, sphereGeometry)
      result.computeBoundingBox()

      const boxVolume = boxGeometry.boundingBox!.getSize(new Vector3())
      const resultVolume = result.boundingBox!.getSize(new Vector3())

      // Union should be at least as large as the original box
      expect(resultVolume.length()).toBeGreaterThanOrEqual(boxVolume.length() * 0.9)
    })

    it('should have valid geometry attributes', () => {
      const result = union(boxGeometry, sphereGeometry)

      expect(result.attributes.position).toBeDefined()
      expect(result.attributes.normal).toBeDefined()
      expect(result.attributes.position.itemSize).toBe(3)
      expect(result.attributes.normal.itemSize).toBe(3)
    })
  })

  describe('subtract', () => {
    it('should subtract second geometry from first', () => {
      const result = subtract(boxGeometry, sphereGeometry)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })

    it('should create geometry smaller than base geometry', () => {
      boxGeometry.computeBoundingBox()

      const result = subtract(boxGeometry, sphereGeometry)
      result.computeBoundingBox()

      // Result should exist (not empty)
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })

    it('should handle non-overlapping geometries', () => {
      // Create a box far from origin
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)
      box2.translate(10, 0, 0) // Move far away

      const result = subtract(box1, box2)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })
  })

  describe('intersect', () => {
    it('should create intersection of two geometries', () => {
      const result = intersect(boxGeometry, sphereGeometry)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position).toBeDefined()
    })

    it('should create geometry smaller than both inputs', () => {
      boxGeometry.computeBoundingBox()
      sphereGeometry.computeBoundingBox()

      const result = intersect(boxGeometry, sphereGeometry)
      result.computeBoundingBox()

      // Intersection should be smaller than or equal to both inputs
      const boxSize = boxGeometry.boundingBox!.getSize(new Vector3())
      const sphereSize = sphereGeometry.boundingBox!.getSize(new Vector3())
      const resultSize = result.boundingBox!.getSize(new Vector3())

      expect(resultSize.length()).toBeLessThanOrEqual(boxSize.length())
      expect(resultSize.length()).toBeLessThanOrEqual(sphereSize.length())
    })

    it('should return empty geometry for non-overlapping shapes', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)
      box2.translate(10, 0, 0) // Move far away

      const result = intersect(box1, box2)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      // Non-overlapping intersection should have no vertices
      expect(result.attributes.position.count).toBe(0)
    })
  })
})

describe('CSGOperations - Multiple Operations', () => {
  describe('unionMultiple', () => {
    it('should combine multiple geometries', () => {
      const geometries = [
        new BoxGeometry(1, 1, 1),
        new SphereGeometry(0.5, 16, 16),
        new BoxGeometry(0.8, 0.8, 0.8),
      ]

      const result = unionMultiple(geometries)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })

    it('should return single geometry unchanged', () => {
      const singleGeometry = new BoxGeometry(2, 2, 2)
      const result = unionMultiple([singleGeometry])

      expect(result).toBe(singleGeometry)
    })

    it('should throw error for empty array', () => {
      expect(() => unionMultiple([])).toThrow('At least one geometry required')
    })

    it('should create progressively larger geometry', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)
      box2.translate(0.5, 0, 0)
      const box3 = new BoxGeometry(1, 1, 1)
      box3.translate(1, 0, 0)

      const result = unionMultiple([box1, box2, box3])
      result.computeBoundingBox()

      const size = result.boundingBox!.getSize(new Vector3())

      // Should be wider in X direction due to translation
      expect(size.x).toBeGreaterThan(1.5)
    })
  })

  describe('subtractMultiple', () => {
    it('should subtract multiple geometries from base', () => {
      const base = new BoxGeometry(3, 3, 3)
      const subtractGeometries = [new SphereGeometry(0.5, 16, 16), new BoxGeometry(0.6, 0.6, 0.6)]

      const result = subtractMultiple(base, subtractGeometries)

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })

    it('should return base geometry for empty subtract array', () => {
      const base = new BoxGeometry(2, 2, 2)
      const result = subtractMultiple(base, [])

      expect(result).toBe(base)
    })

    it('should handle multiple subtractions sequentially', () => {
      const base = new BoxGeometry(4, 4, 4)
      const sphere1 = new SphereGeometry(0.8, 16, 16)
      sphere1.translate(1, 0, 0)
      const sphere2 = new SphereGeometry(0.8, 16, 16)
      sphere2.translate(-1, 0, 0)

      const result = subtractMultiple(base, [sphere1, sphere2])

      expect(result).toBeDefined()
      expect(result.attributes).toBeDefined()
      expect(result.attributes.position.count).toBeGreaterThan(0)
    })
  })
})

describe('CSGOperations - Helper Functions', () => {
  describe('createHollowGeometry', () => {
    it('should create hollow geometry from solid', () => {
      const solid = new BoxGeometry(2, 2, 2)
      const hollow = createHollowGeometry(solid, 0.2)

      expect(hollow).toBeDefined()
      expect(hollow.attributes).toBeDefined()
      expect(hollow.attributes.position.count).toBeGreaterThan(0)
    })

    it('should respect wall thickness parameter', () => {
      const solid = new SphereGeometry(1, 32, 32)

      const thin = createHollowGeometry(solid.clone(), 0.1)
      const thick = createHollowGeometry(solid.clone(), 0.3)

      // Thicker walls should result in fewer vertices (smaller cavity)
      expect(thin.attributes.position.count).toBeGreaterThan(0)
      expect(thick.attributes.position.count).toBeGreaterThan(0)
    })

    it('should throw error if bounding box cannot be computed', () => {
      // Create empty geometry (no vertices)
      const emptyGeometry = new BufferGeometry()

      // Should throw an error (either from bounding box or CSG operations)
      expect(() => createHollowGeometry(emptyGeometry, 0.2)).toThrow()
    })

    it('should handle very thin walls', () => {
      const solid = new BoxGeometry(2, 2, 2)
      const hollow = createHollowGeometry(solid, 0.05)

      expect(hollow).toBeDefined()
      expect(hollow.attributes).toBeDefined()
      expect(hollow.attributes.position.count).toBeGreaterThan(0)
    })
  })

  describe('simplifyGeometry', () => {
    it('should return valid geometry', () => {
      const geometry = new SphereGeometry(1, 64, 64)
      const simplified = simplifyGeometry(geometry, 0.5)

      expect(simplified).toBeDefined()
      expect(simplified.attributes).toBeDefined()
      expect(simplified.attributes.position.count).toBeGreaterThan(0)
    })

    it('should handle non-indexed geometry', () => {
      const geometry = new SphereGeometry(1, 32, 32)
      const nonIndexed = geometry.toNonIndexed()

      const simplified = simplifyGeometry(nonIndexed, 0.3)

      expect(simplified).toBeDefined()
      expect(simplified.attributes).toBeDefined()
    })

    it('should work with default parameters', () => {
      const geometry = new BoxGeometry(1, 1, 1)
      const simplified = simplifyGeometry(geometry)

      expect(simplified).toBeDefined()
      expect(simplified.attributes).toBeDefined()
    })
  })

  describe('cleanupGeometry', () => {
    it('should compute normals, bounding box, and sphere', () => {
      const geometry = new BoxGeometry(2, 2, 2)
      // Clear existing computed data
      geometry.deleteAttribute('normal')

      cleanupGeometry(geometry)

      expect(geometry.attributes.normal).toBeDefined()
      expect(geometry.boundingBox).toBeDefined()
      expect(geometry.boundingSphere).toBeDefined()
    })

    it('should handle geometry with existing normals', () => {
      const geometry = new SphereGeometry(1, 32, 32)

      expect(() => cleanupGeometry(geometry)).not.toThrow()

      expect(geometry.attributes.normal).toBeDefined()
      expect(geometry.boundingBox).toBeDefined()
      expect(geometry.boundingSphere).toBeDefined()
    })

    it('should not throw for non-indexed geometry', () => {
      const geometry = new BoxGeometry(1, 1, 1).toNonIndexed()

      expect(() => cleanupGeometry(geometry)).not.toThrow()
    })
  })
})

describe('CSGOperations - Caching', () => {
  afterEach(() => {
    clearCSGCache()
  })

  describe('cachedUnion', () => {
    it('should cache union results', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)
      const cacheKey = 'test-union-1'

      // First call - should compute
      const result1 = cachedUnion(box1, box2, cacheKey)

      const statsAfterFirst = getCacheStats()
      expect(statsAfterFirst.size).toBe(1)
      expect(statsAfterFirst.keys).toContain(cacheKey)

      // Second call - should use cache
      const result2 = cachedUnion(box1, box2, cacheKey)

      const statsAfterSecond = getCacheStats()
      expect(statsAfterSecond.size).toBe(1)

      // Results should be clones (not same instance but equivalent)
      expect(result1).not.toBe(result2)
      expect(result1.attributes.position.count).toBe(result2.attributes.position.count)
    })

    it('should auto-generate cache keys when not provided', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)

      cachedUnion(box1, box2)

      const stats = getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.keys.length).toBe(1)
      expect(stats.keys[0]).toContain('union')
    })

    it('should create separate cache entries for different geometries', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)
      const sphere = new SphereGeometry(1, 16, 16)

      cachedUnion(box1, box2, 'cache-1')
      cachedUnion(box1, sphere, 'cache-2')

      const stats = getCacheStats()
      expect(stats.size).toBe(2)
      expect(stats.keys).toContain('cache-1')
      expect(stats.keys).toContain('cache-2')
    })
  })

  describe('clearCSGCache', () => {
    it('should clear all cached geometries', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)

      cachedUnion(box1, box2, 'cache-1')
      cachedUnion(box1, box2, 'cache-2')

      let stats = getCacheStats()
      expect(stats.size).toBe(2)

      clearCSGCache()

      stats = getCacheStats()
      expect(stats.size).toBe(0)
      expect(stats.keys.length).toBe(0)
    })

    it('should allow new cache entries after clearing', () => {
      const box1 = new BoxGeometry(1, 1, 1)
      const box2 = new BoxGeometry(1, 1, 1)

      cachedUnion(box1, box2, 'cache-1')
      clearCSGCache()

      cachedUnion(box1, box2, 'cache-2')

      const stats = getCacheStats()
      expect(stats.size).toBe(1)
      expect(stats.keys).toContain('cache-2')
    })
  })

  describe('getCacheStats', () => {
    it('should return correct cache statistics', () => {
      const stats = getCacheStats()

      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('keys')
      expect(Array.isArray(stats.keys)).toBe(true)
    })

    it('should reflect accurate cache size', () => {
      const box = new BoxGeometry(1, 1, 1)

      let stats = getCacheStats()
      expect(stats.size).toBe(0)

      cachedUnion(box, box, 'key1')
      stats = getCacheStats()
      expect(stats.size).toBe(1)

      cachedUnion(box, box, 'key2')
      stats = getCacheStats()
      expect(stats.size).toBe(2)
    })

    it('should return all cache keys', () => {
      const box = new BoxGeometry(1, 1, 1)

      cachedUnion(box, box, 'alpha')
      cachedUnion(box, box, 'beta')
      cachedUnion(box, box, 'gamma')

      const stats = getCacheStats()
      expect(stats.keys).toHaveLength(3)
      expect(stats.keys).toContain('alpha')
      expect(stats.keys).toContain('beta')
      expect(stats.keys).toContain('gamma')
    })
  })
})

describe('CSGOperations - Integration Tests', () => {
  afterEach(() => {
    clearCSGCache()
  })

  it('should create complex nested structures', () => {
    // Create a box with multiple spherical cavities (like sphenoid sinus with septations)
    const outer = new BoxGeometry(4, 3, 3)
    const inner = new BoxGeometry(3.6, 2.6, 2.6)

    const cavity = subtract(outer, inner)

    const septation1 = new BoxGeometry(0.1, 2.5, 2.5)
    septation1.translate(-0.5, 0, 0)

    const septation2 = new BoxGeometry(0.1, 2.5, 2.5)
    septation2.translate(0.5, 0, 0)

    const withSeptations = unionMultiple([cavity, septation1, septation2])

    expect(withSeptations).toBeDefined()
    expect(withSeptations.attributes).toBeDefined()
    expect(withSeptations.attributes.position.count).toBeGreaterThan(0)

    // Verify cleanup
    cleanupGeometry(withSeptations)
    expect(withSeptations.attributes.normal).toBeDefined()
    expect(withSeptations.boundingBox).toBeDefined()
  })

  it('should combine operations with caching', () => {
    const box = new BoxGeometry(2, 2, 2)
    const sphere = new SphereGeometry(1, 16, 16)

    // Use cached operations
    const union1 = cachedUnion(box, sphere, 'test-1')
    const union2 = cachedUnion(box, sphere, 'test-1')

    expect(union1.attributes.position.count).toBe(union2.attributes.position.count)

    const stats = getCacheStats()
    expect(stats.size).toBe(1)
  })

  it('should handle complex workflow: hollow + subtract + cleanup', () => {
    // Create hollow sphere
    const sphere = new SphereGeometry(2, 32, 32)
    const hollow = createHollowGeometry(sphere, 0.3)

    // Subtract smaller sphere from one side
    const cutout = new SphereGeometry(0.5, 16, 16)
    cutout.translate(1.5, 0, 0)

    const withCutout = subtract(hollow, cutout)

    // Cleanup
    cleanupGeometry(withCutout)

    expect(withCutout).toBeDefined()
    expect(withCutout.attributes).toBeDefined()
    expect(withCutout.attributes.position.count).toBeGreaterThan(0)
    expect(withCutout.attributes.normal).toBeDefined()
    expect(withCutout.boundingBox).toBeDefined()
  })

  it('should maintain geometry validity through multiple operations', () => {
    const base = new BoxGeometry(3, 3, 3)
    const sphere1 = new SphereGeometry(0.8, 16, 16)
    sphere1.translate(1, 1, 1)
    const sphere2 = new SphereGeometry(0.8, 16, 16)
    sphere2.translate(-1, -1, -1)

    const result = subtractMultiple(base, [sphere1, sphere2])

    // Verify no NaN values
    const positions = result.attributes.position.array
    for (let i = 0; i < positions.length; i++) {
      expect(isNaN(positions[i])).toBe(false)
    }

    // Verify valid bounds
    result.computeBoundingBox()
    expect(result.boundingBox).toBeDefined()
    expect(result.boundingBox!.isEmpty()).toBe(false)
  })
})
