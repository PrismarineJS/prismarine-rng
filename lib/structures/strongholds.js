const Random = require('../Random')

class StrongholdProducer {
  constructor (biomeProvider) {
    this.biomeProvider = biomeProvider
  }

  getStrongholds () {
    const strongholds = []
    const rand = new Random(this.biomeProvider.worldSeed)

    let ring = this.getInitialRing()
    let structuresPerRing = 3
    let currentRingStructureCount = 0
    let angle = this.getInitialStartAngle(rand)
    for (let i = 0; i < this.getTotalStructureCount(); i++) {
      const distance = this.getNextDistance(ring, rand)
      const x = this.getX(angle, distance)
      const z = this.getZ(angle, distance)
      strongholds.push(this.getStrongholdLocation(x, z, rand))

      angle += this.getAngleDelta(ring, structuresPerRing)
      currentRingStructureCount++
      if (currentRingStructureCount === structuresPerRing) {
        ring = this.getNextRing(ring)
        currentRingStructureCount = this.getNextRingStructureCount(currentRingStructureCount)
        structuresPerRing = this.getNextStructuresPerRing(
          structuresPerRing,
          ring,
          this.getTotalStructureCount() - i,
          rand)
        angle = this.getNextStartAngle(angle, rand)
      }
    }

    return strongholds
  }

  getValidBiomes () {
    const biomes = this.biomeProvider.mcData.biomesArray
    const biomesByName = this.biomeProvider.mcData.biomesByName
    const all = []
    for (const b of biomes) {
      if ((b.depth > 0 && b.id !== biomesByName.bamboo_jungle.id && b.id !== biomesByName.bamboo_jungle_hills.id) || b.id === biomesByName.mushroom_field_shore.id) {
        all.push(b.id)
      }
    }
    return all
  }

  getStrongholdLocation (x, z, rand) {
    const coords = this.biomeProvider.findValidLocation(x, z, 112, this.getValidBiomes(), rand)
    if (coords) return coords
    return { x: x * 16, z: z * 16 }
  }

  getNextDistance (curRing, rand) {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return (1.25 * curRing + rand.nextDouble()) * (32 * curRing)
    return (4 * 32) + (6 * curRing * 32) + (rand.nextDouble() - 0.5) * (32 * 2.5)
  }

  getTotalStructureCount () {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return 3
    return 128
  }

  getInitialRing () {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return 1
    return 0
  }

  getNextRing (ring) {
    return ring + 1
  }

  getInitialStartAngle (rand) {
    return rand.nextDouble() * 3.141592653589793 * 2.0
  }

  getNextStartAngle (currentValue, rand) {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return currentValue
    return currentValue + this.getInitialStartAngle(rand)
  }

  getAngleDelta (currentRing, structuresPerRing) {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return 6.283185307179586 * currentRing / structuresPerRing
    return 6.283185307179586 / structuresPerRing
  }

  getNextRingStructureCount (currentValue) {
    return 0
  }

  getNextStructuresPerRing (curValue, ring, remaining, rand) {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return curValue + curValue + rand.nextInt(curValue)
    return Math.min(curValue + 2 * curValue / (ring + 1), remaining)
  }

  getX (angle, radius) {
    return Math.round(Math.cos(angle) * radius)
  }

  getZ (angle, radius) {
    return Math.round(Math.sin(angle) * radius)
  }
}

module.exports = StrongholdProducer
