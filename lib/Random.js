const LCG = require('./LCG')

class Rand {
  constructor (seed, lcg = LCG.JAVA) {
    this.seed = seed ^ LCG.JAVA.multiplier
    this.lcg = lcg
  }

  next (bits) {
    this.seed = this.lcg.nextSeed(this.seed)
    return this.seed >> (48n - BigInt(bits))
  }

  advance (lcg) {
    this.seed = lcg.nextSeed(this.seed)
  }

  skip (skip) {
    this.advance(this.lcg.combine(skip))
  }

  nextInt (bound) {
    if (!bound) return Number(BigInt.asIntN(32, this.next(32)))

    if (bound <= 0) {
      throw new Error('bound must be positive')
    }

    bound = Math.floor(bound)

    if ((bound & -bound) === bound) {
      return Number(BigInt.asIntN(32, (BigInt(bound) * this.next(31)) >> 31n))
    }

    let bits, value
    do {
      bits = Number(BigInt.asIntN(32, this.next(31)))
      value = bits % bound
    } while (bits - value + (bound - 1) < 0)

    return value
  }

  nextFloat () {
    return Number(BigInt.asIntN(32, this.next(24))) / (1 << 24)
  }
}

module.exports = Rand
