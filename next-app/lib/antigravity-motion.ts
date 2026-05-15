import * as THREE from "three"

type VirtualPointerInput = {
  currentX: number
  currentY: number
  currentVX: number
  currentVY: number
  destinationX: number
  destinationY: number
  deltaSeconds: number
}

export type VirtualPointerState = {
  x: number
  y: number
  vx: number
  vy: number
}

export type ParticleMotionInput = {
  currentT: number
  currentX: number
  currentY: number
  currentZ: number
  velocityX: number
  velocityY: number
  velocityZ: number
  deltaSeconds: number
  depthFactor: number
  fieldStrength: number
  globalRotation: number
  magnetRadius: number
  randomRadiusOffset: number
  ringRadius: number
  targetX: number
  targetY: number
  targetVelocityX: number
  targetVelocityY: number
  waveAmplitude: number
  waveSpeed: number
  baseX: number
  baseY: number
  baseZ: number
}

export function stepVirtualPointer({
  currentX,
  currentY,
  currentVX,
  currentVY,
  destinationX,
  destinationY,
  deltaSeconds,
}: VirtualPointerInput) {
  const step = Math.min(Math.max(deltaSeconds * 60, 0.35), 2.4)
  const spring = 0.18
  const damping = Math.pow(0.68, step)

  let nextVX = currentVX + (destinationX - currentX) * spring * step
  let nextVY = currentVY + (destinationY - currentY) * spring * step
  nextVX *= damping
  nextVY *= damping

  return {
    x: currentX + nextVX * step,
    y: currentY + nextVY * step,
    vx: nextVX,
    vy: nextVY,
  }
}

export function stepParticleMotion({
  currentT,
  currentX,
  currentY,
  currentZ,
  velocityX,
  velocityY,
  velocityZ,
  deltaSeconds,
  depthFactor,
  fieldStrength,
  globalRotation,
  magnetRadius,
  randomRadiusOffset,
  ringRadius,
  targetX,
  targetY,
  targetVelocityX,
  targetVelocityY,
  waveAmplitude,
  waveSpeed,
  baseX,
  baseY,
  baseZ,
}: ParticleMotionInput) {
  const step = Math.min(Math.max(deltaSeconds * 60, 0.5), 2.1)
  const projectionFactor = 1 - currentZ / 50
  const projectedTargetX = targetX * projectionFactor
  const projectedTargetY = targetY * projectionFactor

  const cursorDx = currentX - projectedTargetX
  const cursorDy = currentY - projectedTargetY
  const distance = Math.hypot(cursorDx, cursorDy)
  const influenceRadius = magnetRadius * 1.75 + ringRadius * 0.22
  const radialNorm = THREE.MathUtils.clamp(distance / Math.max(influenceRadius, 0.001), 0, 1)
  const fieldMix = 1 - radialNorm
  const activation = THREE.MathUtils.smoothstep(fieldMix, 0.03, 0.96)
  const anchorDx = baseX - projectedTargetX
  const anchorDy = baseY - projectedTargetY
  const phaseOffset = particlePhase(randomRadiusOffset)
  const flowAngle = -0.72 + globalRotation * 0.08
  const dirX = Math.cos(flowAngle)
  const dirY = Math.sin(flowAngle)
  const normalX = -dirY
  const normalY = dirX
  const alongFlow = anchorDx * dirX + anchorDy * dirY
  const acrossFlow = anchorDx * normalX + anchorDy * normalY
  const ellipticalDistance = Math.hypot(alongFlow * 0.68, acrossFlow * 1.18)
  const waveFront = ellipticalDistance / Math.max(magnetRadius * 0.72, 0.001)
  const wavePhase = currentT * (0.82 + waveSpeed * 0.9) - waveFront * 5.4 + phaseOffset
  const carrierPhase = currentT * 0.38 + alongFlow * 0.045 + phaseOffset

  const restoreX = (baseX - currentX) * (0.008 + activation * 0.018)
  const restoreY = (baseY - currentY) * (0.008 + activation * 0.018)
  const restoreZ = baseZ * depthFactor - currentZ

  const anchorDistance = Math.hypot(anchorDx, anchorDy)
  const ringBandCenter = Math.max(ringRadius * 1.12, 0.001)
  const ringBandNorm = Math.min(1, Math.abs(anchorDistance - ringBandCenter) / Math.max(magnetRadius * 0.85, 0.001))
  const ringBandMix = 1 - ringBandNorm
  const flowSpeed = 0.0024 + depthFactor * 0.00045 + fieldStrength * 0.00008
  const flowPulse = 0.88 + 0.12 * Math.sin(carrierPhase)
  const crossDrift = Math.sin(currentT * 0.27 + alongFlow * 0.028 + phaseOffset) * 0.0009
  const baseFlowX = dirX * flowSpeed * flowPulse + normalX * crossDrift
  const baseFlowY = dirY * flowSpeed * flowPulse + normalY * crossDrift
  const baseFlowZ =
    Math.sin(currentT * 0.42 + baseX * 0.012 + baseY * 0.01) * 0.012 * depthFactor

  const ringHoldStrength = 0.018 + ringBandMix * 0.05 + activation * 0.014
  const ringTargetDistance = anchorDistance - ringBandCenter
  const ringHoldX = anchorDistance > 0.0001 ? (-anchorDx / anchorDistance) * ringTargetDistance * ringHoldStrength : 0
  const ringHoldY = anchorDistance > 0.0001 ? (-anchorDy / anchorDistance) * ringTargetDistance * ringHoldStrength : 0

  let accelX = baseFlowX + restoreX + ringHoldX
  let accelY = baseFlowY + restoreY + ringHoldY
  let accelZ = baseFlowZ + restoreZ * (0.01 + activation * 0.012)

  if (activation > 0.001 && distance > 0.0001) {
    const nx = anchorDx / Math.max(Math.hypot(anchorDx, anchorDy), 0.0001)
    const ny = anchorDy / Math.max(Math.hypot(anchorDx, anchorDy), 0.0001)
    const waveEnvelope = activation * Math.exp(-waveFront * 0.52)
    const radialWave = Math.sin(wavePhase) * waveAmplitude * (0.0014 + waveEnvelope * 0.0048) * (0.8 + ringBandMix * 0.2)
    const inwardReturn = -Math.cos(wavePhase * 0.7 + 0.6) * (0.0008 + waveEnvelope * 0.0022)
    const directionalLift = dirX * radialWave * 0.05 + normalX * radialWave * 0.018
    const directionalLiftY = dirY * radialWave * 0.05 + normalY * radialWave * 0.018
    const anisotropy = 0.62 + 0.38 * Math.max(0, dirX * nx + dirY * ny)
    const cursorDrag = (0.00035 + activation * 0.0014) * (0.75 + 0.25 * Math.sin(carrierPhase))

    accelX += nx * (radialWave + inwardReturn) * anisotropy + directionalLift + targetVelocityX * cursorDrag
    accelY += ny * (radialWave + inwardReturn) * anisotropy + directionalLiftY + targetVelocityY * cursorDrag
  }

  const accelMagnitude = Math.hypot(accelX, accelY, accelZ)
  const maxAccel = 0.06 + activation * 0.14 + waveAmplitude * 0.01
  if (accelMagnitude > maxAccel) {
    const accelScale = maxAccel / accelMagnitude
    accelX *= accelScale
    accelY *= accelScale
    accelZ *= accelScale
  }

  let nextVelocityX = velocityX + accelX * step
  let nextVelocityY = velocityY + accelY * step
  let nextVelocityZ = velocityZ + accelZ * step

  const damping = Math.pow(0.92 + radialNorm * 0.04, step)
  const zDamping = Math.pow(0.94 + radialNorm * 0.03, step)
  nextVelocityX *= damping
  nextVelocityY *= damping
  nextVelocityZ *= zDamping

  const planarSpeed = Math.hypot(nextVelocityX, nextVelocityY)
  const maxPlanarSpeed = 0.032 + activation * (0.09 + fieldStrength * 0.0016) + Math.abs(randomRadiusOffset) * 0.008
  if (planarSpeed > maxPlanarSpeed) {
    const speedScale = maxPlanarSpeed / planarSpeed
    nextVelocityX *= speedScale
    nextVelocityY *= speedScale
  }

  const maxDepthSpeed = 0.024 + activation * 0.035
  if (Math.abs(nextVelocityZ) > maxDepthSpeed) {
    nextVelocityZ = Math.sign(nextVelocityZ) * maxDepthSpeed
  }

  return {
    distance,
    fieldMix: activation,
    nextX: currentX + nextVelocityX * step,
    nextY: currentY + nextVelocityY * step,
    nextZ: currentZ + nextVelocityZ * step,
    projectedTargetX,
    projectedTargetY,
    velocityX: nextVelocityX,
    velocityY: nextVelocityY,
    velocityZ: nextVelocityZ,
  }
}

function particlePhase(randomRadiusOffset: number) {
  return randomRadiusOffset * Math.PI * 1.618
}
