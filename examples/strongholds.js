// Find all strongholds for a given world seed

const mcData = require('minecraft-data')('1.16.4')
const { createWorldGenerator } = require('prismarine-rng')
const { performance } = require('perf_hooks')

const worldSeed = 541515181818n

async function main () {
  const generator = await createWorldGenerator(mcData, worldSeed, 'overworld')

  const t1 = performance.now()
  const strongholds = generator.getStrongholds()
  const t2 = performance.now()
  console.log(strongholds)
  console.log(`Found ${strongholds.length} strongholds in ${t2 - t1} ms`)

  generator.delete()
}

main()
