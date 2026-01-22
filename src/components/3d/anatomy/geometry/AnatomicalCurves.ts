import { CatmullRomCurve3, Vector3 } from 'three'

/**
 * AnatomicalCurves - Anatomically accurate 3D curves for vascular structures
 *
 * These curves define the spatial trajectory of blood vessels based on
 * surgical anatomy references and CT angiography data.
 */

/**
 * Internal Carotid Artery (ICA) - Parasellar segment
 *
 * The ICA passes lateral to the sphenoid sinus in a characteristic
 * S-shaped curve before entering the skull base. This is the most
 * critical structure to avoid during transsphenoidal surgery.
 *
 * Anatomical course:
 * 1. Ascends vertically from carotid canal
 * 2. Curves medially (toward midline)
 * 3. Forms carotid siphon with anterior bend
 * 4. Ascends toward anterior clinoid process
 *
 * Critical distances:
 * - From midline: 8-12mm (using 9mm)
 * - From sellar floor: 2-5mm (using 3mm)
 * - Diameter: 3.5-5mm (using 4mm = 0.4cm)
 */

/**
 * Generate ICA curve for left side
 * Returns CatmullRomCurve3 with anatomically accurate control points
 */
export function createLeftICAcurve(): CatmullRomCurve3 {
  const points = [
    // Point 1: Inferior entry (carotid canal level)
    new Vector3(-0.9, -0.5, -6.8),

    // Point 2: Ascending portion
    new Vector3(-0.9, -0.1, -7.0),

    // Point 3: Parasellar segment (lateral to sella)
    new Vector3(-0.88, 0.2, -7.3),

    // Point 4: Medial curve (approaching carotid siphon)
    new Vector3(-0.85, 0.5, -7.5),

    // Point 5: Superior exit (toward clinoid)
    new Vector3(-0.82, 0.8, -7.6),
  ]

  return new CatmullRomCurve3(points, false, 'catmullrom', 0.3)
}

/**
 * Generate ICA curve for right side
 * Mirror of left ICA curve across midline (sagittal plane)
 */
export function createRightICAcurve(): CatmullRomCurve3 {
  const points = [
    // Mirror left curve points across x-axis
    new Vector3(0.9, -0.5, -6.8),
    new Vector3(0.9, -0.1, -7.0),
    new Vector3(0.88, 0.2, -7.3),
    new Vector3(0.85, 0.5, -7.5),
    new Vector3(0.82, 0.8, -7.6),
  ]

  return new CatmullRomCurve3(points, false, 'catmullrom', 0.3)
}

/**
 * Generate MWCS (Medial Wall Cavernous Sinus) curve
 *
 * The MWCS is a thin dural membrane that separates the cavernous sinus
 * from the sphenoid sinus. It follows the medial contour of the ICA.
 *
 * Position: 1-2mm medial to ICA
 */
export function createLeftMWCScurve(): CatmullRomCurve3 {
  // Offset left ICA curve medially by 0.15cm (1.5mm)
  const offset = 0.15

  const points = [
    new Vector3(-0.9 + offset, -0.5, -6.8),
    new Vector3(-0.9 + offset, -0.1, -7.0),
    new Vector3(-0.88 + offset, 0.2, -7.3),
    new Vector3(-0.85 + offset, 0.5, -7.5),
    new Vector3(-0.82 + offset, 0.8, -7.6),
  ]

  return new CatmullRomCurve3(points, false, 'catmullrom', 0.3)
}

/**
 * Generate right MWCS curve
 * Mirror of left MWCS across midline
 */
export function createRightMWCScurve(): CatmullRomCurve3 {
  const offset = 0.15

  const points = [
    new Vector3(0.9 - offset, -0.5, -6.8),
    new Vector3(0.9 - offset, -0.1, -7.0),
    new Vector3(0.88 - offset, 0.2, -7.3),
    new Vector3(0.85 - offset, 0.5, -7.5),
    new Vector3(0.82 - offset, 0.8, -7.6),
  ]

  return new CatmullRomCurve3(points, false, 'catmullrom', 0.3)
}

/**
 * Get curve length for a given curve
 * Useful for uniform tube segment distribution
 */
export function getCurveLength(curve: CatmullRomCurve3): number {
  return curve.getLength()
}

/**
 * Sample points along curve at uniform intervals
 * @param curve The curve to sample
 * @param numPoints Number of points to sample
 * @returns Array of Vector3 positions
 */
export function sampleCurvePoints(curve: CatmullRomCurve3, numPoints: number): Vector3[] {
  const points: Vector3[] = []

  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1) // Normalized position (0-1)
    points.push(curve.getPoint(t))
  }

  return points
}

/**
 * Get tangent vector at curve position
 * @param curve The curve
 * @param t Normalized position (0-1)
 * @returns Tangent vector (normalized)
 */
export function getCurveTangent(curve: CatmullRomCurve3, t: number): Vector3 {
  return curve.getTangent(t).normalize()
}

/**
 * Calculate minimum distance between two curves
 * Useful for verifying anatomical spacing
 * @param curveA First curve
 * @param curveB Second curve
 * @param samples Number of sample points to check
 * @returns Minimum distance in cm
 */
export function getMinimumCurveDistance(
  curveA: CatmullRomCurve3,
  curveB: CatmullRomCurve3,
  samples: number = 50
): number {
  let minDistance = Infinity

  for (let i = 0; i < samples; i++) {
    const t = i / (samples - 1)
    const pointA = curveA.getPoint(t)
    const pointB = curveB.getPoint(t)
    const distance = pointA.distanceTo(pointB)

    if (distance < minDistance) {
      minDistance = distance
    }
  }

  return minDistance
}
