/* eslint-env jest */
const assert = require('assert')
const { LCG, Random, crackPlayerSeed } = require('prismarine-rng')

describe('playerseed', () => {
  test('crack', () => {
    const crackedSeed = 0x8f9d0c72ce6bn
    const playerRand = new Random(crackedSeed ^ LCG.JAVA.multiplier)
    playerRand.skip(-20 * 4)

    const bits = []
    for (let i = 0; i < 20; i++) {
      const v = playerRand.nextInt()
      playerRand.nextInt()
      playerRand.nextInt()
      playerRand.nextInt()
      bits.push((v >> 28) & 0xF)
    }

    const seed = crackPlayerSeed(bits)
    assert.notStrictEqual(seed, 0n)

    const rand2 = new Random(seed ^ LCG.JAVA.multiplier)
    rand2.nextInt()
    rand2.nextInt()

    assert.strictEqual(rand2.seed, crackedSeed)
  })
})
