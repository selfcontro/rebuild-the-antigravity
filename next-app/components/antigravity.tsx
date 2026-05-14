"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useMemo, useRef } from "react"
import * as THREE from "three"

type ParticleShape = "capsule" | "sphere" | "box" | "tetrahedron"

type AntigravityProps = {
  count?: number
  magnetRadius?: number
  ringRadius?: number
  waveSpeed?: number
  waveAmplitude?: number
  particleSize?: number
  lerpSpeed?: number
  color?: string
  autoAnimate?: boolean
  particleVariance?: number
  rotationSpeed?: number
  depthFactor?: number
  pulseSpeed?: number
  particleShape?: ParticleShape
  fieldStrength?: number
}

type ParticleRecord = {
  t: number
  speed: number
  mx: number
  my: number
  mz: number
  cx: number
  cy: number
  cz: number
  vx: number
  vy: number
  vz: number
  randomRadiusOffset: number
}

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453123
  return value - Math.floor(value)
}

function AntigravityInner({
  count = 300,
  magnetRadius = 10,
  ringRadius = 10,
  waveSpeed = 0.4,
  waveAmplitude = 1,
  particleSize = 2,
  lerpSpeed = 0.1,
  color = "#FF9FFC",
  autoAnimate = false,
  particleVariance = 1,
  rotationSpeed = 0,
  depthFactor = 1,
  pulseSpeed = 3,
  particleShape = "capsule",
  fieldStrength = 10,
}: AntigravityProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const { viewport } = useThree()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const lastMousePos = useRef({ x: 0, y: 0 })
  const lastMouseMoveTime = useRef(0)
  const virtualMouse = useRef({ x: 0, y: 0 })

  const particles = useMemo<ParticleRecord[]>(() => {
    const records: ParticleRecord[] = []
    const width = viewport.width || 100
    const height = viewport.height || 100

    for (let index = 0; index < count; index += 1) {
      const t = seededUnit(index, 1) * 100
      const speed = 0.01 + seededUnit(index, 2) / 200
      const x = (seededUnit(index, 3) - 0.5) * width
      const y = (seededUnit(index, 4) - 0.5) * height
      const z = (seededUnit(index, 5) - 0.5) * 20

      records.push({
        t,
        speed,
        mx: x,
        my: y,
        mz: z,
        cx: x,
        cy: y,
        cz: z,
        vx: 0,
        vy: 0,
        vz: 0,
        randomRadiusOffset: (seededUnit(index, 6) - 0.5) * 2,
      })
    }

    return records
  }, [count, viewport.height, viewport.width])

  useFrame((state) => {
    const mesh = meshRef.current
    if (!mesh) return

    const { viewport: view, pointer } = state
    const mouseDistance = Math.hypot(pointer.x - lastMousePos.current.x, pointer.y - lastMousePos.current.y)

    if (mouseDistance > 0.001) {
      lastMouseMoveTime.current = Date.now()
      lastMousePos.current = { x: pointer.x, y: pointer.y }
    }

    let destinationX = (pointer.x * view.width) / 2
    let destinationY = (pointer.y * view.height) / 2

    if (autoAnimate && Date.now() - lastMouseMoveTime.current > 2000) {
      const time = state.clock.getElapsedTime()
      destinationX = Math.sin(time * 0.5) * (view.width / 4)
      destinationY = Math.cos(time) * (view.height / 4)
    }

    virtualMouse.current.x += (destinationX - virtualMouse.current.x) * 0.05
    virtualMouse.current.y += (destinationY - virtualMouse.current.y) * 0.05

    const targetX = virtualMouse.current.x
    const targetY = virtualMouse.current.y
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed

    particles.forEach((particle, index) => {
      const currentT = (particle.t += particle.speed / 2)
      const projectionFactor = 1 - particle.cz / 50
      const projectedTargetX = targetX * projectionFactor
      const projectedTargetY = targetY * projectionFactor

      const dx = particle.mx - projectedTargetX
      const dy = particle.my - projectedTargetY
      const distance = Math.hypot(dx, dy)

      let targetPosition = {
        x: particle.mx,
        y: particle.my,
        z: particle.mz * depthFactor,
      }

      if (distance < magnetRadius) {
        const angle = Math.atan2(dy, dx) + globalRotation
        const wave = Math.sin(currentT * waveSpeed + angle) * (0.5 * waveAmplitude)
        const deviation = particle.randomRadiusOffset * (5 / (fieldStrength + 0.1))
        const currentRingRadius = ringRadius + wave + deviation

        targetPosition = {
          x: projectedTargetX + currentRingRadius * Math.cos(angle),
          y: projectedTargetY + currentRingRadius * Math.sin(angle),
          z: particle.mz * depthFactor + Math.sin(currentT) * waveAmplitude * depthFactor,
        }
      }

      particle.cx += (targetPosition.x - particle.cx) * lerpSpeed
      particle.cy += (targetPosition.y - particle.cy) * lerpSpeed
      particle.cz += (targetPosition.z - particle.cz) * lerpSpeed

      dummy.position.set(particle.cx, particle.cy, particle.cz)
      dummy.lookAt(projectedTargetX, projectedTargetY, particle.cz)
      dummy.rotateX(Math.PI / 2)

      const currentDistanceToMouse = Math.hypot(particle.cx - projectedTargetX, particle.cy - projectedTargetY)
      const distanceFromRing = Math.abs(currentDistanceToMouse - ringRadius)
      const normalizedScale = Math.max(0, Math.min(1, 1 - distanceFromRing / 10))
      const pulse = 0.8 + Math.sin(currentT * pulseSpeed) * 0.2 * particleVariance
      const finalScale = normalizedScale * pulse * particleSize

      dummy.scale.set(finalScale, finalScale, finalScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
    })

    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === "capsule" && <capsuleGeometry args={[0.1, 0.4, 4, 8]} />}
      {particleShape === "sphere" && <sphereGeometry args={[0.2, 16, 16]} />}
      {particleShape === "box" && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {particleShape === "tetrahedron" && <tetrahedronGeometry args={[0.3]} />}
      <meshBasicMaterial color={color} />
    </instancedMesh>
  )
}

export function Antigravity(props: AntigravityProps) {
  return (
    <Canvas camera={{ position: [0, 0, 50], fov: 35 }} dpr={[1, 2]}>
      <AntigravityInner {...props} />
    </Canvas>
  )
}
