class SimplexNoiseSampler {
  static GRADIENTS = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0], [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1], [1, 1, 0], [0, -1, 1], [-1, 1, 0], [0, -1, -1]
  ]

  static SKEW_FACTOR_2D = 0.5 * (Math.sqrt(3.0) - 1.0) // also known as F2 // 0.3660254037844386D
  static UNSKEW_FACTOR_2D = (3.0 - Math.sqrt(3.0)) / 6.0 // also known as G2 // 0.21132486540518713D

  constructor (rand) {
    this.originX = rand.nextDouble() * 256
    this.originY = rand.nextDouble() * 256
    this.originZ = rand.nextDouble() * 256

    for (let j = 0; j < 256; j++) {
      this.permutations[j] = j
    }

    for (let j = 0; j < 256; j++) {
      const k = rand.nextInt(256 - j)
      const l = this.permutations[j]
      this.permutations[j] = this.permutations[k + j]
      this.permutations[k + j] = l
    }
  }

  getGradient (hash) {
    return this.permutations[hash & 255]
  }

  static dot (gArr, x, y, z) {
    return gArr[0] * x + gArr[1] * y + gArr[2] * z
  }

  grad (hash, x, y, z, d) {
    const c = d - x * x - y * y - z * z
    const c2 = c * c
    return c < 0 ? 0 : c2 * c2 * SimplexNoiseSampler.dot(SimplexNoiseSampler.GRADIENTS[hash], x, y, z)
  }

  sample2D (x, y) {
    const hairyFactor = (x + y) * SimplexNoiseSampler.SKEW_FACTOR_2D
    // in minecraft those are the temperatures
    const hairyX = Math.floor(x + hairyFactor)
    const hairyZ = Math.floor(y + hairyFactor)
    const mixedHairyXz = (hairyX + hairyZ) * SimplexNoiseSampler.UNSKEW_FACTOR_2D
    const diffXToXz = hairyX - mixedHairyXz
    const diffZToXz = hairyZ - mixedHairyXz
    const x0 = x - diffXToXz
    const y0 = y - diffZToXz
    let offsetSecondCornerX
    let offsetSecondCornerZ
    if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      offsetSecondCornerX = 1
      offsetSecondCornerZ = 0
    } else { // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      offsetSecondCornerX = 0
      offsetSecondCornerZ = 1
    }

    const x1 = x0 - offsetSecondCornerX + SimplexNoiseSampler.UNSKEW_FACTOR_2D
    const y1 = y0 - offsetSecondCornerZ + SimplexNoiseSampler.UNSKEW_FACTOR_2D
    const x3 = x0 - 1.0 + 2.0 * SimplexNoiseSampler.UNSKEW_FACTOR_2D
    const y3 = y0 - 1.0 + 2.0 * SimplexNoiseSampler.UNSKEW_FACTOR_2D
    const ii = hairyX & 255
    const jj = hairyZ & 255
    const gi0 = ((this.getGradient(ii + this.getGradient(jj)) % 12) + 12) % 12
    const gi1 = ((this.getGradient(ii + offsetSecondCornerX + this.getGradient(jj + offsetSecondCornerZ)) % 12) + 12) % 12
    const gi2 = ((this.getGradient(ii + 1 + this.getGradient(jj + 1)) % 12) + 12) % 12
    const t0 = this.grad(gi0, x0, y0, 0.0, 0.5)
    const t1 = this.grad(gi1, x1, y1, 0.0, 0.5)
    const t2 = this.grad(gi2, x3, y3, 0.0, 0.5)

    return 70.0 * (t0 + t1 + t2)
  }

  sample3D (x, y, z) {
    const skewFactor = (x + y + z) / 3
    // Skew the input space to determine which simplex cell we're in
    const i = Math.floor(x + skewFactor)
    const j = Math.floor(y + skewFactor)
    const k = Math.floor(z + skewFactor)
    const unskewFactor = (i + j + k) / 6
    let x0 = i - unskewFactor
    let y0 = j - unskewFactor
    let z0 = k - unskewFactor
    x0 = x - x0
    y0 = y - y0
    z0 = z - z0
    let i1, j1, k1, i2, j2, k2
    if (x0 >= y0) {
      if (y0 >= z0) { // X Y Z order
        [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0]
      } else if (x0 >= z0) { // X Z Y order
        [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1]
      } else { // Z X Y order
        [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1]
      }
    } else if (y0 < z0) { // Z Y X order
      [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1]
    } else if (x0 < z0) { // Y Z X order
      [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1]
    } else { // Y X Z order
      [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0]
    }

    const x1 = x0 - i1 + 1 / 3
    const y1 = y0 - j1 + 1 / 3
    const z1 = z0 - k1 + 1 / 3
    const x2 = x0 - i2 + 1 / 6
    const y2 = y0 - j2 + 1 / 6
    const z2 = z0 - k2 + 1 / 6
    const bj = x0 - 1.0 + 0.5
    const bk = y0 - 1.0 + 0.5
    const bl = z0 - 1.0 + 0.5
    const ii = i & 255
    const jj = j & 255
    const kk = k & 255
    const gi0 = ((this.getGradient(ii + this.getGradient(jj + this.getGradient(kk))) % 12) + 12) % 12
    const gi1 = ((this.getGradient(ii + i1 + this.getGradient(jj + j1 + this.getGradient(kk + k1))) % 12) + 12) % 12
    const gi2 = ((this.getGradient(ii + i2 + this.getGradient(jj + j2 + this.getGradient(kk + k2))) % 12) + 12) % 12
    const gi3 = ((this.getGradient(ii + 1 + this.getGradient(jj + 1 + this.getGradient(kk + 1))) % 12) + 12) % 12
    const t0 = this.grad(gi0, x0, y0, z0, 0.6)
    const t1 = this.grad(gi1, x1, y1, z1, 0.6)
    const t2 = this.grad(gi2, x2, y2, z2, 0.6)
    const t3 = this.grad(gi3, bj, bk, bl, 0.6)

    return 32.0 * (t0 + t1 + t2 + t3)
  }
}

module.exports = SimplexNoiseSampler
