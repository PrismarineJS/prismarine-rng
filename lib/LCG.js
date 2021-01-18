class LCG {
  static JAVA = new LCG(0x5DEECE66Dn, 0xBn, 1n << 48n)

  constructor (multiplier, addend, modulus) {
    this.multiplier = multiplier
    this.addend = addend
    this.modulus = modulus
    if ((this.modulus & -this.modulus) !== this.modulus) throw new Error('Modulus is not a power of 2')
    this.mod = modulus - 1n
  }

  nextSeed (seed) {
    return (seed * this.multiplier + this.addend) & this.mod
  }

  combine (steps) {
    let multiplier = 1n
    let addend = 0n

    let intermediateMultiplier = this.multiplier
    let intermediateAddend = this.addend

    const longSteps = BigInt(steps) & this.mod
    for (let k = longSteps; k !== 0n; k >>= 1n) {
      if ((k & 1n) !== 0n) {
        multiplier = BigInt.asIntN(64, multiplier * intermediateMultiplier)
        addend = BigInt.asIntN(64, intermediateMultiplier * addend + intermediateAddend)
      }

      intermediateAddend = BigInt.asIntN(64, (intermediateMultiplier + 1n) * intermediateAddend)
      intermediateMultiplier = BigInt.asIntN(64, intermediateMultiplier * intermediateMultiplier)
    }

    multiplier = multiplier & this.mod
    addend = addend & this.mod

    return new LCG(multiplier, addend, this.modulus)
  }

  invert () {
    return this.combine(-1)
  }
}

module.exports = LCG
