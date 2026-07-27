import { describe, expect, it } from 'vitest'
import { Mesh, MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import { TissueType } from '../materials/TissueMaterials'
import { createRaycastCollision } from '../EndoscopeRig'

describe('createRaycastCollision', () => {
  it('preserves the hit position and tissue metadata for the scoring flow', () => {
    const object = new Mesh(new SphereGeometry(), new MeshBasicMaterial())
    object.name = 'internal-carotid-right'
    object.userData.tissueType = TissueType.ICA

    const collision = createRaycastCollision({
      distance: 0.1,
      point: new Vector3(1, 2, 3),
      object,
    })

    expect(collision).toMatchObject({
      position: { x: 1, y: 2, z: 3 },
      objectName: 'internal-carotid-right',
      tissueType: TissueType.ICA,
      distance: 0.1,
      intensity: 0.75,
    })
  })

  it('falls back to mucosa when a mesh has no tissue classification', () => {
    const object = new Mesh(new SphereGeometry(), new MeshBasicMaterial())

    const collision = createRaycastCollision({
      distance: 0.4,
      point: new Vector3(),
      object,
    })

    expect(collision.tissueType).toBe(TissueType.MUCOSA)
    expect(collision.intensity).toBe(0)
  })
})
