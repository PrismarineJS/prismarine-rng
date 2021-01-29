const Random = require('../Random')

class StrongholdProducer {
  constructor (biomeProvider) {
    this.biomeProvider = biomeProvider

    const biomes = this.biomeProvider.mcData.biomesArray
    const biomesByName = this.biomeProvider.mcData.biomesByName
    this.validBiomes = []
    const bambooJungleId = biomesByName.bamboo_jungle ? biomesByName.bamboo_jungle.id : -1
    const bambooJungleHillsId = biomesByName.bamboo_jungle_hills ? biomesByName.bamboo_jungle_hills.id : -1
    const mushroomFieldShoreId = biomesByName.mushroom_field_shore ? biomesByName.mushroom_field_shore.id : -1
    for (const b of biomes) {
      if ((b.depth > 0 && b.id !== bambooJungleId && b.id !== bambooJungleHillsId) || b.id === mushroomFieldShoreId) {
        this.validBiomes.push(b.id)
      }
    }
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
      strongholds.push(this.getStairLocation(this.getStrongholdLocation(x, z, rand)))

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

  getStairLocation (coords) {
    // Center of the first room
    coords.x = (coords.x & ~0xf) + 4
    coords.z = (coords.z & ~0xf) + 4
    return coords
  }

  getStrongholdLocation (x, z, rand) {
    const coords = this.biomeProvider.findValidLocation(x, z, 112, this.validBiomes, rand)
    if (coords) return coords
    return { x: x * 16, z: z * 16 }
  }

  getNextDistance (curRing, rand) {
    if (this.biomeProvider.mcData.isOlderThan('1.9')) return (1.25 * curRing + rand.nextDouble()) * (32 * curRing)
    return 128 + (6 * curRing * 32) + (rand.nextDouble() - 0.5) * (32 * 2.5)
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
