const LCG = require('./LCG')
const Random = require('./Random')

module.exports = (mcData) => {
  const tiers = [
    { name: 'wood', level: 0, uses: 59, speed: 2, damage: 0, enchantmentValue: 15 },
    { name: 'stone', level: 1, uses: 131, speed: 4, damage: 1, enchantmentValue: 5 },
    { name: 'iron', level: 2, uses: 250, speed: 6, damage: 2, enchantmentValue: 14 },
    { name: 'diamond', level: 3, uses: 1561, speed: 8, damage: 3, enchantmentValue: 10 },
    { name: 'gold', level: 0, uses: 32, speed: 12, damage: 0, enchantmentValue: 22 },
    { name: 'netherite', level: 4, uses: 2031, speed: 9, damage: 4, enchantmentValue: 15 }
  ]

  function getTier (item) {
    return tiers.find(tier => item.name.includes(tier.name))
  }

  function selectEnchantment (rand, item, level, bypassTreasureOnly) {
    const tier = getTier(item)
    const enchantmentValue = tier ? tier.enchantmentValue : 0
    if (enchantmentValue <= 0) {
      return []
    }

    const list = []

    level += 1 + rand.nextInt(enchantmentValue / 4 + 1) + rand.nextInt(enchantmentValue / 4 + 1)
    const var7 = (rand.nextFloat() + rand.nextFloat() - 1.0) * 0.15
    level = Math.min(Math.max(Math.round(level + level * var7), 1), 2147483647)

    let availableEnchants = getAvailableEnchantmentResults(level, item, bypassTreasureOnly)

    if (availableEnchants.length > 0) {
      list.push(getRandomEnchant(rand, availableEnchants))
      while (rand.nextInt(50) <= level) {
        availableEnchants = filterCompatibleEnchantments(availableEnchants, list[list.length - 1])
        if (availableEnchants.length === 0) break
        list.push(getRandomEnchant(rand, availableEnchants))
        level /= 2
      }
    }
    return list
  }

  function getRandomEnchant (rand, enchants) {
    const totalWeight = enchants.reduce((acc, x) => acc + x.enchant.weight, 0)
    let val = rand.nextInt(totalWeight)
    for (const e of enchants) {
      val -= e.enchant.weight
      if (val < 0) return e
    }
    return null
  }

  function filterCompatibleEnchantments (enchants, last) {
    return enchants.filter(e => e.enchant !== last.enchant && last.enchant.exclude.indexOf(e.enchant.name) === -1)
  }

  function canEnchant (enchant, item) {
    // TODO: test category
    return enchant.category === 'weapon' || enchant.category === 'breakable'
  }

  function getAvailableEnchantmentResults (cost, item, bypassTreasureOnly) {
    const list = []
    for (const enchant of mcData.enchantmentsArray) {
      if (enchant.treasureOnly && !bypassTreasureOnly) continue
      if (!enchant.discoverable) continue
      if (!canEnchant(enchant, item) && item.id !== mcData.itemsByName.book.id) continue

      for (let level = enchant.maxLevel; level > 0; level--) {
        const minCost = enchant.minCost.a * level + enchant.minCost.b
        const maxCost = enchant.maxCost.a * level + enchant.maxCost.b
        if (cost >= minCost && cost <= maxCost) {
          list.push({ enchant, level })
          break
        }
      }
    }

    return list
  }

  function isAir (world, pos) {
    const b = world.getBlock(pos)
    return !b || b.type === mcData.blocksByName.air.id // TODO cave air, etc..
  }

  function enchantPower (world, pos) {
    const b = world.getBlock(pos)
    return b && b.type === mcData.blocksByName.bookshelf.id ? 1 : 0
  }

  function findEnchantment (playerSeed, item, power, matching) {
    let nThrows = 0
    const playerRand = new Random(playerSeed ^ LCG.JAVA.multiplier)
    for (let i = 0; i < 1000000; i++) {
      const xpseed = playerRand.nextInt()
      const xprand = new Random(BigInt(xpseed))
      for (let slot = 0; slot < 3; slot++) {
        const cost = getEnchantmentCost(xprand, slot, power, item)
        const list = getEnchantmentList(xpseed, item, slot, cost)
        if (matching(list)) {
          return {
            found: list,
            slot,
            xpseed,
            nThrows
          }
        }
      }
      // Throw an item
      playerRand.nextFloat()
      playerRand.nextFloat()
      playerRand.nextFloat()
      nThrows++
    }
    return null
  }

  function getEnchantmentList (xpseed, item, slot, level) {
    const rand = new Random(BigInt(xpseed) + BigInt(slot))
    const list = selectEnchantment(rand, item, level, false)

    if (item.id === mcData.itemsByName.book.id && list.length > 0) {
      list.splice(rand.nextInt(list.length), 1)
    }

    return list
  }

  function getEnchantmentCost (rand, slot, power, item) {
    const tier = getTier(item)
    let enchantmentValue = tier ? tier.enchantmentValue : 0
    if (enchantmentValue <= 0) {
      return []
    }

    if (enchantmentValue > 15) enchantmentValue = 15

    const var6 = rand.nextInt(8) + 1 + (power >> 1) + rand.nextInt(power + 1)
    if (slot === 0) {
      return Math.max(Math.floor(var6 / 3), 1)
    }
    return slot === 1 ? Math.floor(var6 * 2 / 3 + 1) : Math.max(var6, power * 2)
  }

  function getEnchantmentPower (pos, world) {
    let power = 0
    for (let dz = -1; dz <= 1; dz++) {
      for (let dx = -1; dx <= 1; dx++) {
        if ((dz !== 0 || dx !== 0) && isAir(world, pos.offset(dx, 0, dz)) && isAir(world, pos.offset(dx, 1, dz))) {
          power += enchantPower(world, pos.offset(2 * dx, 0, 2 * dz))
          power += enchantPower(world, pos.offset(2 * dx, 1, 2 * dz))
          if (dx !== 0 && dz !== 0) {
            power += enchantPower(world, pos.offset(2 * dx, 0, dz))
            power += enchantPower(world, pos.offset(2 * dx, 1, dz))
            power += enchantPower(world, pos.offset(dx, 0, 2 * dz))
            power += enchantPower(world, pos.offset(dx, 1, 2 * dz))
          }
        }
      }
    }
    return power
  }

  return {
    findEnchantment,
    getEnchantmentList,
    getEnchantmentCost,
    getEnchantmentPower
  }
}
