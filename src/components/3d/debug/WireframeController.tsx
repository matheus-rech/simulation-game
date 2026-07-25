import { useEffect, useCallback } from 'react'
import { useThree } from '@react-three/fiber'
import { Mesh } from 'three'

/**
 * WireframeController - Handles wireframe rendering inside Canvas
 *
 * This component MUST be inside <Canvas> as it uses useThree() hook.
 * Separated from DebugControls to allow keyboard handling outside Canvas.
 */

export interface WireframeControllerProps {
  /** Enable/disable wireframe mode */
  enabled: boolean
}

export function WireframeController({ enabled }: WireframeControllerProps) {
  const { scene } = useThree()

  // Apply wireframe mode to all materials in scene
  const applyWireframe = useCallback(
    (enableWireframe: boolean) => {
      scene.traverse((object) => {
        if (object instanceof Mesh) {
          const material = object.material
          if (material) {
            if (Array.isArray(material)) {
              material.forEach((mat) => {
                if ('wireframe' in mat) {
                  (mat as any).wireframe = enableWireframe
                }
              })
            } else {
              if ('wireframe' in material) {
                (material as any).wireframe = enableWireframe
              }
            }
          }
        }
      })
    },
    [scene]
  )

  // Update wireframe when enabled prop changes
  useEffect(() => {
    applyWireframe(enabled)
  }, [enabled, applyWireframe])

  // This component doesn't render anything
  return null
}
