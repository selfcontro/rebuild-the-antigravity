/* eslint-disable react-hooks/immutability */
"use client"

import { Canvas, useFrame, useThree } from "@react-three/fiber"
import { useEffect, useMemo, useRef } from "react"
import * as THREE from "three"

type AntigravityProps = {
  particleColumns?: number
  particleRows?: number
  baseColor?: string
  colorIntensity?: number
  fieldStrength?: number
}

type ParticleAttributeInput = {
  columns: number
  rows: number
  width: number
  height: number
}

const MEDUSAE_MOTION_DEFAULTS = {
  cursor: {
    radius: 0.065,
    strength: 3,
    dragFactor: 0.015,
  },
  halo: {
    outerOscFrequency: 2.6,
    outerOscAmplitude: 0.76,
    displayScale: 3.0,
    radiusBase: 2.4,
    radiusAmplitude: 0.5,
    shapeAmplitude: 0.75,
    rimWidth: 1.8,
    outerStartOffset: 0.4,
    outerEndOffset: 2.2,
    scaleX: 1.3,
    scaleY: 1,
  },
  particles: {
    baseSize: 0.016,
    activeSize: 0.044,
    displayScale: 2.2,
    blobScaleX: 1,
    blobScaleY: 0.6,
    rotationSpeed: 0.1,
    rotationJitter: 0.2,
    cursorFollowStrength: 1,
    oscillationFactor: 1,
    colorBase: "#0000ff",
    colorOne: "#4285f5",
    colorTwo: "#eb4236",
    colorThree: "#faba03",
  },
} as const

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453123
  return value - Math.floor(value)
}

function createParticleGeometry({ columns, rows, width, height }: ParticleAttributeInput) {
  const geometry = new THREE.PlaneGeometry(1, 1)
  const count = columns * rows
  const offsets = new Float32Array(count * 3)
  const randoms = new Float32Array(count)
  const safeColumns = Math.max(2, columns)
  const safeRows = Math.max(2, rows)
  const jitter = 0.25

  let index = 0
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u = column / (safeColumns - 1)
      const v = row / (safeRows - 1)
      const seed = seededUnit(index, 1)
      const xSeed = seededUnit(index, 2) - 0.5
      const ySeed = seededUnit(index, 3) - 0.5

      offsets[index * 3] = (u - 0.5) * width + xSeed * jitter
      offsets[index * 3 + 1] = (v - 0.5) * height + ySeed * jitter
      offsets[index * 3 + 2] = 0
      randoms[index] = seed
      index += 1
    }
  }

  geometry.setAttribute("aOffset", new THREE.InstancedBufferAttribute(offsets, 3))
  geometry.setAttribute("aRandom", new THREE.InstancedBufferAttribute(randoms, 1))

  return geometry
}

function createParticleMaterial({
  baseColor,
  colorIntensity,
  fieldStrength,
}: Required<Pick<AntigravityProps, "baseColor" | "colorIntensity" | "fieldStrength">>) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uBaseColor: { value: new THREE.Color(baseColor) },
      uColorIntensity: { value: colorIntensity },
      uParticleColorBase: { value: new THREE.Color(MEDUSAE_MOTION_DEFAULTS.particles.colorBase) },
      uParticleColorOne: { value: new THREE.Color(MEDUSAE_MOTION_DEFAULTS.particles.colorOne) },
      uParticleColorTwo: { value: new THREE.Color(MEDUSAE_MOTION_DEFAULTS.particles.colorTwo) },
      uParticleColorThree: { value: new THREE.Color(MEDUSAE_MOTION_DEFAULTS.particles.colorThree) },
      uFieldStrength: { value: fieldStrength },
      uOuterOscFrequency: { value: MEDUSAE_MOTION_DEFAULTS.halo.outerOscFrequency },
      uOuterOscAmplitude: { value: MEDUSAE_MOTION_DEFAULTS.halo.outerOscAmplitude },
      uHaloDisplayScale: { value: MEDUSAE_MOTION_DEFAULTS.halo.displayScale },
      uHaloRadiusBase: { value: MEDUSAE_MOTION_DEFAULTS.halo.radiusBase },
      uHaloRadiusAmplitude: { value: MEDUSAE_MOTION_DEFAULTS.halo.radiusAmplitude },
      uHaloShapeAmplitude: { value: MEDUSAE_MOTION_DEFAULTS.halo.shapeAmplitude },
      uHaloRimWidth: { value: MEDUSAE_MOTION_DEFAULTS.halo.rimWidth },
      uHaloOuterStartOffset: { value: MEDUSAE_MOTION_DEFAULTS.halo.outerStartOffset },
      uHaloOuterEndOffset: { value: MEDUSAE_MOTION_DEFAULTS.halo.outerEndOffset },
      uHaloScaleX: { value: MEDUSAE_MOTION_DEFAULTS.halo.scaleX },
      uHaloScaleY: { value: MEDUSAE_MOTION_DEFAULTS.halo.scaleY },
      uParticleBaseSize: { value: MEDUSAE_MOTION_DEFAULTS.particles.baseSize },
      uParticleActiveSize: { value: MEDUSAE_MOTION_DEFAULTS.particles.activeSize },
      uParticleDisplayScale: { value: MEDUSAE_MOTION_DEFAULTS.particles.displayScale },
      uBlobScaleX: { value: MEDUSAE_MOTION_DEFAULTS.particles.blobScaleX },
      uBlobScaleY: { value: MEDUSAE_MOTION_DEFAULTS.particles.blobScaleY },
      uParticleRotationSpeed: { value: MEDUSAE_MOTION_DEFAULTS.particles.rotationSpeed },
      uParticleRotationJitter: { value: MEDUSAE_MOTION_DEFAULTS.particles.rotationJitter },
      uParticleOscillationFactor: { value: MEDUSAE_MOTION_DEFAULTS.particles.oscillationFactor },
    },
    vertexShader: `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uFieldStrength;
      uniform float uOuterOscFrequency;
      uniform float uOuterOscAmplitude;
      uniform float uHaloDisplayScale;
      uniform float uHaloRadiusBase;
      uniform float uHaloRadiusAmplitude;
      uniform float uHaloShapeAmplitude;
      uniform float uHaloRimWidth;
      uniform float uHaloOuterStartOffset;
      uniform float uHaloOuterEndOffset;
      uniform float uHaloScaleX;
      uniform float uHaloScaleY;
      uniform float uParticleBaseSize;
      uniform float uParticleActiveSize;
      uniform float uParticleDisplayScale;
      uniform float uBlobScaleX;
      uniform float uBlobScaleY;
      uniform float uParticleRotationSpeed;
      uniform float uParticleRotationJitter;
      uniform float uParticleOscillationFactor;

      attribute vec3 aOffset;
      attribute float aRandom;

      varying vec2 vUv;
      varying vec2 vPos;
      varying float vInfluence;

      mat2 rotate2d(float angle) {
        float s = sin(angle);
        float c = cos(angle);
        return mat2(c, -s, s, c);
      }

      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      void main() {
        vUv = uv;

        vec3 pos = aOffset;
        float phase = aRandom * 6.28318530718;
        float slowTime = uTime * 0.15;

        float driftX = sin(slowTime + pos.y * 0.5) + sin(slowTime * 0.5 + pos.y * 2.0);
        float driftY = cos(slowTime + pos.x * 0.5) + cos(slowTime * 0.5 + pos.x * 2.0);
        pos.x += driftX * 0.25;
        pos.y += driftY * 0.25;

        vec2 relToMouse = pos.xy - uMouse;
        vec2 haloScale = max(vec2(uHaloScaleX, uHaloScaleY), vec2(0.0001));
        float dist = length(relToMouse / haloScale);
        vec2 dirToMouse = normalize(relToMouse + vec2(0.0001, 0.0));

        float shapeNoise = noise(dirToMouse * 2.0 + vec2(0.0, uTime * 0.1));
        float breath = sin(uTime * 0.8);
        float baseRadius = (uHaloRadiusBase + breath * uHaloRadiusAmplitude) * uHaloDisplayScale;
        float radius = baseRadius + shapeNoise * uHaloShapeAmplitude * uHaloDisplayScale;
        float rimWidth = uHaloRimWidth * uHaloDisplayScale;
        float outerStartOffset = uHaloOuterStartOffset * uHaloDisplayScale;
        float outerEndOffset = uHaloOuterEndOffset * uHaloDisplayScale;
        float rimInfluence = smoothstep(rimWidth, 0.0, abs(dist - radius));
        float outerInfluence = smoothstep(baseRadius + outerStartOffset, baseRadius + outerEndOffset, dist);
        float outerWave = sin(uTime * uOuterOscFrequency + pos.x * 0.6 + pos.y * 0.6);

        float pushAmount = (breath * 0.5 + 0.5) * 0.5;
        pos.xy += dirToMouse * pushAmount * rimInfluence * uFieldStrength;
        pos.xy += dirToMouse * outerWave * uOuterOscAmplitude * outerInfluence * uFieldStrength;
        pos.z += rimInfluence * 0.3 * sin(uTime);

        float influence = rimInfluence;
        float baseSize = uParticleBaseSize + sin(uTime + pos.x) * 0.003;
        float activeSize = uParticleActiveSize;
        float currentScale = baseSize + rimInfluence * activeSize;
        float stretch = rimInfluence * 0.02;

        vec3 transformed = position;
        transformed.x *= (currentScale + stretch) * uBlobScaleX;
        transformed.y *= currentScale * uBlobScaleY;
        transformed.xy *= uParticleDisplayScale;

        float dirLen = max(length(relToMouse), 0.0001);
        vec2 dir = relToMouse / dirLen;
        float osc = 0.5 + 0.5 * sin(uTime * (0.25 + uParticleOscillationFactor * 0.35) + phase);
        float speedScale = mix(0.55, 1.35, osc) * (0.8 + uParticleOscillationFactor * 0.2);
        float jitterScale = mix(0.7, 1.45, osc) * (0.85 + uParticleOscillationFactor * 0.15);
        float jitter = sin(uTime * uParticleRotationSpeed * speedScale + pos.x * 0.35 + pos.y * 0.35) * (uParticleRotationJitter * jitterScale);
        vec2 perp = vec2(-dir.y, dir.x);
        vec2 jitteredDir = normalize(dir + perp * jitter);
        mat2 rot = mat2(jitteredDir.x, jitteredDir.y, -jitteredDir.y, jitteredDir.x);
        transformed.xy = rot * transformed.xy;

        vInfluence = influence;
        vPos = pos.xy;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos + transformed, 1.0);
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uBaseColor;
      uniform float uColorIntensity;
      uniform vec3 uParticleColorBase;
      uniform vec3 uParticleColorOne;
      uniform vec3 uParticleColorTwo;
      uniform vec3 uParticleColorThree;

      varying vec2 vUv;
      varying vec2 vPos;
      varying float vInfluence;

      void main() {
        vec2 center = vec2(0.5);
        vec2 local = abs(vUv - center) * 2.0;
        float d = pow(pow(local.x, 2.6) + pow(local.y, 2.6), 1.0 / 2.6);
        float alpha = 1.0 - smoothstep(0.8, 1.0, d);

        if (alpha < 0.01) discard;

        vec3 baseParticleColor = mix(uParticleColorBase, uBaseColor, 1.0 - uColorIntensity);
        vec3 colorOne = uParticleColorOne;
        vec3 colorTwo = uParticleColorTwo;
        vec3 colorThree = uParticleColorThree;

        float t = uTime * 1.2;
        float p1 = sin(vPos.x * 0.8 + t);
        float p2 = sin(vPos.y * 0.8 + t * 0.8 + p1);

        vec3 activeColor = mix(colorOne, colorTwo, p1 * 0.5 + 0.5);
        activeColor = mix(activeColor, colorThree, p2 * 0.5 + 0.5);

        float colorMix = smoothstep(0.1, 0.8, vInfluence) * uColorIntensity;
        vec3 finalColor = mix(baseParticleColor, activeColor, colorMix);
        float finalAlpha = alpha * mix(0.22, 0.68, vInfluence);

        gl_FragColor = vec4(finalColor, finalAlpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
  })
}

function AntigravityParticles({
  particleColumns = 100,
  particleRows = 55,
  baseColor = MEDUSAE_MOTION_DEFAULTS.particles.colorBase,
  colorIntensity = 1,
  fieldStrength = 1,
}: AntigravityProps) {
  const { viewport } = useThree()
  const smoothMouse = useRef(new THREE.Vector2(0, 0))
  const globalPointer = useRef<{ x: number; y: number } | null>(null)
  const hovering = useRef(true)
  const count = particleColumns * particleRows
  const fieldWidth = Math.max(viewport.width * 1.12, 40)
  const fieldHeight = Math.max(viewport.height * 1.12, 22)

  const geometry = useMemo(
    () =>
      createParticleGeometry({
        columns: particleColumns,
        rows: particleRows,
        width: fieldWidth,
        height: fieldHeight,
      }),
    [fieldHeight, fieldWidth, particleColumns, particleRows]
  )

  const material = useMemo(
    () =>
      createParticleMaterial({
        baseColor,
        colorIntensity,
        fieldStrength,
      }),
    [baseColor, colorIntensity, fieldStrength]
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  useEffect(() => {
    const handleLeave = () => {
      hovering.current = false
    }
    const handleEnter = () => {
      hovering.current = true
    }
    const syncPointer = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth) * 2 - 1
      const y = -(event.clientY / window.innerHeight) * 2 + 1
      globalPointer.current = { x, y }
    }

    document.body.addEventListener("mouseleave", handleLeave)
    document.body.addEventListener("mouseenter", handleEnter)
    window.addEventListener("pointerenter", syncPointer)
    window.addEventListener("pointermove", syncPointer)
    window.addEventListener("pointerdown", syncPointer)

    return () => {
      document.body.removeEventListener("mouseleave", handleLeave)
      document.body.removeEventListener("mouseenter", handleEnter)
      window.removeEventListener("pointerenter", syncPointer)
      window.removeEventListener("pointermove", syncPointer)
      window.removeEventListener("pointerdown", syncPointer)
    }
  }, [])

  useFrame((state) => {
    const { clock, pointer } = state
    material.uniforms.uTime.value = clock.getElapsedTime()

    let targetX: number | null = null
    let targetY: number | null = null

    if (hovering.current) {
      const pointerSource = globalPointer.current ?? pointer
      const baseX = (pointerSource.x * viewport.width) / 2
      const baseY = (pointerSource.y * viewport.height) / 2
      const time = clock.getElapsedTime()
      const jitterRadius = Math.min(viewport.width, viewport.height) * MEDUSAE_MOTION_DEFAULTS.cursor.radius
      const jitterX = (Math.sin(time * 0.35) + Math.sin(time * 0.77 + 1.2)) * 0.5
      const jitterY = (Math.cos(time * 0.31) + Math.sin(time * 0.63 + 2.4)) * 0.5
      const followStrength = MEDUSAE_MOTION_DEFAULTS.particles.cursorFollowStrength

      targetX = (baseX + jitterX * jitterRadius * MEDUSAE_MOTION_DEFAULTS.cursor.strength) * followStrength
      targetY = (baseY + jitterY * jitterRadius * MEDUSAE_MOTION_DEFAULTS.cursor.strength) * followStrength
    }

    if (targetX !== null && targetY !== null) {
      const dragFactor = MEDUSAE_MOTION_DEFAULTS.cursor.dragFactor
      smoothMouse.current.x += (targetX - smoothMouse.current.x) * dragFactor
      smoothMouse.current.y += (targetY - smoothMouse.current.y) * dragFactor
    }

    material.uniforms.uMouse.value.copy(smoothMouse.current)
  })

  return <instancedMesh args={[geometry, material, count]} />
}

export function Antigravity(props: AntigravityProps) {
  return (
    <Canvas
      camera={{ position: [0, 0, 42], fov: 35 }}
      dpr={1}
      gl={{ antialias: true, alpha: true }}
      style={{ width: "100%", height: "100%" }}
    >
      <AntigravityParticles {...props} />
    </Canvas>
  )
}
