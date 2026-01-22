import { useMemo } from 'react'
import { BufferGeometry, Vector3, BufferAttribute } from 'three'
import { createLeftMWCScurve, createRightMWCScurve, sampleCurvePoints } from './geometry/AnatomicalCurves'
import { TissueType } from '../materials/TissueMaterials'

/**
 * CavernousSinus - Medial wall of cavernous sinus (MWCS)
 *
 * The cavernous sinus is a venous structure lateral to the sella turcica.
 * Its medial wall (MWCS) is a thin dural membrane that forms the lateral
 * boundary of the surgical corridor.
 *
 * Anatomical features:
 * - Thickness: 0.1-0.3mm (very thin membrane)
 * - Position: 1-2mm medial to ICA
 * - Follows ICA curve closely
 * - Contains venous blood (darker red/purple)
 *
 * Surgical significance:
 * - Natural lateral boundary for dissection
 * - Protects ICA from surgical instruments
 * - Violation → venous bleeding (manageable but obscures view)
 * - Less critical than ICA but still important landmark
 *
 * Visual appearance:
 * - Semi-transparent membrane
 * - Pearl-gray to purple-gray color
 * - Follows ICA contour
 */

export interface CavernousSinusProps {
  /** Side of MWCS (left or right) */
  side: 'left' | 'right'
  /** Membrane width in cm (default 0.3cm) */
  width?: number
}

export function CavernousSinus({ side, width = 0.3 }: CavernousSinusProps) {
  // Create MWCS curve based on side
  const curve = useMemo(() => {
    return side === 'left' ? createLeftMWCScurve() : createRightMWCScurve()
  }, [side])

  // Create membrane geometry along curve
  const membraneGeometry = useMemo(() => {
    const numSegments = 32
    const points = sampleCurvePoints(curve, numSegments)

    // Create vertices for ribbon-like membrane
    const vertices: number[] = []
    const indices: number[] = []
    const normals: number[] = []

    // Direction vector for membrane width
    const widthOffset = side === 'left' ? -1 : 1 // Extend medially

    for (let i = 0; i < points.length; i++) {
      const point = points[i]

      // Get tangent for perpendicular direction
      const t = i / (points.length - 1)
      const tangent = curve.getTangent(t)

      // Calculate perpendicular (cross with up vector)
      const perpendicular = new Vector3()
        .crossVectors(tangent, new Vector3(0, 1, 0))
        .normalize()
        .multiplyScalar(widthOffset)

      // Create two vertices (edges of membrane)
      const innerPoint = point.clone()
      const outerPoint = point.clone().add(perpendicular.clone().multiplyScalar(width))

      vertices.push(innerPoint.x, innerPoint.y, innerPoint.z)
      vertices.push(outerPoint.x, outerPoint.y, outerPoint.z)

      // Normal points forward (perpendicular to membrane surface)
      normals.push(0, 0, 1, 0, 0, 1)

      // Create triangles (two per segment, except last)
      if (i < points.length - 1) {
        const baseIndex = i * 2

        // Triangle 1
        indices.push(baseIndex, baseIndex + 1, baseIndex + 2)

        // Triangle 2
        indices.push(baseIndex + 1, baseIndex + 3, baseIndex + 2)
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(vertices), 3))
    geometry.setAttribute('normal', new BufferAttribute(new Float32Array(normals), 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    geometry.computeBoundingSphere()

    return geometry
  }, [curve, width, side])

  return (
    <group name={`mwcs-${side}`}>
      {/* MWCS membrane */}
      <mesh
        geometry={membraneGeometry}
        castShadow
        receiveShadow
        userData={{ tissueType: TissueType.MWCS }}
      >
        <meshStandardMaterial
          color="#d4c8d8" // Dural membrane color (purple-gray)
          roughness={0.4}
          metalness={0.0}
          opacity={0.7}
          transparent
          side={2} // DoubleSide for visibility from both angles
        />
      </mesh>

      {/* Subtle rim lighting */}
      <pointLight
        position={side === 'left' ? [-0.75, 0.2, -7.3] : [0.75, 0.2, -7.3]}
        intensity={0.15}
        distance={0.5}
        color="#e8dcc8"
        castShadow={false}
      />
    </group>
  )
}
