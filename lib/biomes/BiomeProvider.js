const layers = require('./layers')

class OverworldBiomeProvider {
  constructor (mcData, worldSeed) {
    this.mcData = mcData
    this.worldSeed = worldSeed

    this.biomeSize = 4

    this.scales = []

    // 4096
    this.base = new layers.ContinentLayer(mcData, worldSeed, 1n)
    // 2048
    this.base = new layers.ScaleLayer(mcData, worldSeed, 2000n, layers.ScaleLayer.FUZZY, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 1n, this.base)
    // 1024
    this.base = new layers.ScaleLayer(mcData, worldSeed, 2001n, layers.ScaleLayer.NORMAL, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 2n, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 50n, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 70n, this.base)
    this.base = new layers.IslandLayer(mcData, worldSeed, 2n, this.base)
    this.base = new layers.ColdClimateLayer(mcData, worldSeed, 2n, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 3n, this.base)
    this.base = new layers.TemperateClimateLayer(mcData, worldSeed, 2n, this.base)
    this.base = new layers.CoolClimateLayer(mcData, worldSeed, 2n, this.base)
    this.base = new layers.SpecialClimateLayer(mcData, worldSeed, 3n, this.base)
    // 512
    this.scales.push(this.base)
    this.base = new layers.ScaleLayer(mcData, worldSeed, 2002n, layers.ScaleLayer.NORMAL, this.base)
    // 256
    this.scales.push(this.base)
    this.base = new layers.ScaleLayer(mcData, worldSeed, 2003n, layers.ScaleLayer.NORMAL, this.base)
    this.base = new layers.LandLayer(mcData, worldSeed, 4n, this.base)
    this.base = new layers.MushroomLayer(mcData, worldSeed, 5n, this.base)
    this.base = new layers.DeepOceanLayer(mcData, worldSeed, 4n, this.base)

    // new biomes chain
    this.biomes = new layers.BaseBiomesLayer(mcData, worldSeed, 200n, this.base)

    if (mcData.isNewerOrEqualTo('1.14')) {
      this.biomes = new layers.BambooJungleLayer(mcData, worldSeed, 1001n, this.biomes)
    }

    // 128
    this.scales.push(this.biomes)
    this.biomes = new layers.ScaleLayer(mcData, worldSeed, 1000n, layers.ScaleLayer.NORMAL, this.biomes)
    // 64
    this.scales.push(this.biomes)
    this.biomes = new layers.ScaleLayer(mcData, worldSeed, 1001n, layers.ScaleLayer.NORMAL, this.biomes)
    this.biomes = new layers.EaseEdgeLayer(mcData, worldSeed, 1000n, this.biomes)

    // noise generation for variant and river
    this.noise = new layers.NoiseLayer(mcData, worldSeed, 100n, this.base)

    if (mcData.isOlderThan('1.13')) {
      // this line needs an explanation : basically back when the stack was recursively initialized, only one parent was
      // initialized with its world seed but the hills layer had 2 parents so the noise was never initialized recursively,
      // we simulate this stuff here by scaling with world seed equals to 0
      // the river branch still use the full scaling with its normal layer seed
      this.river = new layers.ScaleLayer(mcData, worldSeed, 1000n, layers.ScaleLayer.NORMAL, this.noise)
      this.river = new layers.ScaleLayer(mcData, worldSeed, 1001n, layers.ScaleLayer.NORMAL, this.river)
      // Passing 0 for worldSeed and salt leads to the layerSeed being equal to 0.
      this.noise = new layers.ScaleLayer(mcData, 0n, 0n, layers.ScaleLayer.NORMAL, this.noise)
      this.noise = new layers.ScaleLayer(mcData, 0n, 0n, layers.ScaleLayer.NORMAL, this.noise)
    } else {
      this.noise = new layers.ScaleLayer(mcData, worldSeed, 1000n, layers.ScaleLayer.NORMAL, this.noise)
      this.noise = new layers.ScaleLayer(mcData, worldSeed, 1001n, layers.ScaleLayer.NORMAL, this.noise)
      this.river = this.noise
    }

    // hills and variants chain
    this.variants = new layers.HillsLayer(mcData, worldSeed, 1000n, this.biomes, this.noise)
    this.variants = new layers.SunflowerPlainsLayer(mcData, worldSeed, 1001n, this.variants)

    for (let i = 0; i < this.biomeSize; i++) {
      this.scales.push(this.variants)
      this.variants = new layers.ScaleLayer(mcData, worldSeed, BigInt(1000 + i), layers.ScaleLayer.NORMAL, this.variants)

      if (i === 0) {
        this.variants = new layers.LandLayer(mcData, worldSeed, 3n, this.variants)
      }

      if (i === 1 || this.biomeSize === 1) {
        this.variants = new layers.EdgeBiomesLayer(mcData, worldSeed, 1000n, this.variants)
      }
    }

    this.variants = new layers.SmoothScaleLayer(mcData, worldSeed, 1000n, this.variants)

    for (let i = 0; i < this.biomeSize; i++) {
      this.river = new layers.ScaleLayer(mcData, worldSeed, BigInt(1000 + i), layers.ScaleLayer.NORMAL, this.river)
    }

    this.river = new layers.NoiseToRiverLayer(mcData, worldSeed, 1n, this.river)
    this.river = new layers.SmoothScaleLayer(mcData, worldSeed, 1000n, this.river)

    // mixing of the river with the hills and variants
    this.full = new layers.RiverLayer(mcData, worldSeed, 100n, this.variants, this.river)

    if (mcData.isNewerOrEqualTo('1.13')) {
      // ocean chains
      this.ocean = new layers.OceanTemperatureLayer(mcData, worldSeed, 2n)
      for (let i = 0; i < this.biomeSize + 2; i++) {
        this.ocean = new layers.ScaleLayer(mcData, worldSeed, BigInt(2001 + i), layers.ScaleLayer.NORMAL, this.ocean)
      }
      // mixing of the two firsts stacks with the ocean chain
      this.full = new layers.ApplyOceanTemperatureLayer(mcData, worldSeed, 100n, this.full, this.ocean)
    }

    this.scales.push(this.full)
    // Insert a fake scale layer to make the transition between full and voronoi (used only for map view)
    this.scales.push(new layers.ScaleLayer(mcData, worldSeed, 2001n, layers.ScaleLayer.NORMAL, this.full))
    this.voronoi = new layers.VoronoiLayer(mcData, worldSeed, false, this.full)
    this.scales.push(this.voronoi)
  }

  getBiome (x, y, z) {
    return this.mcData.biomes[this.voronoi.get(x, 0, z)]
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
        const biome = this.full.get(x, 0, z)
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
}

module.exports = { OverworldBiomeProvider }
