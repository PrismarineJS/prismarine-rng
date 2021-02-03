#pragma once

#include "../Random.h"

struct PerlinNoiseSampler {
  static constexpr const int GRADIENTS[][3] = {
    {1, 1, 0}, {-1, 1, 0}, {1, -1, 0}, {-1, -1, 0}, {1, 0, 1}, {-1, 0, 1}, {1, 0, -1}, {-1, 0, -1},
    {0, 1, 1}, {0, -1, 1}, {0, 1, -1}, {0, -1, -1}, {1, 1, 0}, {0, -1, 1}, {-1, 1, 0}, {0, -1, -1}
  };

  int permutations[256];
  double originX;
  double originY;
  double originZ;

  PerlinNoiseSampler(Random rand) {
    originX = rand.nextDouble() * 256.0;
    originY = rand.nextDouble() * 256.0;
    originZ = rand.nextDouble() * 256.0;

    for(int j = 0; j < 256; ++j) {
      permutations[j] = j;
    }

    for(int j = 0; j < 256; ++j) {
      int k = rand.nextInt(256 - j);
      int b = permutations[j];
      permutations[j] = permutations[j + k];
      permutations[j + k] = b;
    }
  }

  double sample(double x, double y, double z, double d, double e) {
    double f = x + originX;
    double g = y + originY;
    double h = z + originZ;
    int i = floor(f);
    int j = floor(g);
    int k = floor(h);
    double l = f - (double)i;
    double m = g - (double)j;
    double n = h - (double)k;
    double o = perlinFade(l);
    double p = perlinFade(m);
    double q = perlinFade(n);
    double t;
    if (d != 0.0) {
      double r = e < m ? e : m;
      t = (double)floor(r / d) * d;
    } else {
      t = 0.0;
    }

    return sample(i, j, k, l, m - t, n, o, p, q);
  }

  double grad(int hash, double x, double y, double z) {
    return (double)GRADIENTS[hash & 15][0] * x + (double)GRADIENTS[hash & 15][1] * y + (double)GRADIENTS[hash & 15][2] * z;
  }

  int getGradient(int hash) {
    return permutations[hash & 255] & 255;
  }

  double sample(int sectionX, int sectionY, int sectionZ, double localX, double localY, double localZ, double fadeLocalX, double fadeLocalY, double fadeLocalZ) {
    int i = getGradient(sectionX) + sectionY;
    int j = getGradient(i) + sectionZ;
    int k = getGradient(i + 1) + sectionZ;
    int l = getGradient(sectionX + 1) + sectionY;
    int m = getGradient(l) + sectionZ;
    int n = getGradient(l + 1) + sectionZ;
    double d = grad(getGradient(j), localX, localY, localZ);
    double e = grad(getGradient(m), localX - 1.0, localY, localZ);
    double f = grad(getGradient(k), localX, localY - 1.0, localZ);
    double g = grad(getGradient(n), localX - 1.0, localY - 1.0, localZ);
    double h = grad(getGradient(j + 1), localX, localY, localZ - 1.0);
    double o = grad(getGradient(m + 1), localX - 1.0, localY, localZ - 1.0);
    double p = grad(getGradient(k + 1), localX, localY - 1.0, localZ - 1.0);
    double q = grad(getGradient(n + 1), localX - 1.0, localY - 1.0, localZ - 1.0);
    return lerp3(fadeLocalX, fadeLocalY, fadeLocalZ, d, e, f, g, h, o, p, q);
  }

  int floor(double d) {
    int i = (int)d;
    return d < (double)i ? i - 1 : i;
  }

  double lerp3(double deltaX, double deltaY, double deltaZ, double val000, double val100, double val010, double val110, double val001, double val101, double val011, double val111) {
    return lerp(deltaZ, lerp2(deltaX, deltaY, val000, val100, val010, val110), lerp2(deltaX, deltaY, val001, val101, val011, val111));
  }

  double lerp2(double deltaX, double deltaY, double val00, double val10, double val01, double val11) {
    return lerp(deltaY, lerp(deltaX, val00, val10), lerp(deltaX, val01, val11));
  }

  double lerp(double delta, double start, double end) {
    return start + delta * (end - start);
  }

  double perlinFade(double d) {
    return d * d * d * (d * (d * 6.0 - 15.0) + 10.0);
  }
};
