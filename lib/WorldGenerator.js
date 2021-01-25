const createWorldGenModule = require('./wasm/WorldGen.js')
const StrongholdProducer = require('./structures/strongholds')

class OverworldWorldGenerator {
  constructor (mcData, worldSeed, Module) {
    this.mcData = mcData
    this.worldSeed = worldSeed

    const version = require('minecraft-data').versionsByMinecraftVersion.pc[mcData.version.minecraftVersion].dataVersion
    this.biomeProvider = new Module.OverworldBiomeProvider(version, hi(worldSeed), lo(worldSeed))

    this.strongholds = null
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
          validLocations++
        }
      }
    }
    return result
  }

  getStrongholds () {
    if (!this.strongholds) {
      this.strongholds = new StrongholdProducer(this).getStrongholds()
    }
    return this.strongholds
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
  const Module = await createWorldGenModule()
  if (dimension === 'overworld') return new OverworldWorldGenerator(mcData, worldSeed, Module)
  throw new Error('Unimplemented dimension: ' + dimension)
}

module.exports = { createWorldGenerator }
