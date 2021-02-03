const createWorldGenModule = require('./wasm/WorldGen.js')
const StrongholdProducer = require('./structures/strongholds')
const Random = require('./Random')
const RegionalProducer = require('./structures/regional.js')

class OverworldWorldGenerator {
  constructor (mcData, worldSeed, Module) {
    this.mcData = mcData
    this.worldSeed = worldSeed

    const version = require('minecraft-data').versionsByMinecraftVersion.pc[mcData.version.minecraftVersion].dataVersion
    this.biomeProvider = new Module.OverworldBiomeProvider(version, hi(worldSeed), lo(worldSeed))

    this.strongholds = null

    if (this.mcData.isOlderThan('1.13')) {
      this.biomeForStructure = (x, z) => this.biomeProvider.scaledBiomeAt(10, 16 * x + 8, 16 * z + 8)
    } else if (this.mcData.isOlderThan('1.16')) {
      this.biomeForStructure = (x, z) => this.biomeProvider.scaledBiomeAt(10, 16 * x + 9, 16 * z + 9)
    } else {
      this.biomeForStructure = (x, z) => this.biomeProvider.biomeAt(2 + (x << 2), 2 + (z << 2))
    }

    this.structureProvider = {}
    for (const structure of require('./structures/config')(mcData)) {
      if (structure.dimension !== 'overworld') continue
      if (structure.minVersion && !mcData.isNewerOrEqualTo(structure.minVersion)) continue
      this.structureProvider[structure.name] = new RegionalProducer(this, structure)
    }
  }

  scaledBiomeAt (scale, x, z) {
    return this.biomeProvider.scaledBiomeAt(scale, x, z)
  }

  biomeAt (x, z) {
    return this.biomeProvider.biomeAt(x, z)
  }

  findValidLocation (cx, cz, size, validBiomes, rand) {
    const x0 = (cx * 16 + 8) - size >> 2
    const z0 = (cz * 16 + 8) - size >> 2
    const x1 = (cx * 16 + 8) + size >> 2
    const z1 = (cz * 16 + 8) + size >> 2

    let result = null
    let validLocations = 0
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const biome = this.biomeProvider.biomeAt(x, z)
        if (validBiomes.includes(biome)) {
          const updateResult = !result || rand.nextInt(validLocations + 1) === 0
          if (updateResult) {
            result = { x: x * 4, z: z * 4 }
          }
          if (updateResult || this.mcData.isNewerOrEqualTo('1.13')) {
            validLocations++
          }
        }
      }
    }
    return result
  }

  getKnownStructures () {
    return [...Object.keys(this.structureProvider), 'stronghold', 'buried_treasure']
  }

  getStructures (x0, z0, x1, z1, structureType) {
    if (this.structureProvider[structureType]) {
      return this.structureProvider[structureType].getStructures(x0, z0, x1, z1)
    } else if (structureType === 'stronghold') {
      return this.getStrongholds().filter(({ x, z }) => x >= x0 && z >= z0 && x <= x1 && z <= z1)
    } else if (structureType === 'buried_treasure') {
      return this.getTreasuresInArea(x0, z0, x1, z1)
    }
    return []
  }

  getStrongholds () {
    if (!this.strongholds) {
      this.strongholds = new StrongholdProducer(this).getStrongholds()
    }
    return this.strongholds
  }

  getTreasuresInArea (x0, z0, x1, z1) {
    if (this.mcData.isOlderThan('1.13')) return []
    const validBiomes = [this.mcData.biomesByName.beach.id, this.mcData.biomesByName.snowy_beach.id]
    const treasures = []
    for (let z = z0; z <= z1; z++) {
      for (let x = x0; x <= x1; x++) {
        const rand = new Random(this.getRegionSeed(x, z, 10387320n))
        if (rand.nextFloat() < 0.01) {
          const biome = this.biomeForStructure(x, z)
          if (validBiomes.includes(biome)) {
            treasures.push({ x: x * 16 + 8, z: z * 16 + 8 })
          }
        }
      }
    }
    return treasures
  }

  getRegionSeed (regionX, regionZ, salt) {
    return BigInt(regionX) * 341873128712n +
         BigInt(regionZ) * 132897987541n +
         this.worldSeed +
         salt
  }

  delete () {
    this.biomeProvider.delete()
  }
}

function hi (x) {
  return Number(BigInt.asIntN(32, x >> 32n))
}

function lo (x) {
  return Number(BigInt.asIntN(32, x))
}

async function createWorldGenerator (mcData, worldSeed, dimension = 'overworld') {
  const Module = await createWorldGenModule({
    locateFile: function (name, path) {
      if (typeof process === 'object') return path + name
      return './' + name
    }
  })
  if (dimension === 'overworld') return new OverworldWorldGenerator(mcData, worldSeed, Module)
  throw new Error('Unimplemented dimension: ' + dimension)
}

module.exports = { createWorldGenerator }
