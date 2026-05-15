import type { VirtualPointerState } from "@/lib/antigravity-motion"

type InteractionInput = {
  autoAnimate: boolean
  lastMouseMoveTime: number
  pointerX: number
  pointerY: number
  time: number
  viewportHeight: number
  viewportWidth: number
}

export type InteractionTarget = {
  destinationX: number
  destinationY: number
}

export function getInteractionTarget({
  autoAnimate,
  lastMouseMoveTime,
  pointerX,
  pointerY,
  time,
  viewportHeight,
  viewportWidth,
}: InteractionInput): InteractionTarget {
  let destinationX = (pointerX * viewportWidth) / 2
  let destinationY = (pointerY * viewportHeight) / 2

  if (autoAnimate && Date.now() - lastMouseMoveTime > 2000) {
    destinationX = Math.sin(time * 0.5) * (viewportWidth / 4)
    destinationY = Math.cos(time) * (viewportHeight / 4)
  }

  return { destinationX, destinationY }
}

export function createVirtualPointerState(): VirtualPointerState {
  return { x: 0, y: 0, vx: 0, vy: 0 }
}
