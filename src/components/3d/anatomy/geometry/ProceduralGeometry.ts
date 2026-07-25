import { BufferGeometry, Vector3, Float32BufferAttribute } from 'three'

/**
 * Perlin noise implementation for procedural geometry generation
 * Based on Ken Perlin's improved noise algorithm
 */

// Permutation table for Perlin noise
const p = new Uint8Array(512)
const permutation = [
  151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
  142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
  203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
  74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
  220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
  132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173,
  186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206,
  59, 227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163,
  70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232,
  178, 185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162,
  241, 81, 51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204,
  176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141,
  128, 195, 78, 66, 215, 61, 156, 180,
]

for (let i = 0; i < 256; i++) {
  p[i] = p[i + 256] = permutation[i]
}

/**
 * Fade function for smooth interpolation
 */
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10)
}

/**
 * Linear interpolation
 */
function lerp(t: number, a: number, b: number): number {
  return a + t * (b - a)
}

/**
 * Gradient function
 */
function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15
  const u = h < 8 ? x : y
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
}

/**
 * 3D Perlin noise function
 * @param x X coordinate
 * @param y Y coordinate
 * @param z Z coordinate
 * @returns Noise value between -1 and 1
 */
export function perlin3D(x: number, y: number, z: number): number {
  // Find unit cube containing point
  const X = Math.floor(x) & 255
  const Y = Math.floor(y) & 255
  const Z = Math.floor(z) & 255

  // Find relative x, y, z of point in cube
  x -= Math.floor(x)
  y -= Math.floor(y)
  z -= Math.floor(z)

  // Compute fade curves
  const u = fade(x)
  const v = fade(y)
  const w = fade(z)

  // Hash coordinates of cube corners
  const A = p[X] + Y
  const AA = p[A] + Z
  const AB = p[A + 1] + Z
  const B = p[X + 1] + Y
  const BA = p[B] + Z
  const BB = p[B + 1] + Z

  // Blend results from 8 corners
  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(p[AA], x, y, z), grad(p[BA], x - 1, y, z)),
      lerp(u, grad(p[AB], x, y - 1, z), grad(p[BB], x - 1, y - 1, z))
    ),
    lerp(
      v,
      lerp(u, grad(p[AA + 1], x, y, z - 1), grad(p[BA + 1], x - 1, y, z - 1)),
      lerp(u, grad(p[AB + 1], x, y - 1, z - 1), grad(p[BB + 1], x - 1, y - 1, z - 1))
    )
  )
}

/**
 * Octave Perlin noise (fractal noise with multiple frequencies)
 * @param x X coordinate
 * @param y Y coordinate
 * @param z Z coordinate
 * @param octaves Number of octaves
 * @param persistence Amplitude decrease per octave
 * @returns Noise value
 */
export function octavePerlin(
  x: number,
  y: number,
  z: number,
  octaves: number = 4,
  persistence: number = 0.5
): number {
  let total = 0
  let frequency = 1
  let amplitude = 1
  let maxValue = 0

  for (let i = 0; i < octaves; i++) {
    total += perlin3D(x * frequency, y * frequency, z * frequency) * amplitude
    maxValue += amplitude
    amplitude *= persistence
    frequency *= 2
  }

  return total / maxValue
}

/**
 * Apply Perlin noise distortion to geometry vertices
 * @param geometry BufferGeometry to modify
 * @param strength Distortion strength (0-1)
 * @param frequency Noise frequency
 * @param octaves Number of noise octaves
 */
export function applyNoiseDistortion(
  geometry: BufferGeometry,
  strength: number = 0.15,
  frequency: number = 1.0,
  octaves: number = 3
): void {
  const positions = geometry.attributes.position
  if (!positions) return

  const vertex = new Vector3()

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)

    // Get noise value at vertex position
    const noise = octavePerlin(vertex.x * frequency, vertex.y * frequency, vertex.z * frequency, octaves)

    // Apply distortion along vertex normal direction
    const distortion = 1 + noise * strength
    vertex.multiplyScalar(distortion)

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Add heterogeneous vertex colors based on noise
 * Useful for tumor/tissue heterogeneity
 * @param geometry BufferGeometry to modify
 * @param baseColor Base color value (0-1)
 * @param variation Color variation amount (0-1)
 */
export function applyNoiseVertexColors(
  geometry: BufferGeometry,
  baseColor: number = 0.8,
  variation: number = 0.2
): void {
  const positions = geometry.attributes.position
  if (!positions) return

  const colors = new Float32Array(positions.count * 3)
  const vertex = new Vector3()

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)

    // Get noise value
    const noise = perlin3D(vertex.x * 2, vertex.y * 2, vertex.z * 2)
    const colorValue = baseColor + noise * variation

    // Set RGB (grayscale for intensity variation)
    colors[i * 3] = colorValue
    colors[i * 3 + 1] = colorValue
    colors[i * 3 + 2] = colorValue
  }

  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
}

/**
 * Create offset geometry (useful for creating layers like pseudocapsule, dura)
 * @param geometry Source geometry
 * @param offset Offset distance (positive = outward, negative = inward)
 * @returns New BufferGeometry offset from original
 */
export function createOffsetGeometry(geometry: BufferGeometry, offset: number): BufferGeometry {
  const newGeometry = geometry.clone()
  const positions = newGeometry.attributes.position

  // Compute vertex normals if not present
  if (!newGeometry.attributes.normal) {
    newGeometry.computeVertexNormals()
  }

  const normals = newGeometry.attributes.normal
  const vertex = new Vector3()
  const normal = new Vector3()

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)
    normal.fromBufferAttribute(normals, i)

    // Move vertex along normal
    vertex.addScaledVector(normal, offset)

    positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  positions.needsUpdate = true
  newGeometry.computeVertexNormals()

  return newGeometry
}

/**
 * Scale geometry non-uniformly for anatomical proportions
 * @param geometry BufferGeometry to scale
 * @param scaleX X-axis scale
 * @param scaleY Y-axis scale
 * @param scaleZ Z-axis scale
 */
export function scaleGeometry(
  geometry: BufferGeometry,
  scaleX: number,
  scaleY: number,
  scaleZ: number
): void {
  const positions = geometry.attributes.position
  const vertex = new Vector3()

  for (let i = 0; i < positions.count; i++) {
    vertex.fromBufferAttribute(positions, i)
    vertex.set(vertex.x * scaleX, vertex.y * scaleY, vertex.z * scaleZ)
    positions.setXYZ(i, vertex.x, vertex.y, vertex.z)
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
  geometry.computeBoundingBox()
  geometry.computeBoundingSphere()
}

/**
 * Smooth geometry by averaging vertex positions with neighbors
 * @param geometry BufferGeometry to smooth
 * @param iterations Number of smoothing iterations
 * @param factor Smoothing factor (0-1)
 */
export function smoothGeometry(
  geometry: BufferGeometry,
  iterations: number = 1,
  factor: number = 0.5
): void {
  const positions = geometry.attributes.position

  for (let iter = 0; iter < iterations; iter++) {
    const newPositions = new Float32Array(positions.array)

    // Simple Laplacian smoothing
    // Note: This is a simplified version - proper implementation would need adjacency info
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i)
      const y = positions.getY(i)
      const z = positions.getZ(i)

      // Average with neighbors (simplified - assumes sequential vertices are neighbors)
      let avgX = x,
        avgY = y,
        avgZ = z
      let count = 1

      if (i > 0) {
        avgX += positions.getX(i - 1)
        avgY += positions.getY(i - 1)
        avgZ += positions.getZ(i - 1)
        count++
      }

      if (i < positions.count - 1) {
        avgX += positions.getX(i + 1)
        avgY += positions.getY(i + 1)
        avgZ += positions.getZ(i + 1)
        count++
      }

      avgX /= count
      avgY /= count
      avgZ /= count

      // Blend original with averaged
      newPositions[i * 3] = x + (avgX - x) * factor
      newPositions[i * 3 + 1] = y + (avgY - y) * factor
      newPositions[i * 3 + 2] = z + (avgZ - z) * factor
    }

    for (let i = 0; i < newPositions.length; i++) {
      positions.array[i] = newPositions[i]
    }
  }

  positions.needsUpdate = true
  geometry.computeVertexNormals()
}

/**
 * Generate random seed for reproducible noise patterns
 * @param seed Seed number
 */
export function setNoiseSeed(seed: number): void {
  // Shuffle permutation array based on seed
  const rng = seedRandom(seed)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[permutation[i], permutation[j]] = [permutation[j], permutation[i]]
    p[i] = p[i + 256] = permutation[i]
  }
}

/**
 * Simple seeded random number generator
 */
function seedRandom(seed: number): () => number {
  return function () {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
}
