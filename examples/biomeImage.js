// This example generate an image of the biome map and save it to png

const mcData = require('minecraft-data')('1.16.4')
const { createWorldGenerator } = require('prismarine-rng')
const fs = require('fs')
const { createCanvas } = require('canvas')

const worldSeed = -7621051612768298496n

async function main () {
  const generator = await createWorldGenerator(mcData, worldSeed, 'overworld')

  const size = 1024
  const biomes = []
  for (let z = 0; z < size; z++) {
    biomes.push([])
    for (let x = 0; x < size; x++) {
      biomes[z].push(generator.biomeAt(x - 512, z - 512))
    }
  }
  save('./out.png', biomes, size)

  generator.delete()
}

main()

function save (path, biomes, size) {
  // Save as png
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')
  const img = ctx.createImageData(size, size)

  let i = 0
  for (let z = 0; z < size; z++) {
    for (let x = 0; x < size; x++) {
      const c = mcData.biomes[biomes[z][x]].color
      img.data[i++] = (c >> 16) & 0xff
      img.data[i++] = (c >> 8) & 0xff
      img.data[i++] = (c >> 0) & 0xff
      img.data[i++] = 0xff
    }
  }
  ctx.putImageData(img, 0, 0)

  const out = fs.createWriteStream(path)
  const stream = canvas.createPNGStream()
  stream.pipe(out)
  out.on('finish', () => console.log('The PNG file was created.'))
}
