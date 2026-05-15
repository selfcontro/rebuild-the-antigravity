import * as THREE from "three"

type DeformationInput = {
  currentDistanceToMouse: number
  fieldMix: number
  particleSize: number
  particleVariance: number
  pulseSpeed: number
  currentT: number
  ringRadius: number
  velocityLookahead?: number
  velocityX: number
  velocityY: number
  velocityZ: number
  x: number
  y: number
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
  particleSize,
  particleVariance,
  pulseSpeed,
  currentT,
  ringRadius,
  velocityLookahead = 8,
  velocityX,
  velocityY,
  velocityZ,
  x,
  y,
  z,
}: DeformationInput): ParticleDeformation {
  const distanceFromRing = Math.abs(currentDistanceToMouse - ringRadius)
  const normalizedScale = THREE.MathUtils.clamp(1 - distanceFromRing / 10, 0, 1)
  const pulse = 0.78 + Math.sin(currentT * pulseSpeed) * 0.18 * particleVariance + fieldMix * 0.08
  const finalScale = normalizedScale * pulse * particleSize

  return {
    lookAtX: x + velocityX * velocityLookahead,
    lookAtY: y + velocityY * velocityLookahead,
    lookAtZ: z + velocityZ * velocityLookahead * 0.5,
    scaleX: finalScale,
    scaleY: finalScale,
    scaleZ: finalScale,
  }
}
