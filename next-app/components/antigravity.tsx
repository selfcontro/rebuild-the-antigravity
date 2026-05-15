"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useLayoutEffect, useMemo, useRef } from "react"
import * as THREE from "three"
import { computeAntigravityColor } from "@/lib/antigravity-color"
import { computeParticleDeformation } from "@/lib/antigravity-deformation"
import { createVirtualPointerState, getInteractionTarget } from "@/lib/antigravity-interaction"
import { stepParticleMotion, stepVirtualPointer } from "@/lib/antigravity-motion"
import { createParticles } from "@/lib/antigravity-particles"

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
  const virtualMouse = useRef(createVirtualPointerState())

  const particles = useMemo(
    () =>
      createParticles({
        count,
        height: viewport.height || 100,
        width: viewport.width || 100,
      }),
    [count, viewport.height, viewport.width]
  )

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

    const time = state.clock.getElapsedTime()
    const { destinationX, destinationY } = getInteractionTarget({
      autoAnimate,
      lastMouseMoveTime: lastMouseMoveTime.current,
      pointerX: pointer.x,
      pointerY: pointer.y,
      time,
      viewportHeight: view.height,
      viewportWidth: view.width,
    })

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
    const globalRotation = time * rotationSpeed
    const motionGain = THREE.MathUtils.clamp(0.72 + lerpSpeed * 0.5, 0.72, 0.95)

    particles.forEach((particle, index) => {
      const currentT = (particle.t += particle.speed / 2)
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

      const dx = particle.mx - motion.projectedTargetX
      const dy = particle.my - motion.projectedTargetY
      const currentDistanceToMouse = Math.hypot(particle.cx - motion.projectedTargetX, particle.cy - motion.projectedTargetY)
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

      const deformation = computeParticleDeformation({
        currentDistanceToMouse,
        currentT,
        fieldMix,
        particleSize,
        particleVariance,
        pulseSpeed,
        ringRadius,
        velocityX: particle.vx,
        velocityY: particle.vy,
        velocityZ: particle.vz,
        x: particle.cx,
        y: particle.cy,
        z: particle.cz,
      })

      dummy.position.set(particle.cx, particle.cy, particle.cz)
      dummy.lookAt(deformation.lookAtX, deformation.lookAtY, deformation.lookAtZ)
      dummy.rotateX(Math.PI / 2)
      dummy.scale.set(deformation.scaleX, deformation.scaleY, deformation.scaleZ)
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
