const LCG = require('../LCG')

class BiomeLayer {
  constructor (mcData, worldSeed, salt, parent = null) {
    this.layerSeed = layerSeed(worldSeed, salt)
    this.localSeed = 0n
    this.mcData = mcData
    this.biomes = mcData.biomesByName
    this.parent = parent
    this.cache = new Map()
  }

  isShallowOcean (id) {
    return id === this.biomes.warm_ocean.id || id === this.biomes.lukewarm_ocean.id || id === this.biomes.ocean.id ||
        id === this.biomes.cold_ocean.id || id === this.biomes.frozen_ocean.id
  }

  isOcean (id) {
    return id === this.biomes.warm_ocean.id || id === this.biomes.lukewarm_ocean.id || id === this.biomes.ocean.id ||
            id === this.biomes.cold_ocean.id || id === this.biomes.frozen_ocean.id ||
            id === this.biomes.deep_warm_ocean.id || id === this.biomes.deep_lukewarm_ocean.id ||
            id === this.biomes.deep_ocean.id || id === this.biomes.deep_cold_ocean.id ||
            id === this.biomes.deep_frozen_ocean.id
  }

  isRiver (id) {
    return id === this.biomes.river.id || id === this.biomes.frozen_river.id
  }

  areSimilar (id1, id2) {
    const b2 = this.mcData.biomes[id2]
    if (!b2) return false

    if (id1 === id2) return true

    const b1 = this.mcData.biomes[id1]
    if (!b1) return false

    if (id1 !== this.biomes.wooded_badlands_plateau.id && id1 !== this.biomes.badlands_plateau.id) {
      if (b1.category !== 'none' && b2.category !== 'none' && b1.category === b2.category) {
        return true
      }
      return b1 === b2
    }

    return id2 === this.biomes.wooded_badlands_plateau.id || id2 === this.biomes.badlands_plateau.id
  }

  getTemperatureGroup (biome) {
    if (biome.category === 'ocean') {
      return 'ocean'
    } else if (biome.temperature < 0.2) {
      return 'cold'
    } else if (biome.temperature < 1.0) {
      return 'medium'
    }
    return 'warm'
  }

  get (x, y, z) {
    const hash = `${x},${z}`
    if (!this.cache.has(hash)) this.cache.set(hash, this.sample(x, y, z))
    return this.cache.get(hash)
  }

  sample (x, y, z) {
    throw new Error('override')
  }

  setSeed (x, z) {
    this.localSeed = mixSeed(this.layerSeed, BigInt(x))
    this.localSeed = mixSeed(this.localSeed, BigInt(z))
    this.localSeed = mixSeed(this.localSeed, BigInt(x))
    this.localSeed = mixSeed(this.localSeed, BigInt(z))
  }

  nextInt (bound) {
    const i = Number(BigInt.asIntN(32, floorMod(this.localSeed >> 24n, BigInt(bound))))
    this.localSeed = mixSeed(this.localSeed, this.layerSeed)
    return i
  }

  choose2 (a, b) {
    return this.nextInt(2) === 0 ? a : b
  }

  choose4 (a, b, c, d) {
    return [a, b, c, d][this.nextInt(4)]
  }
}

function floorMod (x, y) {
  let mod = ((x % y) + y) % y
  if ((mod ^ y) < 0n && mod !== 0n) {
    mod += y
  }
  return mod
}

function mixSeed (seed, salt) {
  seed *= seed * LCG.MMIX.multiplier + LCG.MMIX.addend
  seed += salt
  return BigInt.asIntN(64, seed)
}

function layerSeed (worldSeed, salt) {
  let midsalt = mixSeed(salt, salt)
  midsalt = mixSeed(midsalt, salt)
  midsalt = mixSeed(midsalt, salt)
  let layerSeed = mixSeed(worldSeed, midsalt)
  layerSeed = mixSeed(layerSeed, midsalt)
  layerSeed = mixSeed(layerSeed, midsalt)
  return layerSeed
}

module.exports = BiomeLayer
