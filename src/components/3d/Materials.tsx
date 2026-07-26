import { MeshDistortMaterial } from '@react-three/drei'
import { MeshDistortMaterialProps } from '@react-three/drei'

export function MucosaMaterial(props: Partial<MeshDistortMaterialProps>) {
  return (
    <MeshDistortMaterial
      color="#c56c72"
      roughness={0.55}
      metalness={0.05}
      distort={0.18}
      speed={1.2}
      {...props}
    />
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function BoneMaterial(props: any) {
  return <meshStandardMaterial color="#f3eee4" roughness={0.75} metalness={0.05} {...props} />
}
