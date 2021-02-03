const Random = require('../Random')
class RegionalProducer {
  constructor (worldGen, config) {
    this.worldGen = worldGen
    this.config = config
    this.salt = BigInt(this.config.salt)
    this.validBiomes = this.config.validBiomes.map(x => worldGen.mcData.biomesByName[x].id)
  }

  getStructures (x0, z0, x1, z1) {
    const structures = []
    const { resolution, offsetInWorld } = this.config
    for (let z = z0; z <= z1 + this.config.spacing; z += this.config.spacing) {
      for (let x = x0; x <= x1 + this.config.spacing; x += this.config.spacing) {
        const { rx, rz } = this.getPossibleLocation(x, z)
        if (rx < x0 || rz < z0 || rx > x1 || rz > z1) continue
        const biome = this.worldGen.biomeForStructure(rx, rz)
        if (this.validBiomes.includes(biome)) {
          structures.push({ x: rx * resolution + offsetInWorld, z: rz * resolution + offsetInWorld })
        }
      }
    }
    return structures
  }

  getStructureCoordInRegion (rand, value) {
    const { spacing, triangular, separation } = this.config
    let result = value * spacing
    if (triangular) {
      result += Math.floor((rand.nextInt(spacing - separation) + rand.nextInt(spacing - separation)) / 2)
    } else {
      result += rand.nextInt(spacing - separation)
    }
    return result
  }

  getModifiedCoord (value) {
    if (value < 0) {
      if (this.config.buggyCoordinates) return value - this.config.spacing - 1
      return value - this.config.spacing + 1
    }
    return value
  }

  getPossibleLocation (chunkX, chunkZ) {
    let rx = Math.trunc(this.getModifiedCoord(chunkX) / this.config.spacing)
    let rz = Math.trunc(this.getModifiedCoord(chunkZ) / this.config.spacing)
    const rand = new Random(this.worldGen.getRegionSeed(rx, rz, this.salt))
    rx = this.getStructureCoordInRegion(rand, rx)
    rz = this.getStructureCoordInRegion(rand, rz)
    return { rx, rz }
  }
}

module.exports = RegionalProducer
