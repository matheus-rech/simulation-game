import { useMemo } from 'react'
import { BoxGeometry, PlaneGeometry } from 'three'
import { subtract, union } from './geometry/CSGOperations'

/**
 * SphenoidSinus - Anatomically accurate sphenoid sinus with septations
 *
 * The sphenoid sinus is an air-filled cavity in the sphenoid bone, located
 * posterior to the nasal cavity. It's a critical surgical corridor for the
 * transsphenoidal approach to the pituitary gland.
 *
 * Key anatomical features:
 * - Paired air cavities (often asymmetric)
 * - 1-3 bony septations dividing the cavity
 * - Sellar floor (superior wall) - thin bone over sella turcica
 * - Lateral walls contain critical structures (ICA, optic nerves)
 *
 * Dimensions (typical adult):
 * - Width: 18-22mm (using 20mm)
 * - Height: 12-15mm (using 14mm)
 * - Depth: 12-15mm (using 14mm)
 * - Wall thickness: 0.5-1mm (using 0.8mm)
 * - Septation thickness: 0.3-0.5mm (using 0.4mm)
 */

export interface SphenoidSinusProps {
  /** Number of bony septations (1-3, randomized if not specified) */
  septationCount?: number
  /** Seed for reproducible septation placement */
  seed?: number
  /** Show sellar floor (superior wall) */
  showSellarFloor?: boolean
}

export function SphenoidSinus({
  septationCount,
  seed = 12345,
  showSellarFloor = true,
}: SphenoidSinusProps) {
  // Generate reproducible random number from seed
  const seededRandom = useMemo(() => {
    let s = seed
    return () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
  }, [seed])

  // Determine septation count (1-3 if not specified)
  const numSeptations = useMemo(() => {
    if (septationCount !== undefined) return septationCount
    const rand = seededRandom()
    if (rand < 0.4) return 1 // 40% chance
    if (rand < 0.8) return 2 // 40% chance
    return 3 // 20% chance
  }, [septationCount, seededRandom])

  // Generate CSG cavity with septations
  const sinusGeometry = useMemo(() => {
    // Outer shell (bone)
    const outerWidth = 2.0 // 20mm
    const outerHeight = 1.4 // 14mm
    const outerDepth = 1.4 // 14mm
    const outer = new BoxGeometry(outerWidth, outerHeight, outerDepth)

    // Inner cavity (air)
    const wallThickness = 0.08 // 0.8mm
    const innerWidth = outerWidth - wallThickness * 2
    const innerHeight = outerHeight - wallThickness * 2
    const innerDepth = outerDepth - wallThickness * 2
    const inner = new BoxGeometry(innerWidth, innerHeight, innerDepth)

    // Create hollow cavity
    let cavity = subtract(outer, inner)

    // Add septations (vertical dividing walls)
    const septationThickness = 0.04 // 0.4mm
    const septationHeight = innerHeight
    const septationDepth = innerDepth

    for (let i = 0; i < numSeptations; i++) {
      // Position septations at regular intervals across width
      const septationGeom = new BoxGeometry(
        septationThickness,
        septationHeight,
        septationDepth
      )

      // Calculate x position for this septation
      // Distribute evenly across the cavity width
      const spacing = innerWidth / (numSeptations + 1)
      const xOffset = -innerWidth / 2 + spacing * (i + 1)

      // Translate septation to position
      septationGeom.translate(xOffset, 0, 0)

      // Union septation with cavity
      cavity = union(cavity, septationGeom)
    }

    // Cleanup geometry
    cavity.computeVertexNormals()
    cavity.computeBoundingBox()
    cavity.computeBoundingSphere()

    return cavity
  }, [numSeptations])

  // Sellar floor geometry (thin superior wall)
  const sellarFloorGeometry = useMemo(() => {
    const width = 1.8 // Slightly smaller than sinus width
    const depth = 1.2
    const floor = new PlaneGeometry(width, depth)

    // Rotate to face downward (into sinus)
    floor.rotateX(-Math.PI / 2)

    // Position at top of sinus (superior aspect)
    floor.translate(0, 0.7, 0)

    return floor
  }, [])

  return (
    <group name="sphenoid-sinus">
      {/* Main sinus cavity with septations */}
      <mesh geometry={sinusGeometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#f3eee4" // Bone color
          roughness={0.75}
          metalness={0.0}
        />
      </mesh>

      {/* Sellar floor (superior wall) - thinner bone */}
      {showSellarFloor && (
        <mesh geometry={sellarFloorGeometry} castShadow receiveShadow>
          <meshStandardMaterial
            color="#f3eee4"
            roughness={0.75}
            metalness={0.0}
            opacity={0.9}
            transparent
          />
        </mesh>
      )}

      {/* Interior lighting (simulate ambient reflection from surgical light) */}
      <pointLight
        position={[0, 0, 0]}
        intensity={0.3}
        distance={2.5}
        color="#f7d9cd"
        castShadow={false}
      />
    </group>
  )
}
