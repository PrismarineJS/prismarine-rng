const mineflayer = require('mineflayer')
const { Random, crackPlayerSeed, enchantments } = require('prismarine-rng')
const { once } = require('events')

const bot = mineflayer.createBot({
  username: 'RngWizard',
  version: '1.16.4'
})

let bits = []
let seed = -1
let rand = null

function wait (ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

bot.on('spawn', async () => {
  const mcData = require('minecraft-data')(bot.version)
  const Enchantments = enchantments(mcData)

  bot.chat(`/clear ${bot.username}`)
  bot.chat(`/give ${bot.username} minecraft:stone 64`)
  bot.chat(`/give ${bot.username} minecraft:diamond_sword 5`)
  bot.chat(`/give ${bot.username} minecraft:lapis_lazuli 64`)
  bot.chat(`/xp set ${bot.username} 999 levels`)
  await wait(1000)

  bot.on('blockUpdate', () => {
    const b = bot.findBlock({ matching: mcData.blocksByName.enchanting_table.id })
    if (!b) return
    console.log('Enchanting power: ', Enchantments.getEnchantmentPower(b.position, bot.world))
  })

  function findUnenchantedDiamondSword (enchantingTable) {
    const w = enchantingTable
    for (const item of w.items()) {
      if (item.type === mcData.itemsByName.diamond_sword.id && !(item.nbt && item.nbt.value.Enchantments)) return item
    }
    return null
  }

  function printEnchantList (list) {
    for (const e of list) {
      console.log(' ', e.enchant.name, e.level)
    }
  }

  function printResult (item) {
    console.log('Enchant result:')
    for (const e of item.nbt.value.Enchantments.value.value) {
      console.log(' ', e.id.value, e.lvl.value)
    }
    console.log()
  }

  function printSlot (i, slot) {
    console.log('Slot', i, slot.level, mcData.enchantments[slot.expected.enchant].name, slot.expected.level)
  }

  async function openEnchant (rand) {
    const b = bot.findBlock({ matching: mcData.blocksByName.enchanting_table.id })
    const enchantingTable = await bot.openEnchantmentTable(b)

    // put lapis first
    const lapis = enchantingTable.findInventoryItem(mcData.itemsByName.lapis_lazuli.id)
    await enchantingTable.putLapis(lapis)

    let item = findUnenchantedDiamondSword(enchantingTable)
    await enchantingTable.putTargetItem(item)
    if (!enchantingTable.enchantments[0].level || !enchantingTable.enchantments[1].level || !enchantingTable.enchantments[2].level) {
      await once(enchantingTable, 'ready')
    }

    for (let i = 0; i < 4; i++) {
      await enchantingTable.enchant(0)
      printResult(await enchantingTable.takeTargetItem())

      await wait(1000)

      item = findUnenchantedDiamondSword(enchantingTable)
      await enchantingTable.putTargetItem(item)
      if (!enchantingTable.enchantments[0].level || !enchantingTable.enchantments[1].level || !enchantingTable.enchantments[2].level) {
        await once(enchantingTable, 'ready')
      }

      const xpseed = rand.nextInt()
      console.log('xpseed: ', xpseed, xpseed.toString(16), (xpseed & 0xFFFF).toString(16), 'Server sent:', (enchantingTable.xpseed & 0xFFFF).toString(16))

      const rand2 = new Random(BigInt(xpseed))
      const power = 15
      for (let slot = 0; slot < 3; slot++) {
        console.log(slot, Enchantments.getEnchantmentCost(rand2, slot, power, item))
      }

      printSlot(0, enchantingTable.enchantments[0])
      printEnchantList(Enchantments.getEnchantmentList(xpseed, item, 0, enchantingTable.enchantments[0].level))
      printSlot(1, enchantingTable.enchantments[1])
      printEnchantList(Enchantments.getEnchantmentList(xpseed, item, 1, enchantingTable.enchantments[1].level))
      printSlot(2, enchantingTable.enchantments[2])
      printEnchantList(Enchantments.getEnchantmentList(xpseed, item, 2, enchantingTable.enchantments[2].level))
      console.log()
    }
  }

  bot._client.on('spawn_entity', async (packet) => {
    // TODO: improve entity filtering, this is highly dependent on the version
    if (packet.type === 37 || (mcData.objects[packet.type] && mcData.objects[packet.type].name === 'item_stack')) {
      const randFloat = Math.atan2(packet.velocityZ, packet.velocityX) / 6.2831855
      const randBits = randFloat * (1 << 24)
      const value = (randBits >> (24 - 4)) & 0xF

      if (bits.length < 20) {
        console.log(packet.velocityX, packet.velocityZ, value)
        bits.push(value)
      }
      if (bits.length >= 20) {
        if (!rand) {
          seed = crackPlayerSeed(bits)
          console.log('raw seed: ', seed)
          if (seed === 0n) {
            bits = []
            return
          }
          rand = new Random(seed ^ 0x5DEECE66Dn)
          rand.nextInt()
          rand.nextInt()
          console.log('seed: ', rand.seed.toString(16))
          await wait(2000)
          await openEnchant(rand)
        } else {
          const expected = ((rand.nextInt() >> 28) & 0xF)
          rand.nextInt()
          rand.nextInt()
          rand.nextInt()
          console.log('Got: ', value, 'Predicted: ', expected)
        }
      }
    }
  })

  await bot.look(0, -Math.PI / 2, true)
  await wait(1000)
  for (let i = 0; i < 20; i++) {
    await bot.toss(1, 0, 1)
  }
})
