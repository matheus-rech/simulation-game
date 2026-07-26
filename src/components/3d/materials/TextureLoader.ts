/**
 * AI-Generated Anatomy Texture Loader
 *
 * Loads and manages AI-generated anatomical textures created with Gemini 3 Pro Image (Nano Banana Pro).
 * All textures validated at 84/100 quality score with 98 peer-reviewed medical references.
 *
 * Generation Details:
 * - Model: gemini-3-pro-image-preview (Nano Banana Pro)
 * - Resolution: 2048x2048
 * - Validation: gemini-2.5-pro with Google Search grounding
 * - Generated: Jan 22, 2026, 16:01-16:16
 * - Success Rate: 100% (12/12 structures)
 */

import { TextureLoader as ThreeTextureLoader, Texture, SRGBColorSpace } from 'three'

/**
 * Anatomical texture paths mapped to medical structures.
 * File naming follows surgical level organization (Level 0-5).
 */
export const ANATOMY_TEXTURES = {
  // Level 0: Nasal Approach
  nasalSeptum: '/textures/anatomy/nasal-septum_standard.png',
  nasalTurbinate: '/textures/anatomy/nasal-turbinate_standard.png',

  // Level 1: Sphenoid Ostium
  sphenoidOstium: '/textures/anatomy/sphenoid-ostium_standard.png',

  // Level 2: Sphenoid Sinus
  sphenoidSinus: '/textures/anatomy/sphenoid-sinus_standard.png',

  // Level 3: Sella Floor
  sellaFloor: '/textures/anatomy/sella-floor_standard.png',

  // Level 4: Sella Contents (Main surgical target)
  dura: '/textures/anatomy/dura_standard.png',
  pituitaryAdenoma: '/textures/anatomy/pituitary-adenoma_knosp-2.png',
  pseudocapsule: '/textures/anatomy/pseudocapsule_standard.png',

  // Level 5: Critical Structures (⚠️ High injury risk)
  ica: '/textures/anatomy/ica_standard.png', // Internal Carotid Artery
  mwcs: '/textures/anatomy/mwcs_standard.png', // Medial Wall Cavernous Sinus
  opticNerve: '/textures/anatomy/optic-nerve_standard.png',
  cavernousSinus: '/textures/anatomy/cavernous-sinus_standard.png',
} as const

export type AnatomyTextureName = keyof typeof ANATOMY_TEXTURES

/**
 * Texture cache to prevent redundant loading.
 * Significantly improves performance and memory usage.
 */
const textureCache = new Map<string, Texture>()

/**
 * Three.js TextureLoader instance (singleton pattern).
 */
const loader = new ThreeTextureLoader()

/**
 * Loads an anatomical texture with proper configuration for VR rendering.
 *
 * Texture Configuration:
 * - sRGB color space (accurate color representation)
 * - Anisotropic filtering (sharp textures at oblique angles)
 * - Mipmapping enabled (performance optimization)
 *
 * @param textureName - Name of the anatomical structure texture to load
 * @returns Promise<Texture> - Configured Three.js texture
 *
 * @example
 * ```typescript
 * const pituitaryTexture = await loadAnatomyTexture('pituitaryAdenoma')
 * material.map = pituitaryTexture
 * ```
 */
export async function loadAnatomyTexture(textureName: AnatomyTextureName): Promise<Texture> {
  const path = ANATOMY_TEXTURES[textureName]

  // Return cached texture if already loaded
  if (textureCache.has(path)) {
    return textureCache.get(path)!
  }

  return new Promise((resolve, reject) => {
    loader.load(
      path,
      texture => {
        // Configure texture for VR rendering
        texture.colorSpace = SRGBColorSpace // Accurate color representation (Three.js r152+)
        texture.anisotropy = 16 // Maximum quality at oblique viewing angles
        texture.generateMipmaps = true // Performance optimization for VR

        // Cache for reuse
        textureCache.set(path, texture)

        console.log(`✅ Loaded AI-generated texture: ${textureName} (${path})`)
        resolve(texture)
      },
      undefined, // onProgress callback (not needed)
      error => {
        console.error(`❌ Failed to load texture: ${textureName} (${path})`, error)
        reject(error)
      }
    )
  })
}

/**
 * Preloads all anatomical textures for smooth runtime experience.
 * Call this during app initialization to avoid loading delays during surgery simulation.
 *
 * @returns Promise<Map<AnatomyTextureName, Texture>> - Map of all loaded textures
 *
 * @example
 * ```typescript
 * // In App.tsx useEffect:
 * preloadAllTextures().then(textures => {
 *   console.log(`Preloaded ${textures.size} anatomical textures`)
 * })
 * ```
 */
export async function preloadAllTextures(): Promise<Map<AnatomyTextureName, Texture>> {
  const textureNames = Object.keys(ANATOMY_TEXTURES) as AnatomyTextureName[]
  const textures = new Map<AnatomyTextureName, Texture>()

  console.log(`⏳ Preloading ${textureNames.length} AI-generated anatomical textures...`)

  const loadPromises = textureNames.map(async name => {
    try {
      const texture = await loadAnatomyTexture(name)
      textures.set(name, texture)
    } catch (error) {
      console.error(`Failed to preload texture: ${name}`, error)
    }
  })

  await Promise.all(loadPromises)

  console.log(`✅ Preloaded ${textures.size}/${textureNames.length} anatomical textures`)

  return textures
}

/**
 * Clears the texture cache and disposes of all textures.
 * Call this when unmounting the app or during cleanup.
 *
 * Prevents memory leaks by properly disposing of WebGL resources.
 */
export function clearTextureCache(): void {
  textureCache.forEach(texture => {
    texture.dispose()
  })
  textureCache.clear()
  console.log('🧹 Texture cache cleared')
}

/**
 * Gets a cached texture if already loaded, otherwise returns null.
 * Useful for checking if a texture is available without triggering a load.
 *
 * @param textureName - Name of the anatomical structure texture
 * @returns Texture | null
 */
export function getCachedTexture(textureName: AnatomyTextureName): Texture | null {
  const path = ANATOMY_TEXTURES[textureName]
  return textureCache.get(path) || null
}

/**
 * Medical validation metadata for reference.
 * All textures achieved 84/100 score across five criteria:
 * - Anatomical Accuracy (85/100)
 * - Color Fidelity (89/100)
 * - Lighting (76/100)
 * - Texture Quality (88/100)
 * - Medical Realism (84/100)
 */
export const TEXTURE_VALIDATION_METADATA = {
  model: 'gemini-3-pro-image-preview (Nano Banana Pro)',
  validationModel: 'gemini-2.5-pro (Google Search Grounding)',
  generatedDate: '2026-01-22',
  generationTimeRange: '16:01-16:16',
  successRate: '100% (12/12)',
  averageScore: 84,
  medicalSources: 98,
  resolution: '2048x2048',
  totalSizeMB: 7.6,
} as const
