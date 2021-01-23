/* eslint-env jest */
const assert = require('assert')
const mcData = require('minecraft-data')('1.16.4')
const Enchantments = require('prismarine-rng').enchantments(mcData)
const Item = require('prismarine-item')('1.16.4')
const { Random } = require('prismarine-rng')

describe('playerseed', () => {
  test('can predict costs', () => {
    const rand = new Random(BigInt(0x464a71d4))
    const numberOfBookshelfs = 11
    const item = new Item(mcData.itemsByName.diamond_sword.id, 0)
    assert.strictEqual(Enchantments.getEnchantmentCost(rand, 0, numberOfBookshelfs, item), 3)
    assert.strictEqual(Enchantments.getEnchantmentCost(rand, 1, numberOfBookshelfs, item), 15)
    assert.strictEqual(Enchantments.getEnchantmentCost(rand, 2, numberOfBookshelfs, item), 22)
  })

  test('can predict enchants', () => {
    const xpseed = 0x464a71d4
    const levels = [3, 15, 22]
    const enchants = [{ id: 14, level: 1 }, { id: 12, level: 2 }, { id: 12, level: 3 }]

    const item = new Item(mcData.itemsByName.diamond_sword.id, 0)
    for (let slot = 0; slot < 3; slot++) {
      const list = Enchantments.getEnchantmentList(xpseed, item, slot, levels[slot])
      assert.strictEqual(list.length, 1)
      assert.strictEqual(list[0].enchant.id, enchants[slot].id)
      assert.strictEqual(list[0].level, enchants[slot].level)
    }
  })

  test('find specific enchantment', () => {
    const playerSeed = 0x484b921be1c6n
    const item = new Item(mcData.itemsByName.diamond_sword.id, 0)
    const matcher = (list) => {
      return list.find(e => e.enchant.name === 'sharpness' && e.level === 4) &&
             list.find(e => e.enchant.name === 'looting' && e.level === 3) &&
             list.find(e => e.enchant.name === 'sweeping' && e.level === 3) &&
             list.find(e => e.enchant.name === 'unbreaking' && e.level === 3)
    }
    const result = Enchantments.findEnchantment(playerSeed, item, 15, matcher)
    assert.ok(matcher(result.found))
    assert.strictEqual(result.xpseed, 458836354)
    assert.strictEqual(result.slot, 2)
    assert.strictEqual(result.nThrows, 373)
  })
})
