const SimplexNoiseSampler = require('./simplex')

class PerlinNoiseSampler {
  constructor (rand) {
    this.originX = rand.nextDouble() * 256.0
    this.originY = rand.nextDouble() * 256.0
    this.originZ = rand.nextDouble() * 256.0
    this.permutations = new Array(256)

    for (let j = 0; j < 256; j++) {
      this.permutations[j] = j
    }

    for (let j = 0; j < 256; j++) {
      const k = rand.nextInt(256 - j)
      const b = this.permutations[j]
      this.permutations[j] = this.permutations[j + k]
      this.permutations[j + k] = b
    }
  }

  sample (x, y, z, d, e) {
    const f = x + this.originX
    const g = y + this.originY
    const h = z + this.originZ
    const i = Math.floor(f)
    const j = Math.floor(g)
    const k = Math.floor(h)
    const l = f - i
    const m = g - j
    const n = h - k
    const o = perlinFade(l)
    const p = perlinFade(m)
    const q = perlinFade(n)
    const t = d !== 0 ? Math.floor(Math.min(e, m) / d) * d : 0
    return this.sampleSection(i, j, k, l, m - t, n, o, p, q)
  }

  getGradient (hash) {
    return this.permutations[hash & 255] & 255
  }

  sampleSection (sectionX, sectionY, sectionZ, localX, localY, localZ, fadeLocalX, fadeLocalY, fadeLocalZ) {
    const i = this.getGradient(sectionX) + sectionY
    const j = this.getGradient(i) + sectionZ
    const k = this.getGradient(i + 1) + sectionZ
    const l = this.getGradient(sectionX + 1) + sectionY
    const m = this.getGradient(l) + sectionZ
    const n = this.getGradient(l + 1) + sectionZ
    const d = grad(this.getGradient(j), localX, localY, localZ)
    const e = grad(this.getGradient(m), localX - 1, localY, localZ)
    const f = grad(this.getGradient(k), localX, localY - 1, localZ)
    const g = grad(this.getGradient(n), localX - 1, localY - 1, localZ)
    const h = grad(this.getGradient(j + 1), localX, localY, localZ - 1)
    const o = grad(this.getGradient(m + 1), localX - 1, localY, localZ - 1)
    const p = grad(this.getGradient(k + 1), localX, localY - 1, localZ - 1)
    const q = grad(this.getGradient(n + 1), localX - 1, localY - 1, localZ - 1)
    return lerp3(fadeLocalX, fadeLocalY, fadeLocalZ, d, e, f, g, h, o, p, q)
  }
}

function grad (hash, x, y, z) {
  return SimplexNoiseSampler.dot(SimplexNoiseSampler.GRADIENTS[hash & 15], x, y, z)
}

function lerp3 (deltaX, deltaY, deltaZ, val000, val100, val010, val110, val001, val101, val011, val111) {
  return lerp(deltaZ, lerp2(deltaX, deltaY, val000, val100, val010, val110), lerp2(deltaX, deltaY, val001, val101, val011, val111))
}

function lerp2 (deltaX, deltaY, val00, val10, val01, val11) {
  return lerp(deltaY, lerp(deltaX, val00, val10), lerp(deltaX, val01, val11))
}

function lerp (delta, start, end) {
  return start + delta * (end - start)
}

function perlinFade (d) {
  return d * d * d * (d * (d * 6 - 15) + 10)
}

module.exports = PerlinNoiseSampler
