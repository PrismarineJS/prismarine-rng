const { createWorldGenerator } = require('../../lib/WorldGenerator')
const mcData = require('minecraft-data')('1.16.4')

let generator = null

// Revert colors and add alpha
for (const biome of mcData.biomesArray) {
  const c = biome.color
  const r = (c >> 16) & 0xff
  const g = (c >> 8) & 0xff
  const b = c & 0xff
  biome.color = (b << 16) | (g << 8) | r | 0xff000000
}

const commands = {
  setSeed: async (data) => {
    const worldSeed = BigInt(data.seed)
    generator = await createWorldGenerator(mcData, worldSeed, 'overworld')
    self.postMessage({ command: 'ready', workerID: data.workerID })
  },
  strongholds: (data) => {
    data.strongholds = generator.getStrongholds()
    self.postMessage(data)
  },
  render: (data) => {
    const size = 64
    const minZ = data.y * size
    const minX = data.x * size

    const biomes = []
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const id = generator.scaledBiomeAt(data.z, minX + x, minZ + z) & 0xFF
        if (!mcData.biomes[id]) console.log(id)
        const c = mcData.biomes[id].color
        biomes.push(c)
      }
    }
    const array = new Uint32Array(biomes)
    data.pixels = array.buffer
    data.structures = {}

    if (data.z > 5) {
      const z = Math.pow(2, 6 - data.z)
      for (const structure of generator.getKnownStructures().filter(x => x !== 'strongholds')) {
        const structures = generator.getStructures(minX*z, minZ*z, minX*z+size*z, minZ*z+size*z, structure)
        if (structures.length > 0) {
          data.structures[structure] = structures
        }
      }
    }

    self.postMessage(data, [data.pixels])
  }
}

self.onmessage = (e) => {
  const commandName = e.data.command

  if (commandName in commands) {
    commands[commandName](e.data)
  }
}
