const BiomeLayer = require('./BiomeLayer')
const PerlinNoiseSampler = require('../noise/perlin')
const Random = require('../Random')

class ContinentLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    if (x === 0 && z === 0) return this.biomes.plains.id
    return this.nextInt(10) === 0 ? this.biomes.plains.id : this.biomes.ocean.id
  }
}

class ScaleLayer extends BiomeLayer {
  static FUZZY = 1
  static NORMAL = 0
  constructor (mcData, worldSeed, salt, type, parent = null) {
    super(mcData, worldSeed, salt, parent)
    this.type = type
  }

  sample (x, y, z) {
    const i = this.parent.get(x >> 1, y, z >> 1)
    this.setSeed(x & -2, z & -2)
    const xb = x & 1; const zb = z & 1

    if (xb === 0 && zb === 0) return i

    const l = this.parent.get(x >> 1, y, (z + 1) >> 1)
    const m = this.choose2(i, l)

    if (xb === 0) return m

    const n = this.parent.get((x + 1) >> 1, y, z >> 1)
    const o = this.choose2(i, n)

    if (zb === 0) return o

    const p = this.parent.get((x + 1) >> 1, y, (z + 1) >> 1)
    return this.xsample(i, n, l, p)
  }

  xsample (center, e, s, se) {
    const ret = this.choose4(center, e, s, se)

    if (this.type === ScaleLayer.FUZZY) return ret

    if (e === s && e === se) return e
    if (center === e && (center === se || s !== se)) return center
    if (center === s && (center === se || e !== se)) return center
    if (center === se && e !== s) return center
    if (e === s && center !== se) return e
    if (e === se && center !== s) return e
    if (s === se && center !== e) return s
    return ret
  }
}

class CrossLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    return this.xsample(this.parent.get(x, y, z - 1),
      this.parent.get(x + 1, y, z),
      this.parent.get(x, y, z + 1),
      this.parent.get(x - 1, y, z),
      this.parent.get(x, y, z))
  }

  xsample (n, e, s, w, center) {
    throw new Error('override')
  }
}

class XCrossLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    return this.xsample(this.parent.get(x - 1, y, z + 1),
      this.parent.get(x + 1, y, z + 1),
      this.parent.get(x + 1, y, z - 1),
      this.parent.get(x - 1, y, z - 1),
      this.parent.get(x, y, z))
  }

  xsample (sw, se, ne, nw, center) {
    throw new Error('override')
  }
}

class LandLayer extends XCrossLayer {
  xsample (sw, se, ne, nw, center) {
    const centerSO = this.isShallowOcean(center)
    const swSO = this.isShallowOcean(sw)
    const seSO = this.isShallowOcean(se)
    const neSO = this.isShallowOcean(ne)
    const nwSO = this.isShallowOcean(nw)
    if (!centerSO || (swSO && seSO && neSO && nwSO)) {
      if (centerSO || (!swSO && !seSO && !neSO && !nwSO) || this.nextInt(5) !== 0) return center
      if (nwSO) return center === this.biomes.forest.id ? this.biomes.forest.id : nw
      if (swSO) return center === this.biomes.forest.id ? this.biomes.forest.id : sw
      if (neSO) return center === this.biomes.forest.id ? this.biomes.forest.id : ne
      if (seSO) return center === this.biomes.forest.id ? this.biomes.forest.id : se
      return center
    }

    let i = 1
    let j = 1
    if (!nwSO && this.nextInt(i++) === 0) j = nw
    if (!neSO && this.nextInt(i++) === 0) j = ne
    if (!swSO && this.nextInt(i++) === 0) j = sw
    if (!seSO && this.nextInt(i) === 0) j = se

    if (this.nextInt(3) === 0) return j
    return j === this.biomes.forest.id ? this.biomes.forest.id : center
  }
}

class IslandLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    const centerSO = this.isShallowOcean(center)
    const nSO = this.isShallowOcean(n)
    const eSO = this.isShallowOcean(e)
    const sSO = this.isShallowOcean(s)
    const wSO = this.isShallowOcean(w)
    return (centerSO && nSO && eSO && sSO && wSO && this.nextInt(2) === 0) ? this.biomes.plains.id : center
  }
}

class ColdClimateLayer extends BiomeLayer {
  sample (x, y, z) {
    const value = this.parent.get(x, y, z)
    if (this.isShallowOcean(value)) return value
    this.setSeed(x, z)
    const i = this.nextInt(6)
    if (i === 0) return this.biomes.forest.id
    return i === 1 ? this.biomes.mountains.id : this.biomes.plains.id
  }
}

class TemperateClimateLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    return center !== this.biomes.plains.id || (n !== this.biomes.mountains.id && e !== this.biomes.mountains.id && w !== this.biomes.mountains.id && s !== this.biomes.mountains.id && n !== this.biomes.forest.id && e !== this.biomes.forest.id && w !== this.biomes.forest.id && s !== this.biomes.forest.id) ? center : this.biomes.desert.id
  }
}

class CoolClimateLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    return center !== this.biomes.forest.id || (n !== this.biomes.plains.id && e !== this.biomes.plains.id && w !== this.biomes.plains.id && s !== this.biomes.plains.id && n !== this.biomes.desert.id && e !== this.biomes.desert.id && w !== this.biomes.desert.id && s !== this.biomes.desert.id) ? center : this.biomes.mountains.id
  }
}

class SpecialClimateLayer extends BiomeLayer {
  sample (x, y, z) {
    let i = this.parent.get(x, y, z)

    if (this.isShallowOcean(i)) return i
    this.setSeed(x, z)

    if (this.nextInt(13) === 0) {
      i |= (1 + this.nextInt(15)) << 8
    }

    return i
  }
}

class MushroomLayer extends XCrossLayer {
  xsample (sw, se, ne, nw, center) {
    const centerSO = this.isShallowOcean(center)
    const swSO = this.isShallowOcean(sw)
    const seSO = this.isShallowOcean(se)
    const neSO = this.isShallowOcean(ne)
    const nwSO = this.isShallowOcean(nw)
    return centerSO && swSO && seSO && neSO && nwSO && this.nextInt(100) === 0 ? this.biomes.mushroom_fields.id : center
  }
}

class DeepOceanLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    if (!this.isShallowOcean(center)) return center

    let i = 0
    if (this.isShallowOcean(n)) i++
    if (this.isShallowOcean(e)) i++
    if (this.isShallowOcean(w)) i++
    if (this.isShallowOcean(s)) i++

    if (i > 3) {
      if (center === this.biomes.warm_ocean.id) return this.biomes.deep_warm_ocean.id
      if (center === this.biomes.lukewarm_ocean.id) return this.biomes.deep_lukewarm_ocean.id
      if (center === this.biomes.ocean.id) return this.biomes.deep_ocean.id
      if (center === this.biomes.cold_ocean.id) return this.biomes.deep_cold_ocean.id
      if (center === this.biomes.frozen_ocean.id) return this.biomes.deep_frozen_ocean.id
      return this.biomes.deep_ocean.id
    }

    return center
  }
}

class BaseBiomesLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    let center = this.parent.get(x, y, z)
    const specialBits = (center >> 8) & 15 // the nextInt(15) + 1 in ClimateLayer.Special
    center &= ~0xF00 // removes the 4 special bits and keeps everything else

    if (this.isOcean(center) || center === this.biomes.mushroom_fields.id) return center

    if (center === this.biomes.plains.id) {
      if (specialBits > 0) {
        return this.nextInt(3) === 0 ? this.biomes.badlands_plateau.id : this.biomes.wooded_badlands_plateau.id
      }
      const dryBiomes = [this.biomes.desert, this.biomes.desert, this.biomes.desert, this.biomes.savanna, this.biomes.savanna, this.biomes.plains]
      return dryBiomes[this.nextInt(dryBiomes.length)].id
    } else if (center === this.biomes.desert.id) {
      if (specialBits > 0) {
        return this.biomes.jungle.id
      }
      const temperateBiomes = [this.biomes.forest, this.biomes.dark_forest, this.biomes.mountains, this.biomes.plains, this.biomes.birch_forest, this.biomes.swamp]
      return temperateBiomes[this.nextInt(temperateBiomes.length)].id
    } else if (center === this.biomes.mountains.id) {
      if (specialBits > 0) {
        return this.biomes.giant_tree_taiga.id
      }
      const coolBiomes = [this.biomes.forest, this.biomes.mountains, this.biomes.taiga, this.biomes.plains]
      return coolBiomes[this.nextInt(coolBiomes.length)].id
    } else if (center === this.biomes.forest.id) {
      const snowyBiomes = [this.biomes.snowy_tundra, this.biomes.snowy_tundra, this.biomes.snowy_tundra, this.biomes.snowy_taiga]
      return snowyBiomes[this.nextInt(snowyBiomes.length)].id
    }

    return this.biomes.mushroom_fields.id
  }
}

class BambooJungleLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    const value = this.parent.get(x, y, z)
    return value === this.biomes.jungle.id && this.nextInt(10) === 0 ? this.biomes.bamboo_jungle.id : value
  }
}

class EaseEdgeLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    const is = [0]
    if (!this.replaceEdgeIfNeeded(is, n, e, s, w, center, this.biomes.mountains.id, this.biomes.mountain_edge.id) &&
         this.replaceEdge(is, n, e, s, w, center, this.biomes.wooded_badlands_plateau.id, this.biomes.badlands.id) &&
         this.replaceEdge(is, n, e, s, w, center, this.biomes.badlands_plateau.id, this.biomes.badlands.id) &&
         this.replaceEdge(is, n, e, s, w, center, this.biomes.giant_tree_taiga.id, this.biomes.taiga.id)) {
      if (center === this.biomes.desert.id && [n, e, w, s].some(x => x === this.biomes.snowy_tundra.id)) {
        return this.biomes.wooded_mountains.id
      } else {
        if (center === this.biomes.swamp.id) {
          if ([n, e, w, s].some(x => x === this.biomes.desert.id) || [n, e, w, s].some(x => x === this.biomes.snowy_tundra.id) || [n, e, w, s].some(x => x === this.biomes.snowy_taiga.id)) {
            return this.biomes.plains.id
          }

          if ([n, e, w, s].some(x => x === this.biomes.jungle.id) || [n, e, w, s].some(x => x === this.biomes.bamboo_jungle.id)) {
            return this.biomes.jungle_edge.id
          }
        }

        return center
      }
    }
    return is[0]
  }

  replaceEdgeIfNeeded (is, i, j, k, l, m, n, o) {
    if (!this.areSimilar(m, n)) return false

    if (this.canBeNeighbors(i, n) && this.canBeNeighbors(j, n) && this.canBeNeighbors(l, n) && this.canBeNeighbors(k, n)) {
      is[0] = m
    } else {
      is[0] = o
    }
    return true
  }

  replaceEdge (is, i, j, k, l, m, n, o) {
    if (m !== n) return true

    if (this.areSimilar(i, n) && this.areSimilar(j, n) && this.areSimilar(l, n) && this.areSimilar(k, n)) {
      is[0] = m
    } else {
      is[0] = o
    }
    return false
  }

  canBeNeighbors (id1, id2) {
    if (this.areSimilar(id1, id2)) return true

    const b1 = this.mcData.biomes[id1]
    const b2 = this.mcData.biomes[id2]

    if (b1 && b2) {
      const t1 = this.getTemperatureGroup(b1)
      const t2 = this.getTemperatureGroup(b2)
      return t1 === t2 || t1 === 'medium' || t2 === 'medium'
    }

    return false
  }
}

class NoiseLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    const i = this.parent.get(x, y, z)
    return this.isShallowOcean(i) ? i : this.nextInt(299999) + 2
  }
}

class HillsLayer extends BiomeLayer {
  constructor (mcData, worldSeed, salt, biomes, noise) {
    super(mcData, worldSeed, salt, biomes)
    this.noise = noise
  }

  sample (x, y, z) {
    this.setSeed(x, z)
    const i = this.parent.get(x, y, z) // biomes
    const j = this.noise.get(x, y, z) // noise (river)

    const k = (((j - 2) % 29) + 29) % 29

    if (!this.isShallowOcean(i) && j >= 2 && k === 1) {
      const biome = this.mcData.biomes[i]
      if (!biome || !biome.parent) {
        const biome3 = !biome ? null : biome.child
        return !biome3 ? i : biome3
      }
    }

    if (this.nextInt(3) === 0 || k === 0) {
      let l = i
      if (i === this.biomes.desert.id) {
        l = this.biomes.desert_hills.id
      } else if (i === this.biomes.forest.id) {
        l = this.biomes.wooded_hills.id
      } else if (i === this.biomes.birch_forest.id) {
        l = this.biomes.birch_forest_hills.id
      } else if (i === this.biomes.dark_forest.id) {
        l = this.biomes.plains.id
      } else if (i === this.biomes.taiga.id) {
        l = this.biomes.taiga_hills.id
      } else if (i === this.biomes.giant_tree_taiga.id) {
        l = this.biomes.giant_tree_taiga_hills.id
      } else if (i === this.biomes.snowy_taiga.id) {
        l = this.biomes.snowy_taiga_hills.id
      } else if (i === this.biomes.plains.id) {
        l = this.nextInt(3) === 0 ? this.biomes.wooded_hills.id : this.biomes.forest.id
      } else if (i === this.biomes.snowy_tundra.id) {
        l = this.biomes.snowy_mountains.id
      } else if (i === this.biomes.jungle.id) {
        l = this.biomes.jungle_hills.id
      } else if (i === this.biomes.bamboo_jungle.id) {
        l = this.biomes.bamboo_jungle_hills.id
      } else if (i === this.biomes.ocean.id) {
        l = this.biomes.deep_ocean.id
      } else if (i === this.biomes.lukewarm_ocean.id) {
        l = this.biomes.deep_lukewarm_ocean.id
      } else if (i === this.biomes.cold_ocean.id) {
        l = this.biomes.deep_cold_ocean.id
      } else if (i === this.biomes.frozen_ocean.id) {
        l = this.biomes.deep_frozen_ocean.id
      } else if (i === this.biomes.mountains.id) {
        l = this.biomes.wooded_mountains.id
      } else if (i === this.biomes.savanna.id) {
        l = this.biomes.savanna_plateau.id
      } else if (this.areSimilar(i, this.biomes.wooded_badlands_plateau.id)) {
        l = this.biomes.badlands.id
      } else if ((i === this.biomes.deep_ocean.id || i === this.biomes.deep_lukewarm_ocean.id ||
          i === this.biomes.deep_cold_ocean.id || i === this.biomes.deep_frozen_ocean.id) &&
          this.nextInt(3) === 0) {
        // in 1.12 this check is only for DEEP_OCEAN but since the other can't spawn, its ok
        l = this.nextInt(2) === 0 ? this.biomes.plains.id : this.biomes.forest.id
      }

      if (k === 0 && l !== i) {
        const biome = this.mcData.biomes[l]
        l = (biome && biome.child) ? biome.child : i
      }

      if (l !== i) {
        let m = 0
        if (this.areSimilar(this.parent.get(x, y, z - 1), i)) m++
        if (this.areSimilar(this.parent.get(x + 1, y, z), i)) m++
        if (this.areSimilar(this.parent.get(x - 1, y, z), i)) m++
        if (this.areSimilar(this.parent.get(x, y, z + 1), i)) m++
        if (m >= 3) return l
      }
    }
    return i
  }
}

class SunflowerPlainsLayer extends BiomeLayer {
  sample (x, y, z) {
    this.setSeed(x, z)
    const value = this.parent.get(x, y, z)
    return value === this.biomes.plains.id && this.nextInt(57) === 0 ? this.biomes.sunflower_plains.id : value
  }
}

class EdgeBiomesLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    const biome = this.mcData.biomes[center]

    const isNotShallowOcean = (id) => !this.isShallowOcean(id)
    const isNotOcean = (id) => !this.isOcean(id)
    const isWooded = (id) => {
      const b = this.mcData.biomes[id]
      if (b && b.category === 'jungle') return true
      return id === this.biomes.jungle_edge.id || id === this.biomes.jungle.id || id === this.biomes.jungle_hills.id || id === this.biomes.forest.id || id === this.biomes.taiga.id || this.isOcean(id)
    }
    const isBadlands = (id) => {
      return id === this.biomes.badlands.id || id === this.biomes.wooded_badlands_plateau.id || id === this.biomes.badlands_plateau.id || id === this.biomes.eroded_badlands.id || id === this.biomes.modified_wooded_badlands_plateau.id || id === this.biomes.modified_badlands_plateau.id
    }
    const nesw = [n, e, s, w]

    if (center === this.biomes.mushroom_fields.id) {
      if (nesw.every(isNotShallowOcean)) return center
      return this.biomes.mushroom_field_shore.id
    } else if (biome && biome.category === 'jungle') {
      if (!nesw.every(isWooded)) return this.biomes.jungle_edge.id
      if (nesw.every(isNotOcean)) return center
      return this.biomes.beach.id
    } else if (center !== this.biomes.mountains.id && center !== this.biomes.wooded_mountains.id && center !== this.biomes.mountain_edge.id) {
      if (biome && biome.precipitation === 'snow') {
        if (!this.isOcean(center) && !nesw.every(isNotOcean)) {
          return this.biomes.snowy_beach.id
        }
      } else if (center !== this.biomes.badlands.id && center !== this.biomes.wooded_badlands_plateau.id) {
        if (!this.isOcean(center) && center !== this.biomes.river.id && center !== this.biomes.swamp.id && !nesw.every(isNotOcean)) {
          return this.biomes.beach.id
        }
      } else if (nesw.every(isNotOcean) && !nesw.every(isBadlands)) {
        return this.biomes.desert.id
      }
    } else if (!this.isOcean(center) && !nesw.every(isNotOcean)) {
      return this.biomes.stone_shore.id
    }

    return center
  }
}

class SmoothScaleLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    const xMatches = e === w
    const zMatches = n === s

    if (xMatches && zMatches) {
      return this.choose2(w, n)
    } else if (!xMatches && !zMatches) {
      return center
    } else if (xMatches) {
      return w
    }
    return n
  }
}

class NoiseToRiverLayer extends CrossLayer {
  xsample (n, e, s, w, center) {
    const i = this.isValidForRiver(center)
    return i === this.isValidForRiver(w) && i === this.isValidForRiver(n) && i === this.isValidForRiver(e) && i === this.isValidForRiver(s) ? -1 : this.biomes.river.id
  }

  isValidForRiver (value) {
    return value >= 2 ? 2 + (value & 1) : value
  }
}

class RiverLayer extends BiomeLayer {
  constructor (mcData, worldSeed, salt, biomes, noise) {
    super(mcData, worldSeed, salt, biomes)
    this.noise = noise
  }

  sample (x, y, z) {
    const landStackCenter = this.parent.get(x, y, z)
    const noiseStackCenter = this.noise.get(x, y, z)

    if (this.isOcean(landStackCenter)) return landStackCenter

    if (noiseStackCenter === this.biomes.river.id) {
      if (landStackCenter === this.biomes.snowy_tundra.id) {
        return this.biomes.frozen_river.id
      } else {
        return landStackCenter !== this.biomes.mushroom_fields.id && landStackCenter !== this.biomes.mushroom_field_shore.id ? noiseStackCenter & 255 : this.biomes.mushroom_field_shore.id
      }
    }
    return landStackCenter
  }
}

class OceanTemperatureLayer extends BiomeLayer {
  constructor (mcData, worldSeed, salt) {
    super(mcData, worldSeed, salt)
    this.perlin = new PerlinNoiseSampler(new Random(worldSeed))
  }

  sample (x, y, z) {
    const normalizedNoise = this.perlin.sample(x / 8, z / 8, 0, 0, 0)
    if (normalizedNoise > 0.4) {
      return this.biomes.warm_ocean.id
    } else if (normalizedNoise > 0.2) {
      return this.biomes.lukewarm_ocean.id
    } else if (normalizedNoise < -0.4) {
      return this.biomes.frozen_ocean.id
    } else if (normalizedNoise < -0.2) {
      return this.biomes.cold_ocean.id
    }
    return this.biomes.ocean.id
  }
}

class ApplyOceanTemperatureLayer extends BiomeLayer {
  constructor (mcData, worldSeed, salt, parent, ocean) {
    super(mcData, worldSeed, salt, parent)
    this.ocean = ocean
  }

  sample (x, y, z) {
    const fullStackCenter = this.parent.get(x, y, z)
    if (!this.isOcean(fullStackCenter)) return fullStackCenter

    const oceanStackCenter = this.ocean.get(x, y, z)
    for (let rx = -8; rx <= 8; rx += 4) {
      for (let rz = -8; rz <= 8; rz += 4) {
        const shiftedXZ = this.parent.get(x + rx, y, z + rz)
        if (this.isOcean(shiftedXZ)) continue

        if (oceanStackCenter === this.biomes.warm_ocean.id) {
          return this.biomes.lukewarm_ocean.id
        } else if (oceanStackCenter === this.biomes.frozen_ocean.id) {
          return this.biomes.cold_ocean.id
        }
      }
    }

    if (fullStackCenter !== this.biomes.deep_ocean.id) return oceanStackCenter

    if (oceanStackCenter === this.biomes.lukewarm_ocean.id) {
      return this.biomes.deep_lukewarm_ocean.id
    } else if (oceanStackCenter === this.biomes.ocean.id) {
      return this.biomes.deep_ocean.id
    } else if (oceanStackCenter === this.biomes.cold_ocean.id) {
      return this.biomes.deep_cold_ocean.id
    } else if (oceanStackCenter === this.biomes.frozen_ocean.id) {
      return this.biomes.deep_frozen_ocean.id
    }

    return oceanStackCenter
  }
}

class VoronoiLayer extends BiomeLayer {
  constructor (mcData, worldSeed, is3D, parent) {
    super(mcData, worldSeed, mcData.isOlderThan('1.15') ? 10n : 0n, parent)
    this.seed = mcData.isOlderThan('1.15') ? worldSeed : hashWorldSeed(worldSeed)
    this.is3D = is3D
  }

  sample (x, y, z) {
    return this.mcData.isOlderThan('1.15') ? this.sample14minus(x, z) : this.sample15plus(x, y, z)
  }

  sample14minus (x, z) {
    let offset
    x -= 2
    z -= 2
    const pX = x >> 2
    const pZ = z >> 2
    const sX = pX << 2
    const sZ = pZ << 2
    const off00 = this.calcOffset(this.layerSeed, sX, sZ, 0, 0)
    const off10 = this.calcOffset(this.layerSeed, sX, sZ, 4, 0)
    const off01 = this.calcOffset(this.layerSeed, sX, sZ, 0, 4)
    const off11 = this.calcOffset(this.layerSeed, sX, sZ, 4, 4)

    const cell = (z & 3) * 4 + (x & 3)
    const corner0 = this.calcContribution(off00, cell >> 2, cell & 3)
    const corner1 = this.calcContribution(off10, cell >> 2, cell & 3)
    const corner2 = this.calcContribution(off01, cell >> 2, cell & 3)
    const corner3 = this.calcContribution(off11, cell >> 2, cell & 3)

    if (corner0 < corner1 && corner0 < corner2 && corner0 < corner3) {
      offset = 0
    } else if (corner1 < corner0 && corner1 < corner2 && corner1 < corner3) {
      offset = 1
    } else if (corner2 < corner0 && corner2 < corner1 && corner2 < corner3) {
      offset = 2
    } else {
      offset = 3
    }

    //  X -> (offset&1)
    // _________
    // | 0 | 1 |   Z (offset>>1)
    // |---|---|   |
    // | 2 | 3 |  \_/
    // |___|___|
    return this.parent.get(pX + (offset & 1), 0, pZ + (offset >> 1))
  }

  sample15plus (x, y, z) {
    const i = x - 2
    const j = y - 2
    const k = z - 2
    const l = i >> 2
    const m = j >> 2
    const n = k >> 2
    const d = (i & 3) / 4.0
    const e = (j & 3) / 4.0
    const f = (k & 3) / 4.0
    const ds = new Array(8)

    for (let cell = 0; cell < 8; cell++) {
      const bl = (cell & 4) === 0
      const bl2 = (cell & 2) === 0
      const bl3 = (cell & 1) === 0
      const aa = bl ? l : l + 1
      const ab = bl2 ? m : m + 1
      const ac = bl3 ? n : n + 1
      const g = bl ? d : d - 1.0
      const h = bl2 ? e : e - 1.0
      const s = bl3 ? f : f - 1.0
      ds[cell] = this.calcSquaredDistance(this.seed, aa, ab, ac, g, h, s)
    }

    let index = 0
    let min = ds[0]

    for (let cell = 1; cell < 8; cell++) {
      if (ds[cell] >= min) continue
      index = cell
      min = ds[cell]
    }

    const xFinal = (index & 4) === 0 ? l : l + 1
    const yFinal = (index & 2) === 0 ? m : m + 1
    const zFinal = (index & 1) === 0 ? n : n + 1
    return this.parent.get(xFinal, this.is3D ? yFinal : 0, zFinal)
  }

  calcContribution (d, x, z) {
    return (x - d[1]) * (x - d[1]) + (z - d[0]) * (z - d[0])
  }

  calcOffset (layerSeed, x, z, offX, offZ) {
    let mixedSeed = mixSeed(layerSeed, BigInt(x + offX))
    mixedSeed = mixSeed(mixedSeed, BigInt(z + offZ))
    mixedSeed = mixSeed(mixedSeed, BigInt(x + offX))
    mixedSeed = mixSeed(mixedSeed, BigInt(z + offZ))
    const d1 = ((Number(floorMod(mixedSeed >> 24n, 1024n)) / 1024.0) - 0.5) * 3.6 + offX
    mixedSeed = mixSeed(mixedSeed, layerSeed)
    const d2 = ((Number(floorMod(mixedSeed >> 24n, 1024n)) / 1024.0) - 0.5) * 3.6 + offZ
    return [d1, d2]
  }

  calcSquaredDistance (seed, x, y, z, xFraction, yFraction, zFraction) {
    let mixedSeed = mixSeed(seed, BigInt(x))
    mixedSeed = mixSeed(mixedSeed, BigInt(y))
    mixedSeed = mixSeed(mixedSeed, BigInt(z))
    mixedSeed = mixSeed(mixedSeed, BigInt(x))
    mixedSeed = mixSeed(mixedSeed, BigInt(y))
    mixedSeed = mixSeed(mixedSeed, BigInt(z))
    const d = xFraction + this.distribute(mixedSeed)
    mixedSeed = mixSeed(mixedSeed, seed)
    const e = yFraction + this.distribute(mixedSeed)
    mixedSeed = mixSeed(mixedSeed, seed)
    const f = zFraction + this.distribute(mixedSeed)
    return f * f + e * e + d * d
  }

  distribute (seed) {
    const d = Number(floorMod(seed >> 24n, 1024n)) / 1024.0
    return (d - 0.5) * 0.9
  }
}

const LCG = require('../LCG')
function mixSeed (seed, salt) {
  seed *= seed * LCG.MMIX.multiplier + LCG.MMIX.addend
  seed += salt
  return BigInt.asIntN(64, seed)
}

function floorMod (x, y) {
  let mod = ((x % y) + y) % y
  if ((mod ^ y) < 0n && mod !== 0n) {
    mod += y
  }
  return mod
}

const crypto = require('crypto')

// Converts the given world seed to it's truncated sha256 value. This is equivalent
// to the hashed seed the server sends to the client since 1.15.
function hashWorldSeed (worldSeed) {
  const buf = Buffer.allocUnsafe(8)
  for (let i = 0; i < 8; i++) {
    buf[i] = Number(BigInt.asUintN(8, worldSeed >> BigInt(i * 8)))
  }
  const out = crypto.createHash('sha256').update(buf).digest()
  let hashedSeed = BigInt(out[0])
  for (let i = 1; i < 8; i++) {
    hashedSeed |= BigInt(out[i]) << BigInt(i * 8)
  }
  return hashedSeed
}

module.exports = {
  ContinentLayer,
  ScaleLayer,
  LandLayer,
  IslandLayer,
  ColdClimateLayer,
  TemperateClimateLayer,
  CoolClimateLayer,
  SpecialClimateLayer,
  MushroomLayer,
  DeepOceanLayer,
  BaseBiomesLayer,
  BambooJungleLayer,
  EaseEdgeLayer,
  NoiseLayer,
  HillsLayer,
  SunflowerPlainsLayer,
  EdgeBiomesLayer,
  SmoothScaleLayer,
  NoiseToRiverLayer,
  RiverLayer,
  OceanTemperatureLayer,
  ApplyOceanTemperatureLayer,
  VoronoiLayer
}
