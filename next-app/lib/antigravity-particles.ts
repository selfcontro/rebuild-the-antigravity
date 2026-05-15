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
}
