import * as THREE from "three"

type AntigravityColorInput = {
  anchorX: number
  anchorY: number
  anchorZ: number
  angleToCursor: number
  depthMix: number
  distanceToCursor: number
  fieldMix: number
  magnetRadius: number
  particleSeed: number
  time: number
}

export function computeAntigravityColor({
  anchorX,
  anchorY,
  anchorZ,
  angleToCursor,
  depthMix,
  distanceToCursor,
  fieldMix,
  magnetRadius,
  particleSeed,
  time,
}: AntigravityColorInput) {
  const fieldPhase = particleSeed * Math.PI * 2
  const radialNorm = THREE.MathUtils.clamp(distanceToCursor / Math.max(magnetRadius * 2, 0.001), 0, 1)
  const radialWave = Math.sin(time * 4.6 - radialNorm * 8.4 + fieldPhase * 0.7) * 0.5 + 0.5
  const orbitalWave = Math.cos(time * 2.9 + angleToCursor * 1.45 + fieldPhase) * 0.5 + 0.5
  const depthWave = Math.sin(time * 2 + anchorZ * 0.03 + fieldPhase * 0.8) * 0.5 + 0.5
  const breathe = Math.sin(time * 4.1 + anchorX * 0.006 + anchorY * 0.004 + fieldPhase) * 0.5 + 0.5
  const shimmer = Math.cos(time * 3.3 + anchorY * 0.009 - anchorZ * 0.013 + fieldPhase * 0.45) * 0.5 + 0.5

  const hue = THREE.MathUtils.euclideanModulo(
    0.06 + radialNorm * 0.52 + radialWave * 0.18 + orbitalWave * 0.12 + depthWave * 0.08 + time * 0.12,
    1
  )
  const saturation = THREE.MathUtils.clamp(0.82 + breathe * 0.08 + shimmer * 0.06 + fieldMix * 0.08, 0.78, 1)
  const lightness = THREE.MathUtils.clamp(
    0.52 + depthMix * 0.08 + radialWave * 0.1 - radialNorm * 0.08 + fieldMix * 0.08,
    0.42,
    0.72
  )
  const accentBlend = THREE.MathUtils.clamp(fieldMix * 0.12 + breathe * 0.04, 0, 0.18)

  return { accentBlend, hue, lightness, saturation }
}
