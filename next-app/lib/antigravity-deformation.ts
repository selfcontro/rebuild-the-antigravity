import * as THREE from "three"

type DeformationInput = {
  currentDistanceToMouse: number
  fieldMix: number
  magnetRadius: number
  particleSize: number
  freezeScale?: boolean
  targetX: number
  targetY: number
  waveDisplacement: number
  waveEnvelope: number
  wavePhase: number
  ringBandMix: number
  z: number
}

export type ParticleDeformation = {
  lookAtX: number
  lookAtY: number
  lookAtZ: number
  scaleX: number
  scaleY: number
  scaleZ: number
}

export function computeParticleDeformation({
  currentDistanceToMouse,
  fieldMix,
  magnetRadius,
  particleSize,
  freezeScale = false,
  targetX,
  targetY,
  waveDisplacement,
  waveEnvelope,
  wavePhase,
  ringBandMix,
  z,
}: DeformationInput): ParticleDeformation {
  if (freezeScale) {
    const staticScale = particleSize * 0.45
    return {
      lookAtX: targetX,
      lookAtY: targetY,
      lookAtZ: z,
      scaleX: staticScale,
      scaleY: staticScale,
      scaleZ: staticScale,
    }
  }

  const influenceRadius = Math.max(magnetRadius * 2.15, 0.001)
  const radialNorm = THREE.MathUtils.clamp(currentDistanceToMouse / influenceRadius, 0, 1)
  const outerFade = 1 - THREE.MathUtils.smoothstep(radialNorm, 0.9, 1)
  const centerMinimumZone = 1 - THREE.MathUtils.smoothstep(radialNorm, 0.02, 0.14)
  const centerFloor = 1 - THREE.MathUtils.smoothstep(radialNorm, 0.01, 0.12)
  const ringPresence =
    THREE.MathUtils.smoothstep(radialNorm, 0.1, 0.24) * (1 - THREE.MathUtils.smoothstep(radialNorm, 0.56, 0.92))
  const localField = 1 - THREE.MathUtils.smoothstep(radialNorm, 0.08, 0.96)
  const baseScale =
    particleSize *
    (0.012 + centerFloor * 0.18 + centerMinimumZone * 0.032 + ringPresence * 0.72 + outerFade * 0.06 + fieldMix * 0.024)
  const breathingMask = localField * (0.58 + ringBandMix * 0.42)
  const breathSignal = Math.sin(wavePhase) * waveEnvelope * breathingMask
  const phaseAccent = 0.88 + 0.12 * Math.cos(wavePhase)
  const grow = Math.max(0, breathSignal) * (1.04 + ringPresence * 0.72) * phaseAccent
  const shrink = Math.max(0, -breathSignal) * (0.54 + ringPresence * 0.24)
  const displacementHint = Math.max(0, waveDisplacement) * 0.18
  const finalScale = THREE.MathUtils.clamp(
    baseScale * (0.94 + grow - shrink + displacementHint) * outerFade,
    particleSize * 0.08,
    particleSize * 2.2
  )

  return {
    lookAtX: targetX,
    lookAtY: targetY,
    lookAtZ: z,
    scaleX: finalScale,
    scaleY: finalScale,
    scaleZ: finalScale,
  }
}
