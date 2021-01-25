#pragma once

#include "Random.h"

struct SimplexNoiseSampler {
  static constexpr const int GRADIENTS[][3] = {
    {1, 1, 0}, {-1, 1, 0}, {1, -1, 0}, {-1, -1, 0}, {1, 0, 1}, {-1, 0, 1}, {1, 0, -1}, {-1, 0, -1},
    {0, 1, 1}, {0, -1, 1}, {0, 1, -1}, {0, -1, -1}, {1, 1, 0}, {0, -1, 1}, {-1, 1, 0}, {0, -1, -1}
  };

  static const double SKEW_FACTOR_2D = 0.3660254037844386;
  static const double UNSKEW_FACTOR_2D = 0.21132486540518713;
  static const double F3 = 0.16666666666666666;
  static const double G3 = 0.3333333333333333;
  int permutations[512];
  double originX;
  double originY;
  double originZ;

   SimplexNoiseSampler(Random& rand) {
    originX = rand.nextDouble() * 256.0;
    originY = rand.nextDouble() * 256.0;
    originZ = rand.nextDouble() * 256.0;

    for (int j = 0; j < 256; permutations[j] = j++) { }

    for (int j = 0; j < 256; ++j) {
      int k = rand.nextInt(256 - j);
      int l = permutations[j];
      permutations[j] = permutations[k + j];
      permutations[k + j] = l;
    }
  }

  int getGradient(int hash) {
    return permutations[hash & 255];
  }

  double dot(const int hash, double x, double y, double z) {
    return (double)GRADIENTS[hash][0] * x + (double)GRADIENTS[hash][1] * y + (double)GRADIENTS[hash][2] * z;
  }

  double grad(int hash, double x, double y, double z, double d) {
    double contribution = d - x * x - y * y - z * z;
    double result;
    if (contribution < 0.0) {
      result = 0.0;
    } else {
      contribution *= contribution;
      result = contribution * contribution * dot(hash, x, y, z);
    }

    return result;
  }

  double sample2D(double x, double y) {
    double hairyFactor = (x + y) * SKEW_FACTOR_2D;
    // in minecraft those are the temperatures
    int hairyX = floor(x + hairyFactor);
    int hairyZ = floor(y + hairyFactor);
    double mixedHairyXz = (double)(hairyX + hairyZ) * UNSKEW_FACTOR_2D;
    double diffXToXz = (double)hairyX - mixedHairyXz;
    double diffZToXz = (double)hairyZ - mixedHairyXz;
    double x0 = x - diffXToXz;
    double y0 = y - diffZToXz;
    int offsetSecondCornerX;
    int offsetSecondCornerZ;
    if (x0 > y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      offsetSecondCornerX = 1;
      offsetSecondCornerZ = 0;
    } else { // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      offsetSecondCornerX = 0;
      offsetSecondCornerZ = 1;
    }

    double x1 = x0 - (double)offsetSecondCornerX + UNSKEW_FACTOR_2D;
    double y1 = y0 - (double)offsetSecondCornerZ + UNSKEW_FACTOR_2D;
    double x3 = x0 - 1.0 + 2.0 * UNSKEW_FACTOR_2D;
    double y3 = y0 - 1.0 + 2.0 * UNSKEW_FACTOR_2D;
    int ii = hairyX & 255;
    int jj = hairyZ & 255;
    int gi0 = getGradient(ii + getGradient(jj)) % 12;
    int gi1 = getGradient(ii + offsetSecondCornerX + getGradient(jj + offsetSecondCornerZ)) % 12;
    int gi2 = getGradient(ii + 1 + getGradient(jj + 1)) % 12;
    double t0 = grad(gi0, x0, y0, 0.0, 0.5);
    double t1 = grad(gi1, x1, y1, 0.0, 0.5);
    double t2 = grad(gi2, x3, y3, 0.0, 0.5);
    return 70.0 * (t0 + t1 + t2);
  }

  double sample3D(double x, double y, double z) {
    double skewFactor = (x + y + z) * F3; // F3 is 1/3
    // Skew the input space to determine which simplex cell we're in
    int i = floor(x + skewFactor);
    int j = floor(y + skewFactor);
    int k = floor(z + skewFactor);
    double unskewFactor = (double)(i + j + k) * G3; // G3 is 1/6
    double x0 = (double)i - unskewFactor;
    double y0 = (double)j - unskewFactor;
    double z0 = (double)k - unskewFactor;
    x0 = x - x0;
    y0 = y - y0;
    z0 = z - z0;
    int i1;
    int j1;
    int k1;
    int i2;
    int j2;
    int k2;
    if (x0 >= y0) {
      if (y0 >= z0) { // X Y Z order
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 1;
        k2 = 0;
      } else if (x0 >= z0) { // X Z Y order
        i1 = 1;
        j1 = 0;
        k1 = 0;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      } else { // Z X Y order
        i1 = 0;
        j1 = 0;
        k1 = 1;
        i2 = 1;
        j2 = 0;
        k2 = 1;
      }
    } else if (y0 < z0) { // Z Y X order
      i1 = 0;
      j1 = 0;
      k1 = 1;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else if (x0 < z0) { // Y Z X order
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 0;
      j2 = 1;
      k2 = 1;
    } else { // Y X Z order
      i1 = 0;
      j1 = 1;
      k1 = 0;
      i2 = 1;
      j2 = 1;
      k2 = 0;
    }

    double x1 = x0 - (double)i1 + G3;
    double y1 = y0 - (double)j1 + G3;
    double z1 = z0 - (double)k1 + G3;
    double x2 = x0 - (double)i2 + F3;
    double y2 = y0 - (double)j2 + F3;
    double z2 = z0 - (double)k2 + F3;
    double bj = x0 - 1.0 + 0.5;
    double bk = y0 - 1.0 + 0.5;
    double bl = z0 - 1.0 + 0.5;
    int ii = i & 255;
    int jj = j & 255;
    int kk = k & 255;
    int gi0 = getGradient(ii + getGradient(jj + getGradient(kk))) % 12;
    int gi1 = getGradient(ii + i1 + getGradient(jj + j1 + getGradient(kk + k1))) % 12;
    int gi2 = getGradient(ii + i2 + getGradient(jj + j2 + getGradient(kk + k2))) % 12;
    int gi3 = getGradient(ii + 1 + getGradient(jj + 1 + getGradient(kk + 1))) % 12;
    double t0 = grad(gi0, x0, y0, z0, 0.6);
    double t1 = grad(gi1, x1, y1, z1, 0.6);
    double t2 = grad(gi2, x2, y2, z2, 0.6);
    double t3 = grad(gi3, bj, bk, bl, 0.6);
    return 32.0 * (t0 + t1 + t2 + t3);
  }

  int floor (double d) {
    int i = (int)d;
    return d < (double)i ? i - 1 : i;
  }
};
