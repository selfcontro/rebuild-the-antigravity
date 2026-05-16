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
  const anchorDx = baseX
  const anchorDy = baseY
  const anchorDistance = Math.hypot(anchorDx, anchorDy)
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
  const wavePhase = currentT * (1.36 + waveSpeed * 1.58) - waveFront * 5.2 + phaseOffset
  const carrierPhase = currentT * 0.38 + alongFlow * 0.045 + phaseOffset
  const bandEnvelope = Math.exp(-Math.pow(anchorDistance / Math.max(influenceRadius * 0.92, 0.001), 2))
  const ringBandMix = THREE.MathUtils.clamp(activation * 0.68 + bandEnvelope * 0.32, 0, 1)
  const flowSpeed = 0.0024 + depthFactor * 0.0004 + fieldStrength * 0.00008
  const flowPulse = 0.88 + 0.12 * Math.sin(carrierPhase)
  const crossDrift = Math.sin(currentT * 0.27 + alongFlow * 0.028 + phaseOffset) * 0.00085
  const baseFlowX = dirX * flowSpeed * flowPulse + normalX * crossDrift
  const baseFlowY = dirY * flowSpeed * flowPulse + normalY * crossDrift
  const baseFlowZ =
    Math.sin(currentT * 0.42 + baseX * 0.012 + baseY * 0.01) * 0.012 * depthFactor

  let desiredX = baseX
  let desiredY = baseY
  let waveEnvelope = 0
  let waveDisplacement = 0

  if (activation > 0.001 && anchorDistance > 0.0001) {
    const nx = anchorDx / anchorDistance
    const ny = anchorDy / anchorDistance
    const breathingSignal = Math.sin(wavePhase)
    const crest = Math.max(0, breathingSignal)
    const trough = Math.max(0, -breathingSignal)
    const shellMix =
      THREE.MathUtils.smoothstep(radialNorm, 0.1, 0.2) *
      (1 - THREE.MathUtils.smoothstep(radialNorm, 0.58, 0.84))
    waveEnvelope = activation * Math.exp(-waveFront * 0.44) * (0.58 + shellMix * 0.42)
    const outwardOffset = crest * (0.034 + waveEnvelope * 0.13)
    const inwardOffset = trough * (0.038 + waveEnvelope * 0.145)
    const bandLimit = influenceRadius * 0.022
    waveDisplacement = THREE.MathUtils.clamp(
      (outwardOffset - inwardOffset) * waveAmplitude * shellMix,
      -bandLimit,
      bandLimit
    )
    desiredX += nx * waveDisplacement
    desiredY += ny * waveDisplacement
  }

  const restoreX = (desiredX - currentX) * (0.018 + activation * 0.034)
  const restoreY = (desiredY - currentY) * (0.018 + activation * 0.034)
  const restoreZ = baseZ * depthFactor - currentZ

  let accelX = baseFlowX + restoreX
  let accelY = baseFlowY + restoreY
  let accelZ = baseFlowZ + restoreZ * (0.01 + activation * 0.012)

  if (activation > 0.001 && distance > 0.0001) {
    const nx = anchorDx / Math.max(anchorDistance, 0.0001)
    const ny = anchorDy / Math.max(anchorDistance, 0.0001)
    const directionalLift = dirX * waveDisplacement * 0.011 + normalX * waveDisplacement * 0.0045
    const directionalLiftY = dirY * waveDisplacement * 0.011 + normalY * waveDisplacement * 0.0045
    const anisotropy = 0.72 + 0.28 * Math.max(0, dirX * nx + dirY * ny)
    const cursorDrag = (0.0004 + activation * 0.0014) * (0.76 + 0.24 * Math.sin(carrierPhase))

    accelX += nx * waveDisplacement * 0.07 * anisotropy + directionalLift + targetVelocityX * cursorDrag
    accelY += ny * waveDisplacement * 0.07 * anisotropy + directionalLiftY + targetVelocityY * cursorDrag
  }

  const accelMagnitude = Math.hypot(accelX, accelY, accelZ)
  const maxAccel = 0.062 + activation * 0.15 + waveAmplitude * 0.01
  if (accelMagnitude > maxAccel) {
    const accelScale = maxAccel / accelMagnitude
    accelX *= accelScale
    accelY *= accelScale
    accelZ *= accelScale
  }

  let nextVelocityX = velocityX + accelX * step
  let nextVelocityY = velocityY + accelY * step
  let nextVelocityZ = velocityZ + accelZ * step

  const damping = Math.pow(0.94 + radialNorm * 0.03, step)
  const zDamping = Math.pow(0.955 + radialNorm * 0.02, step)
  nextVelocityX *= damping
  nextVelocityY *= damping
  nextVelocityZ *= zDamping

  const planarSpeed = Math.hypot(nextVelocityX, nextVelocityY)
  const maxPlanarSpeed = 0.026 + activation * (0.075 + fieldStrength * 0.001) + Math.abs(randomRadiusOffset) * 0.0045
  if (planarSpeed > maxPlanarSpeed) {
    const speedScale = maxPlanarSpeed / planarSpeed
    nextVelocityX *= speedScale
    nextVelocityY *= speedScale
  }

  const maxDepthSpeed = 0.024 + activation * 0.036
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
    anchorX: baseX,
    anchorY: baseY,
    velocityX: nextVelocityX,
    velocityY: nextVelocityY,
    velocityZ: nextVelocityZ,
    waveDisplacement,
    waveEnvelope,
    wavePhase,
    ringBandMix,
  }
}

function particlePhase(randomRadiusOffset: number) {
  return randomRadiusOffset * Math.PI * 1.618
}
