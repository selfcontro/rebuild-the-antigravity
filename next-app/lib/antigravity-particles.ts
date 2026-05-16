export type ParticleRecord = {
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
  scale: number
  scaleVelocity: number
  randomRadiusOffset: number
  colorSeed: number
}

function seededUnit(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453123
  return value - Math.floor(value)
}

type CreateParticlesInput = {
  count: number
  width: number
  height: number
}

export function createParticles({ count, width, height }: CreateParticlesInput): ParticleRecord[] {
  const records: ParticleRecord[] = []
  const positions: Array<{ x: number; y: number }> = []
  const rowCount = Math.max(6, Math.round(Math.sqrt((count * height) / Math.max(width, 1))))
  const rowStep = height / (rowCount + 1)
  const baseColCount = Math.max(6, Math.round(count / rowCount))
  const colStep = width / (baseColCount + 1)
  const evenCount = baseColCount
  const oddCount = Math.max(1, baseColCount - 1)
  const evenStartX = -((evenCount - 1) * colStep) / 2
  const oddStartX = evenStartX + colStep / 2
  const rowPattern = Array.from({ length: rowCount }, (_, rowIndex) => (rowIndex % 2 === 0 ? evenCount : oddCount))
  let totalSlots = rowPattern.reduce((sum, value) => sum + value, 0)

  while (totalSlots > count) {
    for (let rowIndex = rowPattern.length - 1; rowIndex >= 0 && totalSlots > count; rowIndex -= 1) {
      const minimum = rowIndex % 2 === 0 ? Math.max(2, evenCount - 2) : Math.max(2, oddCount - 2)
      if (rowPattern[rowIndex] > minimum) {
        rowPattern[rowIndex] -= 1
        totalSlots -= 1
      }
    }
  }

  while (totalSlots < count) {
    for (let rowIndex = 0; rowIndex < rowPattern.length && totalSlots < count; rowIndex += 1) {
      const maximum = rowIndex % 2 === 0 ? evenCount : oddCount
      if (rowPattern[rowIndex] < maximum) {
        rowPattern[rowIndex] += 1
        totalSlots += 1
      }
    }
    if (rowPattern.every((value, rowIndex) => value >= (rowIndex % 2 === 0 ? evenCount : oddCount))) break
  }

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const y = height / 2 - (rowIndex + 1) * rowStep
    const isEvenRow = rowIndex % 2 === 0
    const pointsInRow = rowPattern[rowIndex]
    const startX = isEvenRow ? evenStartX : oddStartX

    for (let colIndex = 0; colIndex < pointsInRow && positions.length < count; colIndex += 1) {
      const x = startX + colIndex * colStep
      positions.push({
        x,
        y,
      })
    }
  }

  for (let index = 0; index < count; index += 1) {
    const t = seededUnit(index, 1) * 100
    const speed = 0.01 + seededUnit(index, 2) / 200
    const position = positions[index] ?? positions[positions.length - 1] ?? { x: 0, y: 0 }
    const x = position.x
    const y = position.y
    const z = (seededUnit(index, 5) - 0.5) * 12

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
      scale: 0,
      scaleVelocity: 0,
      randomRadiusOffset: (seededUnit(index, 6) - 0.5) * 2,
      colorSeed: seededUnit(index, 7),
    })
  }

  return records
}
