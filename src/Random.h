#pragma once

#include <cstdint>

struct Random {
  Random (int64_t seed) : seed(seed ^ 0x5DEECE66D) { }

  int64_t next (int bits) {
    seed = (seed * 0x5DEECE66D + 0xB) & ((1LL << 48) - 1);
    return seed >> (48 - bits);
  }

  int nextInt() {
    return static_cast<int>(next(32));
  }

  int nextInt(int bound) {
    if ((bound & -bound) == bound) {
      return static_cast<int>((bound * next(31)) >> 31);
    }

    int bits, value;
    do {
      bits = next(31);
      value = bits % bound;
    } while (bits - value + (bound - 1) < 0);

    return value;
  }

  float nextFloat() {
    return static_cast<float>(next(24)) / static_cast<float>(1L << 24);
  }

  int64_t nextLong() {
    return (next(32) << 32) + next(32);
  }

  double nextDouble () {
    return (static_cast<float>(next(26)) * 0x1p27 + static_cast<float>(next(27))) / 0x1p53;
  }

  int64_t seed;
};

namespace RandUtils {
  int64_t floorMod (int64_t x, int64_t y) {
    int64_t mod = x % y;
    if ((mod ^ y) < 0L && mod != 0L) {
      mod += y;
    }
    return mod;
  }

  int64_t mixSeed (int64_t seed, int64_t salt) {
    seed *= seed * 6364136223846793005L + 1442695040888963407L;
    seed += salt;
    return seed;
  }

  int64_t layerSeed (int64_t worldSeed, int64_t salt) {
    int64_t midsalt = mixSeed(salt, salt);
    midsalt = mixSeed(midsalt, salt);
    midsalt = mixSeed(midsalt, salt);
    int64_t layerSeed = mixSeed(worldSeed, midsalt);
    layerSeed = mixSeed(layerSeed, midsalt);
    layerSeed = mixSeed(layerSeed, midsalt);
    return layerSeed;
  }

  int64_t hashWorldSeed (int64_t worldSeed) {
    // 64 lower bits of SHA256

    // 512-bit padded input (big endian)
    uint32_t block[16];
    block[0] = __builtin_bswap32((worldSeed) & 0xffffffff);
    block[1] = __builtin_bswap32((worldSeed >> 32) & 0xffffffff);
    block[2] = 0x80000000;
    for (int i=3 ; i<15 ; i++) block[i] = 0;
    block[15] = 64;

    // Taken from NIST spec.
    #define ROTRIGHT(word,bits) (((word) >> (bits)) | ((word) << (32-(bits))))
    #define SSIG0(x) (ROTRIGHT(x,7) ^ ROTRIGHT(x,18) ^ ((x) >> 3))
    #define SSIG1(x) (ROTRIGHT(x,17) ^ ROTRIGHT(x,19) ^ ((x) >> 10))
    #define CH(x,y,z) (((x) & (y)) ^ (~(x) & (z)))
    #define MAJ(x,y,z) (((x) & (y)) ^ ((x) & (z)) ^ ((y) & (z)))
    #define EP0(x) (ROTRIGHT(x,2) ^ ROTRIGHT(x,13) ^ ROTRIGHT(x,22))
    #define EP1(x) (ROTRIGHT(x,6) ^ ROTRIGHT(x,11) ^ ROTRIGHT(x,25))

    // Taken from the spec
    //  SHA-224 and SHA-256 use the same sequence of sixty-four constant
    //  32-bit words, K0, K1, ..., K63.  These words represent the first 32
    //  bits of the fractional parts of the cube roots of the first sixty-
    //  four prime numbers.
    uint32_t k[64] = {
      0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,
      0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,
      0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,
      0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
      0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,
      0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,
      0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,
      0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
      0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,
      0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,
      0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    };

    // Initial Hash Values, first thirty-two bits of the fractional parts of
    // the square roots of the first eight prime numbers. 
    uint32_t H0 = 0x6a09e667;
    uint32_t H1 = 0xbb67ae85;
    uint32_t H2 = 0x3c6ef372;
    uint32_t H3 = 0xa54ff53a;
    uint32_t H4 = 0x510e527f;
    uint32_t H5 = 0x9b05688c;
    uint32_t H6 = 0x1f83d9ab;
    uint32_t H7 = 0x5be0cd19;

    uint32_t W[64];

    for (int t = 0; t < 16; t++) {
      W[t] = block[t] & 0xFFFFFFFF;
    }

    for (int t = 16; t < 64; t++) {
      // Also taken from spec.
      W[t] = SSIG1(W[t-2]) + W[t-7] + SSIG0(W[t-15]) + W[t-16];

      // Have to make sure we are still dealing with 32 bit numbers.
      W[t] = W[t] & 0xFFFFFFFF;
    }

    uint32_t temp1;
    uint32_t temp2;
    uint32_t a = H0;
    uint32_t b = H1;
    uint32_t c = H2;
    uint32_t d = H3;
    uint32_t e = H4;
    uint32_t f = H5;
    uint32_t g = H6;
    uint32_t h = H7;

    for (int t = 0; t < 64; t++) {
      temp1 = h + EP1(e) + CH(e,f,g) + k[t] + W[t];
      temp2 = EP0(a) + MAJ(a,b,c);

      // Do the working variables operations as per NIST.
      h = g;
      g = f;
      f = e;
      e = (d + temp1) & 0xFFFFFFFF; // Makes sure that we are still using 32 bits.
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) & 0xFFFFFFFF; // Makes sure that we are still using 32 bits.
    }

    // Add up all the working variables to each hash and make sure we are still
    // working with solely 32 bit variables.
    H0 = (H0 + a) & 0xFFFFFFFF;
    H1 = (H1 + b) & 0xFFFFFFFF;

    return __builtin_bswap64(((uint64_t)H0 << 32) + H1);
  }
}