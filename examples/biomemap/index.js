const mcData = require('minecraft-data')('1.16.4')
const { OverworldBiomeProvider } = require('../../lib/biomes/BiomeProvider')

let provider = null

// Revert colors and add alpha
for (const biome of mcData.biomesArray) {
  const c = biome.color
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  biome.color = (b << 16) | (g << 8) | r | 0xff000000
}

const commands = {
  'setSeed': (data) => {
    provider = new OverworldBiomeProvider(mcData, BigInt(data.seed))
  },
  'render': (data) => {
    if (!provider) return

    const size = 64
    const minZ = data.y * size
    const minX = data.x * size

    const layer = provider.scales[data.z]
    const biomes = []
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const id = layer.sample(minX + x, 0, minZ + z) & 0xFF
        if (!mcData.biomes[id]) console.log(id)
        const c = mcData.biomes[id].color
        biomes.push(c)
      }
    }
    const array = new Uint32Array(biomes)
    data.pixels = array.buffer
    self.postMessage(data, [data.pixels])
  }
}

self.onmessage = (e) => {
  const commandName = e.data.command
  
  if (commandName in commands) {
    commands[commandName](e.data)
  }
}