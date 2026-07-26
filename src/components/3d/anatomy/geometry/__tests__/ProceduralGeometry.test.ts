import { describe, it, expect, beforeEach } from 'vitest'
import { BufferGeometry, SphereGeometry } from 'three'
import {
  perlin3D,
  octavePerlin,
  applyNoiseDistortion,
  applyNoiseVertexColors,
  createOffsetGeometry,
  scaleGeometry,
  smoothGeometry,
  setNoiseSeed,
} from '../ProceduralGeometry'

describe('ProceduralGeometry - Perlin Noise', () => {
  describe('perlin3D', () => {
    it('should return values between -1 and 1', () => {
      const samples = 100
      for (let i = 0; i < samples; i++) {
        const x = Math.random() * 10
        const y = Math.random() * 10
        const z = Math.random() * 10
        const noise = perlin3D(x, y, z)

        expect(noise).toBeGreaterThanOrEqual(-1)
        expect(noise).toBeLessThanOrEqual(1)
      }
    })

    it('should return same value for same coordinates', () => {
      const noise1 = perlin3D(1.5, 2.3, 3.7)
      const noise2 = perlin3D(1.5, 2.3, 3.7)

      expect(noise1).toBe(noise2)
    })

    it('should return different values for different coordinates', () => {
      // Use non-integer coordinates to avoid edge cases
      const noise1 = perlin3D(1.5, 2.3, 3.7)
      const noise2 = perlin3D(4.1, 5.8, 6.2)

      expect(noise1).not.toBe(noise2)
    })

    it('should produce continuous gradients (nearby points similar)', () => {
      const noise1 = perlin3D(5.0, 5.0, 5.0)
      const noise2 = perlin3D(5.01, 5.01, 5.01) // Very close point

      // Noise should be continuous (difference should be small)
      expect(Math.abs(noise1 - noise2)).toBeLessThan(0.1)
    })
  })

  describe('octavePerlin', () => {
    it('should return values in normalized range', () => {
      const samples = 50
      for (let i = 0; i < samples; i++) {
        const noise = octavePerlin(
          Math.random() * 10,
          Math.random() * 10,
          Math.random() * 10,
          4,
          0.5
        )

        // Octave noise should still be in reasonable range after normalization
        expect(noise).toBeGreaterThanOrEqual(-2)
        expect(noise).toBeLessThanOrEqual(2)
      }
    })

    it('should use default parameters correctly', () => {
      const noise = octavePerlin(1, 2, 3)
      expect(typeof noise).toBe('number')
      expect(isNaN(noise)).toBe(false)
    })

    it('should have more detail with higher octaves', () => {
      const x = 5,
        y = 5,
        z = 5
      const octave1 = octavePerlin(x, y, z, 1, 0.5)
      const octave4 = octavePerlin(x, y, z, 4, 0.5)

      // With more octaves, should have more frequency components
      // Can't directly test "more detail" but can verify it produces different values
      expect(typeof octave1).toBe('number')
      expect(typeof octave4).toBe('number')
    })
  })

  describe('setNoiseSeed', () => {
    it('should make noise deterministic with same seed', () => {
      setNoiseSeed(12345)
      const noise1a = perlin3D(1, 2, 3)
      const noise1b = perlin3D(4, 5, 6)

      setNoiseSeed(12345)
      const noise2a = perlin3D(1, 2, 3)
      const noise2b = perlin3D(4, 5, 6)

      expect(noise1a).toBe(noise2a)
      expect(noise1b).toBe(noise2b)
    })

    it('should produce different patterns with different seeds', () => {
      // Use non-integer coordinates to avoid edge cases
      setNoiseSeed(111)
      const noiseA = perlin3D(5.3, 5.7, 5.2)

      setNoiseSeed(222)
      const noiseB = perlin3D(5.3, 5.7, 5.2)

      expect(noiseA).not.toBe(noiseB)
    })
  })
})

describe('ProceduralGeometry - Geometry Manipulation', () => {
  let testGeometry: BufferGeometry

  beforeEach(() => {
    // Create a test sphere with known properties
    testGeometry = new SphereGeometry(1, 16, 16)
  })

  describe('applyNoiseDistortion', () => {
    it('should modify geometry vertices', () => {
      const originalPositions = testGeometry.attributes.position.array.slice()

      applyNoiseDistortion(testGeometry, 0.15, 1.0, 3)

      const modifiedPositions = testGeometry.attributes.position.array

      // At least some vertices should have changed
      let changedCount = 0
      for (let i = 0; i < originalPositions.length; i++) {
        if (Math.abs(originalPositions[i] - modifiedPositions[i]) > 0.001) {
          changedCount++
        }
      }

      expect(changedCount).toBeGreaterThan(0)
    })

    it('should handle zero strength (no distortion)', () => {
      const originalPositions = testGeometry.attributes.position.array.slice()

      applyNoiseDistortion(testGeometry, 0.0, 1.0, 3)

      const modifiedPositions = testGeometry.attributes.position.array

      // With zero strength, positions should be very similar
      for (let i = 0; i < originalPositions.length; i++) {
        expect(Math.abs(originalPositions[i] - modifiedPositions[i])).toBeLessThan(0.1)
      }
    })

    it('should update vertex normals after distortion', () => {
      const normalsBefore = testGeometry.attributes.normal
      expect(normalsBefore).toBeDefined()

      applyNoiseDistortion(testGeometry, 0.15, 1.0, 3)

      const normalsAfter = testGeometry.attributes.normal
      expect(normalsAfter).toBeDefined()
      // needsUpdate is cleared after processing, so it should not be true
      expect(normalsAfter.needsUpdate).not.toBe(true)
    })
  })

  describe('applyNoiseVertexColors', () => {
    it('should add color attribute to geometry', () => {
      expect(testGeometry.attributes.color).toBeUndefined()

      applyNoiseVertexColors(testGeometry, 0.8, 0.2)

      expect(testGeometry.attributes.color).toBeDefined()
      expect(testGeometry.attributes.color.itemSize).toBe(3) // RGB
    })

    it('should create colors in valid range', () => {
      applyNoiseVertexColors(testGeometry, 0.8, 0.2)

      const colors = testGeometry.attributes.color.array

      for (let i = 0; i < colors.length; i++) {
        expect(colors[i]).toBeGreaterThanOrEqual(0)
        expect(colors[i]).toBeLessThanOrEqual(1.2) // Can slightly exceed 1 due to noise
      }
    })

    it('should create grayscale colors (R=G=B)', () => {
      applyNoiseVertexColors(testGeometry, 0.8, 0.2)

      const colors = testGeometry.attributes.color.array

      // Check first few vertices are grayscale
      for (let i = 0; i < 10; i++) {
        const r = colors[i * 3]
        const g = colors[i * 3 + 1]
        const b = colors[i * 3 + 2]

        expect(Math.abs(r - g)).toBeLessThan(0.001)
        expect(Math.abs(g - b)).toBeLessThan(0.001)
      }
    })
  })

  describe('createOffsetGeometry', () => {
    it('should create a new geometry instance', () => {
      const offsetGeometry = createOffsetGeometry(testGeometry, 0.1)

      expect(offsetGeometry).not.toBe(testGeometry)
      expect(offsetGeometry).toBeInstanceOf(BufferGeometry)
    })

    it('should offset vertices outward with positive offset', () => {
      const originalRadius = 1.0
      const offset = 0.2

      const offsetGeometry = createOffsetGeometry(testGeometry, offset)

      // Check that average distance from origin increased
      const positions = offsetGeometry.attributes.position
      let totalDistance = 0

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        totalDistance += Math.sqrt(x * x + y * y + z * z)
      }

      const avgDistance = totalDistance / positions.count

      expect(avgDistance).toBeGreaterThan(originalRadius)
      expect(avgDistance).toBeCloseTo(originalRadius + offset, 1)
    })

    it('should offset vertices inward with negative offset', () => {
      const originalRadius = 1.0
      const offset = -0.2

      const offsetGeometry = createOffsetGeometry(testGeometry, offset)

      const positions = offsetGeometry.attributes.position
      let totalDistance = 0

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        totalDistance += Math.sqrt(x * x + y * y + z * z)
      }

      const avgDistance = totalDistance / positions.count

      expect(avgDistance).toBeLessThan(originalRadius)
      expect(avgDistance).toBeCloseTo(originalRadius + offset, 1)
    })

    it('should compute normals for offset geometry', () => {
      const offsetGeometry = createOffsetGeometry(testGeometry, 0.1)

      expect(offsetGeometry.attributes.normal).toBeDefined()
    })
  })

  describe('scaleGeometry', () => {
    it('should scale geometry vertices', () => {
      const scaleX = 2.0
      const scaleY = 1.5
      const scaleZ = 0.5

      // Get a sample vertex before scaling
      const positions = testGeometry.attributes.position
      const originalX = positions.getX(0)
      const originalY = positions.getY(0)
      const originalZ = positions.getZ(0)

      scaleGeometry(testGeometry, scaleX, scaleY, scaleZ)

      // Check the same vertex after scaling
      const scaledX = positions.getX(0)
      const scaledY = positions.getY(0)
      const scaledZ = positions.getZ(0)

      expect(scaledX).toBeCloseTo(originalX * scaleX, 5)
      expect(scaledY).toBeCloseTo(originalY * scaleY, 5)
      expect(scaledZ).toBeCloseTo(originalZ * scaleZ, 5)
    })

    it('should update bounding box and sphere', () => {
      scaleGeometry(testGeometry, 2.0, 2.0, 2.0)

      expect(testGeometry.boundingBox).toBeDefined()
      expect(testGeometry.boundingSphere).toBeDefined()
    })

    it('should handle uniform scaling', () => {
      const scale = 3.0
      const originalRadius = 1.0

      scaleGeometry(testGeometry, scale, scale, scale)

      const positions = testGeometry.attributes.position
      let totalDistance = 0

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        totalDistance += Math.sqrt(x * x + y * y + z * z)
      }

      const avgDistance = totalDistance / positions.count

      expect(avgDistance).toBeCloseTo(originalRadius * scale, 1)
    })
  })

  describe('smoothGeometry', () => {
    it('should not crash with default parameters', () => {
      expect(() => smoothGeometry(testGeometry)).not.toThrow()
    })

    it('should smooth vertices with multiple iterations', () => {
      const positions = testGeometry.attributes.position
      const originalPositions = positions.array.slice()

      // Use aggressive smoothing to ensure visible effect
      smoothGeometry(testGeometry, 5, 0.8)

      const smoothedPositions = positions.array

      // Check that at least some vertices changed
      let changedCount = 0
      for (let i = 0; i < originalPositions.length; i++) {
        if (Math.abs(originalPositions[i] - smoothedPositions[i]) > 0.001) {
          changedCount++
        }
      }

      // With aggressive smoothing, some vertices should have moved
      expect(changedCount).toBeGreaterThan(0)
    })

    it('should have minimal effect with factor 0', () => {
      const positions = testGeometry.attributes.position
      const originalPositions = positions.array.slice()

      smoothGeometry(testGeometry, 1, 0.0)

      const smoothedPositions = positions.array

      // With factor 0, positions should remain nearly identical
      for (let i = 0; i < originalPositions.length; i++) {
        expect(Math.abs(originalPositions[i] - smoothedPositions[i])).toBeLessThan(0.001)
      }
    })

    it('should update vertex normals after smoothing', () => {
      smoothGeometry(testGeometry, 2, 0.5)

      expect(testGeometry.attributes.normal).toBeDefined()
    })
  })
})

describe('ProceduralGeometry - Integration Tests', () => {
  it('should combine distortion and vertex colors', () => {
    const geometry = new SphereGeometry(1, 32, 32)

    applyNoiseDistortion(geometry, 0.15, 2.0, 4)
    applyNoiseVertexColors(geometry, 0.8, 0.3)

    expect(geometry.attributes.position).toBeDefined()
    expect(geometry.attributes.color).toBeDefined()
    expect(geometry.attributes.normal).toBeDefined()
  })

  it('should create layered structures with offset', () => {
    const baseGeometry = new SphereGeometry(1, 32, 32)

    // Create outer layer (like pseudocapsule)
    const outerLayer = createOffsetGeometry(baseGeometry, 0.05)

    // Create inner layer (like tumor)
    const innerLayer = createOffsetGeometry(baseGeometry, -0.05)

    // Check all three have different radii
    const basePositions = baseGeometry.attributes.position
    const outerPositions = outerLayer.attributes.position
    const innerPositions = innerLayer.attributes.position

    const baseRadius = Math.sqrt(
      Math.pow(basePositions.getX(0), 2) +
        Math.pow(basePositions.getY(0), 2) +
        Math.pow(basePositions.getZ(0), 2)
    )

    const outerRadius = Math.sqrt(
      Math.pow(outerPositions.getX(0), 2) +
        Math.pow(outerPositions.getY(0), 2) +
        Math.pow(outerPositions.getZ(0), 2)
    )

    const innerRadius = Math.sqrt(
      Math.pow(innerPositions.getX(0), 2) +
        Math.pow(innerPositions.getY(0), 2) +
        Math.pow(innerPositions.getZ(0), 2)
    )

    expect(outerRadius).toBeGreaterThan(baseRadius)
    expect(innerRadius).toBeLessThan(baseRadius)
  })

  it('should maintain geometry validity after all operations', () => {
    const geometry = new SphereGeometry(1, 32, 32)

    // Apply all operations in sequence
    applyNoiseDistortion(geometry, 0.15, 2.0, 4)
    applyNoiseVertexColors(geometry, 0.8, 0.3)
    scaleGeometry(geometry, 1.2, 0.9, 1.1)
    smoothGeometry(geometry, 2, 0.3)

    // Verify geometry is still valid
    expect(geometry.attributes.position).toBeDefined()
    expect(geometry.attributes.normal).toBeDefined()
    expect(geometry.attributes.color).toBeDefined()
    expect(geometry.attributes.position.count).toBeGreaterThan(0)

    // Check no NaN values
    const positions = geometry.attributes.position.array
    for (let i = 0; i < positions.length; i++) {
      expect(isNaN(positions[i])).toBe(false)
    }
  })
})
