/* eslint-env jest */
const assert = require('assert')
const { Random } = require('prismarine-rng')

describe('random', () => {
  test('nextInt', () => {
    // Expected is generated in java
    const expected = [-1155484576, -723955400, 1033096058, -1690734402, -1557280266, 1327362106, -1930858313, 502539523, -1728529858, -938301587]
    const rand = new Random(0n)
    for (let i = 0; i < expected.length; i++) {
      const v = rand.nextInt()
      assert.strictEqual(v, expected[i])
    }
  })

  test('nextInt(5)', () => {
    // Expected is generated in java
    const expected = [0, 3, 4, 2, 0, 3, 1, 1, 4, 4]
    const rand = new Random(0n)
    for (let i = 0; i < expected.length; i++) {
      const v = rand.nextInt(5)
      assert.strictEqual(v, expected[i])
    }
  })

  test('nextFloat', () => {
    // Expected is generated in java
    const expected = [0.73096776, 0.831441, 0.24053639, 0.6063452, 0.6374174, 0.30905056, 0.550437, 0.1170066, 0.59754527, 0.7815346]
    const rand = new Random(0n)
    for (let i = 0; i < expected.length; i++) {
      const v = rand.nextFloat()
      assert.strictEqual(v, Math.fround(expected[i]))
    }
  })

  test('skip(4)', () => {
    // One rng is skipping 3 values at each iterations
    const rand1 = new Random(0n)
    const rand2 = new Random(0n)

    const n = 10
    rand2.lcg = rand2.lcg.combine(4)

    for (let i = 0; i < n; i++) {
      rand1.nextInt()
      rand1.nextInt()
      rand1.nextInt()
      assert.strictEqual(rand1.nextInt(), rand2.nextInt())
    }
  })

  test('reverse', () => {
    // Generate n value, invert the rng and generate backward
    const rand = new Random(0n)
    const n = 10
    const expected = []
    for (let i = 0; i < n; i++) {
      expected.push(rand.nextInt())
    }
    rand.nextInt()
    rand.lcg = rand.lcg.invert()
    for (let i = n - 1; i >= 0; i--) {
      assert.strictEqual(rand.nextInt(), expected[i])
    }
  })
})
