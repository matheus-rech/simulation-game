import { BufferGeometry, Material, Mesh, Texture, Scene, Object3D } from 'three'

/**
 * GeometryCleanup - Utilities for proper memory management
 *
 * Three.js does not automatically dispose of geometries, materials, and textures.
 * These utilities ensure proper cleanup to prevent memory leaks.
 *
 * Usage:
 * - Call disposeGeometry() when removing geometry from scene
 * - Call disposeMaterial() when removing material
 * - Call disposeObject() when removing entire mesh
 * - Call disposeScene() on cleanup (e.g., component unmount)
 */

/**
 * Dispose of a BufferGeometry and free GPU memory
 */
export function disposeGeometry(geometry: BufferGeometry): void {
  if (!geometry) return

  // Dispose of all attributes
  Object.keys(geometry.attributes).forEach(key => {
    const attribute = geometry.attributes[key]
    if (attribute && attribute.array) {
      // Array is freed by JS garbage collector
      delete geometry.attributes[key]
    }
  })

  // Dispose of index
  if (geometry.index) {
    geometry.index = null
  }

  // Call Three.js dispose
  geometry.dispose()
}

/**
 * Dispose of a Material and its textures
 */
export function disposeMaterial(material: Material | Material[]): void {
  if (!material) return

  const materials = Array.isArray(material) ? material : [material]

  materials.forEach(mat => {
    // Dispose of textures
    Object.keys(mat).forEach(key => {
      const value = (mat as any)[key]
      if (value && value instanceof Texture) {
        value.dispose()
      }
    })

    // Call Three.js dispose
    mat.dispose()
  })
}

/**
 * Dispose of a Mesh (geometry + material)
 */
export function disposeObject(object: Mesh): void {
  if (!object) return

  // Dispose geometry
  if (object.geometry) {
    disposeGeometry(object.geometry)
  }

  // Dispose material
  if (object.material) {
    disposeMaterial(object.material)
  }
}

/**
 * Recursively dispose of all objects in a scene or group
 */
export function disposeScene(scene: Scene | Object3D): void {
  if (!scene) return

  scene.traverse(object => {
    if (object instanceof Mesh) {
      disposeObject(object)
    }
  })

  // Clear children
  scene.children.forEach(child => {
    scene.remove(child)
  })
}

/**
 * Get memory usage statistics for a scene
 */
export interface MemoryStats {
  geometries: number
  materials: number
  textures: number
  meshes: number
  vertices: number
  triangles: number
}

export function getSceneMemoryStats(scene: Scene | Object3D): MemoryStats {
  const stats: MemoryStats = {
    geometries: 0,
    materials: 0,
    textures: 0,
    meshes: 0,
    vertices: 0,
    triangles: 0,
  }

  const geometrySet = new Set<BufferGeometry>()
  const materialSet = new Set<Material>()
  const textureSet = new Set<Texture>()

  scene.traverse(object => {
    if (object instanceof Mesh) {
      stats.meshes++

      // Count unique geometries
      if (object.geometry && !geometrySet.has(object.geometry)) {
        geometrySet.add(object.geometry)
        stats.geometries++

        // Count vertices and triangles
        if (object.geometry.attributes.position) {
          stats.vertices += object.geometry.attributes.position.count
        }
        if (object.geometry.index) {
          stats.triangles += object.geometry.index.count / 3
        } else if (object.geometry.attributes.position) {
          stats.triangles += object.geometry.attributes.position.count / 3
        }
      }

      // Count unique materials
      if (object.material) {
        const materials = Array.isArray(object.material) ? object.material : [object.material]
        materials.forEach(mat => {
          if (!materialSet.has(mat)) {
            materialSet.add(mat)
            stats.materials++

            // Count textures in material
            Object.keys(mat).forEach(key => {
              const value = (mat as any)[key]
              if (value && value instanceof Texture && !textureSet.has(value)) {
                textureSet.add(value)
                stats.textures++
              }
            })
          }
        })
      }
    }
  })

  return stats
}

/**
 * Log memory statistics to console
 */
export function logSceneMemoryStats(scene: Scene | Object3D, label: string = 'Scene'): void {
  const stats = getSceneMemoryStats(scene)
  console.log(`📊 ${label} Memory Statistics:`)
  console.log(`  Meshes: ${stats.meshes}`)
  console.log(`  Unique Geometries: ${stats.geometries}`)
  console.log(`  Unique Materials: ${stats.materials}`)
  console.log(`  Unique Textures: ${stats.textures}`)
  console.log(`  Total Vertices: ${stats.vertices.toLocaleString()}`)
  console.log(`  Total Triangles: ${Math.round(stats.triangles).toLocaleString()}`)
}

/**
 * Cleanup hook for React components
 * Returns a cleanup function to call on unmount
 */
export function useGeometryCleanup(scene?: Scene | Object3D) {
  return () => {
    if (scene) {
      disposeScene(scene)
    }
  }
}
