"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { computeAntigravityColor } from "@/lib/antigravity-color"
import { stepParticleMotion, stepVirtualPointer } from "@/lib/antigravity-motion"

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
  colorSeed: number
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
  const colorAttributeRef = useRef<THREE.InstancedBufferAttribute | null>(null)
  const colorDummy = useMemo(() => new THREE.Color(), [])
  const accentColor = useMemo(() => new THREE.Color(color), [color])
  const lastMousePos = useRef({ x: 0, y: 0 })
  const lastMouseMoveTime = useRef(0)
  const virtualMouse = useRef({ x: 0, y: 0, vx: 0, vy: 0 })

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
        colorSeed: seededUnit(index, 7),
      })
    }

    return records
  }, [count, viewport.height, viewport.width])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return

    const colorAttribute = new THREE.InstancedBufferAttribute(new Float32Array(count * 3), 3)
    mesh.geometry.setAttribute("instanceTone", colorAttribute)
    colorAttributeRef.current = colorAttribute

    for (let index = 0; index < count; index += 1) {
      colorAttribute.setXYZ(index, accentColor.r, accentColor.g, accentColor.b)
    }

    colorAttribute.needsUpdate = true
    const material = mesh.material
    if (Array.isArray(material)) {
      material.forEach((entry) => {
        entry.needsUpdate = true
      })
    } else {
      material.needsUpdate = true
    }
  }, [accentColor, count])

  useFrame((state, delta) => {
    const mesh = meshRef.current
    const colorAttribute = colorAttributeRef.current
    if (!mesh || !colorAttribute) return

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

    virtualMouse.current = stepVirtualPointer({
      currentX: virtualMouse.current.x,
      currentY: virtualMouse.current.y,
      currentVX: virtualMouse.current.vx,
      currentVY: virtualMouse.current.vy,
      deltaSeconds: delta,
      destinationX,
      destinationY,
    })

    const targetX = virtualMouse.current.x
    const targetY = virtualMouse.current.y
    const globalRotation = state.clock.getElapsedTime() * rotationSpeed
    const motionGain = THREE.MathUtils.clamp(0.72 + lerpSpeed * 0.5, 0.72, 0.95)

    particles.forEach((particle, index) => {
      const currentT = (particle.t += particle.speed / 2)
      const time = state.clock.getElapsedTime()
      const motion = stepParticleMotion({
        currentT,
        currentX: particle.cx,
        currentY: particle.cy,
        currentZ: particle.cz,
        velocityX: particle.vx,
        velocityY: particle.vy,
        velocityZ: particle.vz,
        deltaSeconds: delta,
        depthFactor,
        fieldStrength,
        globalRotation,
        magnetRadius,
        randomRadiusOffset: particle.randomRadiusOffset,
        ringRadius,
        targetX,
        targetY,
        targetVelocityX: virtualMouse.current.vx,
        targetVelocityY: virtualMouse.current.vy,
        waveAmplitude,
        waveSpeed,
        baseX: particle.mx,
        baseY: particle.my,
        baseZ: particle.mz,
      })

      particle.cx = THREE.MathUtils.lerp(particle.cx, motion.nextX, motionGain)
      particle.cy = THREE.MathUtils.lerp(particle.cy, motion.nextY, motionGain)
      particle.cz = THREE.MathUtils.lerp(particle.cz, motion.nextZ, motionGain - 0.06)
      particle.vx = motion.velocityX
      particle.vy = motion.velocityY
      particle.vz = motion.velocityZ

      dummy.position.set(particle.cx, particle.cy, particle.cz)
      const velocityLookahead = 8
      dummy.lookAt(
        particle.cx + particle.vx * velocityLookahead,
        particle.cy + particle.vy * velocityLookahead,
        particle.cz + particle.vz * velocityLookahead * 0.5
      )
      dummy.rotateX(Math.PI / 2)

      const dx = particle.mx - motion.projectedTargetX
      const dy = particle.my - motion.projectedTargetY
      const currentDistanceToMouse = Math.hypot(particle.cx - motion.projectedTargetX, particle.cy - motion.projectedTargetY)
      const distanceFromRing = Math.abs(currentDistanceToMouse - ringRadius)
      const normalizedScale = Math.max(0, Math.min(1, 1 - distanceFromRing / 10))
      const pulse = 0.78 + Math.sin(currentT * pulseSpeed) * 0.18 * particleVariance + motion.fieldMix * 0.08
      const finalScale = normalizedScale * pulse * particleSize
      const fieldMix = motion.fieldMix
      const depthMix = Math.max(0, Math.min(1, 1 - Math.abs(particle.cz) / 24))
      const anchorX = particle.mx
      const anchorY = particle.my
      const anchorZ = particle.mz * depthFactor
      const { accentBlend, hue, lightness, saturation } = computeAntigravityColor({
        anchorX,
        anchorY,
        anchorZ,
        angleToCursor: Math.atan2(dy, dx),
        depthMix,
        distanceToCursor: Math.hypot(particle.cx - motion.projectedTargetX, particle.cy - motion.projectedTargetY),
        fieldMix,
        magnetRadius,
        particleSeed: particle.colorSeed,
        time,
      })

      colorDummy.setHSL(hue, saturation, lightness).lerp(accentColor, accentBlend)

      dummy.scale.set(finalScale, finalScale, finalScale)
      dummy.updateMatrix()
      mesh.setMatrixAt(index, dummy.matrix)
      colorAttribute.setXYZ(index, colorDummy.r, colorDummy.g, colorDummy.b)
    })

    mesh.instanceMatrix.needsUpdate = true
    colorAttribute.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      {particleShape === "capsule" && <capsuleGeometry args={[0.1, 0.4, 4, 8]} />}
      {particleShape === "sphere" && <sphereGeometry args={[0.2, 16, 16]} />}
      {particleShape === "box" && <boxGeometry args={[0.3, 0.3, 0.3]} />}
      {particleShape === "tetrahedron" && <tetrahedronGeometry args={[0.3]} />}
      <shaderMaterial
        transparent
        uniforms={{}}
        vertexShader={`
          attribute vec3 instanceTone;
          varying vec3 vTone;

          void main() {
            vTone = instanceTone;
            vec4 worldPosition = instanceMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * worldPosition;
          }
        `}
        fragmentShader={`
          varying vec3 vTone;

          void main() {
            gl_FragColor = vec4(vTone, 0.98);
          }
        `}
      />
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
