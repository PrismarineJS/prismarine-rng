#pragma once

#include "Biomes.h"
#include "Random.h"
#include "Perlin.h"

#include <cstdio>
#include <cstdint>

namespace Layer {

  struct LayerBase {
    LayerBase(int64_t worldSeed, int64_t salt, LayerBase* parent)
      : worldSeed(worldSeed), layerSeed(RandUtils::layerSeed(worldSeed, salt)), parent(parent) {
      for (int i=0; i<1024; i++) keys[i] = -1L;
    }

    virtual ~LayerBase() {}

    void setSeed (int x, int z) {
      localSeed = RandUtils::mixSeed(layerSeed, x);
      localSeed = RandUtils::mixSeed(localSeed, z);
      localSeed = RandUtils::mixSeed(localSeed, x);
      localSeed = RandUtils::mixSeed(localSeed, z);
    }

    int get (int x, int y, int z) {
      int64_t key = uniqueHash(x, y, z);
      int id = murmur64(key) & (1024 - 1);

      if (keys[id] == key) {
        return values[id];
      }

      int value = sample(x, y, z);
      keys[id] = key;
      values[id] = value;
      return value;
    }

    int64_t uniqueHash (int x, int y, int z) {
      int64_t hash = (int64_t)x & ((1L << 26) - 1);
      hash |= ((int64_t)z & ((1L << 26) - 1)) << 26;
      hash |= ((int64_t)y & ((1L << 8) - 1)) << 52;
      return hash;
    }

    int murmur64 (uint64_t value) {
      value ^= value >> 33;
      value *= 0xFF51AFD7ED558CCDL;
      value ^= value >> 33;
      value *= 0xC4CEB9FE1A85EC53L;
      value ^= value >> 33;
      return (int)value;
    }

    virtual int sample(int x, int y, int z) { return 0; }

    int nextInt (int bound) {
      int i = RandUtils::floorMod(localSeed >> 24, bound);
      localSeed = RandUtils::mixSeed(localSeed, layerSeed);
      return i;
    }

    int choose (int a, int b) {
      return nextInt(2) == 0 ? a : b;
    }

    int choose (int a, int b, int c, int d) {
      int i = nextInt(4);
      return i < 2 ? (i == 0 ? a : b) : (i == 2 ? c : d);
    }

    int64_t worldSeed{0L};
    int64_t layerSeed{0L};
    int64_t localSeed{0L};
    LayerBase* parent{nullptr};

    int64_t keys[1024];
    int values[1024];
  };

  struct ContinentLayer : public LayerBase {
    ContinentLayer (int64_t worldSeed, int64_t salt) : LayerBase(worldSeed, salt, nullptr) {}

    int sample (int x, int, int z) override {
      setSeed(x, z);
      if (x == 0 && z == 0) return Biomes::PLAINS.id;
      return nextInt(10) == 0 ? Biomes::PLAINS.id : Biomes::OCEAN.id;
    }
  };

  enum ScaleLayerType { NORMAL=0, FUZZY };

  struct ScaleLayer : public LayerBase {
    ScaleLayer (int64_t worldSeed, int64_t salt, ScaleLayerType type, LayerBase* parent) : LayerBase(worldSeed, salt, parent), type(type) { }

    int sample (int x, int y, int z) override {
      const int i = this->parent->get(x >> 1, y, z >> 1);
      this->setSeed(x & -2, z & -2);
      
      const int xb = x & 1;
      const int zb = z & 1;

      if (xb == 0 && zb == 0) return i;

      const int l = this->parent->get(x >> 1, y, (z + 1) >> 1);
      const int m = this->choose(i, l);

      if (xb == 0) return m;

      const int n = this->parent->get((x + 1) >> 1, y, z >> 1);
      const int o = this->choose(i, n);

      if (zb == 0) return o;

      const int p = this->parent->get((x + 1) >> 1, y, (z + 1) >> 1);
      return xsample(i, n, l, p);
    }

    int xsample (int center, int e, int s, int se) {
      const int ret = this->choose(center, e, s, se);
      if (type == FUZZY) return ret;

      if (e == s && e == se) return e;
      if (center == e && (center == se || s != se)) return center;
      if (center == s && (center == se || e != se)) return center;
      if (center == se && e != s) return center;
      if (e == s && center != se) return e;
      if (e == se && center != s) return e;
      if (s == se && center != e) return s;
      return ret;
    }

    ScaleLayerType type;
  };

  struct CrossLayer : public LayerBase {
    CrossLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      this->setSeed(x, z);
      return xsample(this->parent->get(x, y, z - 1),
                      this->parent->get(x + 1, y, z),
                      this->parent->get(x, y, z + 1),
                      this->parent->get(x - 1, y, z),
                      this->parent->get(x, y, z));
    }

    virtual int xsample(int n, int e, int s, int w, int center) { return 0; }
  };

  struct XCrossLayer : public LayerBase {
    XCrossLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      this->setSeed(x, z);
      return xsample(this->parent->get(x - 1, y, z + 1),
                      this->parent->get(x + 1, y, z + 1),
                      this->parent->get(x + 1, y, z - 1),
                      this->parent->get(x - 1, y, z - 1),
                      this->parent->get(x, y, z));
    }

    virtual int xsample(int sw, int se, int ne, int nw, int center) { return 0; }
  };

  struct LandLayer : public XCrossLayer {
    LandLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : XCrossLayer(worldSeed, salt, parent) { }

    int xsample(int sw, int se, int ne, int nw, int center) override {
      const bool centerSO = Biomes::isShallowOcean(center);
      const bool swSO = Biomes::isShallowOcean(sw);
      const bool seSO = Biomes::isShallowOcean(se);
      const bool neSO = Biomes::isShallowOcean(ne);
      const bool nwSO = Biomes::isShallowOcean(nw);
      if (!centerSO || (swSO && seSO && neSO && nwSO)) {
        if (centerSO || (!swSO && !seSO && !neSO && !nwSO) || nextInt(5) != 0) return center;
        if (nwSO) return center == Biomes::FOREST.id ? Biomes::FOREST.id : nw;
        if (swSO) return center == Biomes::FOREST.id ? Biomes::FOREST.id : sw;
        if (neSO) return center == Biomes::FOREST.id ? Biomes::FOREST.id : ne;
        if (seSO) return center == Biomes::FOREST.id ? Biomes::FOREST.id : se;
        return center;
      }

      int i = 1;
      int j = 1;
      if (!nwSO && nextInt(i++) == 0) j = nw;
      if (!neSO && nextInt(i++) == 0) j = ne;
      if (!swSO && nextInt(i++) == 0) j = sw;
      if (!seSO && nextInt(i) == 0) j = se;

      if (nextInt(3) == 0) return j;
      return j == Biomes::FOREST.id ? Biomes::FOREST.id : center;
    }
  };

  struct IslandLayer : public CrossLayer {
    IslandLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      const bool centerSO = Biomes::isShallowOcean(center);
      const bool nSO = Biomes::isShallowOcean(n);
      const bool eSO = Biomes::isShallowOcean(e);
      const bool sSO = Biomes::isShallowOcean(s);
      const bool wSO = Biomes::isShallowOcean(w);
      return (centerSO && nSO && eSO && sSO && wSO && nextInt(2) == 0) ? Biomes::PLAINS.id : center;
    }
  };

  struct ColdClimateLayer : public LayerBase {
    ColdClimateLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      const int value = this->parent->get(x, y, z);
      if (Biomes::isShallowOcean(value)) return value;
      setSeed(x, z);
      const int i = nextInt(6);
      if (i == 0) return Biomes::FOREST.id;
      return i == 1 ? Biomes::MOUNTAINS.id : Biomes::PLAINS.id;
    }
  };

  struct TemperateClimateLayer : public CrossLayer {
    TemperateClimateLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      return center != Biomes::PLAINS.id || (n != Biomes::MOUNTAINS.id && e != Biomes::MOUNTAINS.id && w != Biomes::MOUNTAINS.id && s != Biomes::MOUNTAINS.id && n != Biomes::FOREST.id && e != Biomes::FOREST.id && w != Biomes::FOREST.id && s != Biomes::FOREST.id) ? center : Biomes::DESERT.id;
    }
  };

  struct CoolClimateLayer : public CrossLayer {
    CoolClimateLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      return center != Biomes::FOREST.id || (n != Biomes::PLAINS.id && e != Biomes::PLAINS.id && w != Biomes::PLAINS.id && s != Biomes::PLAINS.id && n != Biomes::DESERT.id && e != Biomes::DESERT.id && w != Biomes::DESERT.id && s != Biomes::DESERT.id) ? center : Biomes::MOUNTAINS.id;
    }
  };

  struct SpecialClimateLayer : public LayerBase {
    SpecialClimateLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      int i = this->parent->get(x, y, z);

      if (Biomes::isShallowOcean(i)) return i;
      this->setSeed(x, z);

      if (nextInt(13) == 0) {
        i |= (1 + nextInt(15)) << 8;
      }

      return i;
    }
  };

  struct MushroomLayer : public XCrossLayer {
    MushroomLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : XCrossLayer(worldSeed, salt, parent) { }

    int xsample(int sw, int se, int ne, int nw, int center) override {
      const int centerSO = Biomes::isShallowOcean(center);
      const int swSO = Biomes::isShallowOcean(sw);
      const int seSO = Biomes::isShallowOcean(se);
      const int neSO = Biomes::isShallowOcean(ne);
      const int nwSO = Biomes::isShallowOcean(nw);
      return centerSO && swSO && seSO && neSO && nwSO && nextInt(100) == 0 ? Biomes::MUSHROOM_FIELDS.id : center;
    }
  };

  struct DeepOceanLayer : public CrossLayer {
    DeepOceanLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      if (!Biomes::isShallowOcean(center)) return center;

      int i = 0;
      if (Biomes::isShallowOcean(n)) i++;
      if (Biomes::isShallowOcean(e)) i++;
      if (Biomes::isShallowOcean(w)) i++;
      if (Biomes::isShallowOcean(s)) i++;

      if (i > 3) {
        if (center == Biomes::WARM_OCEAN.id) return Biomes::DEEP_WARM_OCEAN.id;
        if (center == Biomes::LUKEWARM_OCEAN.id) return Biomes::DEEP_LUKEWARM_OCEAN.id;
        if (center == Biomes::OCEAN.id) return Biomes::DEEP_OCEAN.id;
        if (center == Biomes::COLD_OCEAN.id) return Biomes::DEEP_COLD_OCEAN.id;
        if (center == Biomes::FROZEN_OCEAN.id) return Biomes::DEEP_FROZEN_OCEAN.id;
        return Biomes::DEEP_OCEAN.id;
      }

      return center;
    }
  };

  struct BaseBiomesLayer : public LayerBase {
    BaseBiomesLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      setSeed(x, z);
      int center = this->parent->get(x, y, z);
      const int specialBits = (center >> 8) & 15; // the nextInt(15) + 1 in ClimateLayer.Special
      center &= ~0xF00; // removes the 4 special bits and keeps everything else

      if (Biomes::isOcean(center) || center == Biomes::MUSHROOM_FIELDS.id) return center;

      if (center == Biomes::PLAINS.id) {
        if (specialBits > 0) {
          return nextInt(3) == 0 ? Biomes::BADLANDS_PLATEAU.id : Biomes::WOODED_BADLANDS_PLATEAU.id;
        }
        const int dryBiomes[6] = {Biomes::DESERT.id, Biomes::DESERT.id, Biomes::DESERT.id, Biomes::SAVANNA.id, Biomes::SAVANNA.id, Biomes::PLAINS.id};
        return dryBiomes[nextInt(6)];
      } else if (center == Biomes::DESERT.id) {
        if (specialBits > 0) {
          return Biomes::JUNGLE.id;
        }
        const int temperateBiomes[6] = {Biomes::FOREST.id, Biomes::DARK_FOREST.id, Biomes::MOUNTAINS.id, Biomes::PLAINS.id, Biomes::BIRCH_FOREST.id, Biomes::SWAMP.id};
        return temperateBiomes[nextInt(6)];
      } else if (center == Biomes::MOUNTAINS.id) {
        if (specialBits > 0) {
          return Biomes::GIANT_TREE_TAIGA.id;
        }
        const int coolBiomes[4] = {Biomes::FOREST.id, Biomes::MOUNTAINS.id, Biomes::TAIGA.id, Biomes::PLAINS.id};
        return coolBiomes[nextInt(4)];
      } else if (center == Biomes::FOREST.id) {
        const int snowyBiomes[4] = {Biomes::SNOWY_TUNDRA.id, Biomes::SNOWY_TUNDRA.id, Biomes::SNOWY_TUNDRA.id, Biomes::SNOWY_TAIGA.id};
        return snowyBiomes[nextInt(4)];
      }

      return Biomes::MUSHROOM_FIELDS.id;
    }
  };

  struct BambooJungleLayer : public LayerBase {
    BambooJungleLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      setSeed(x, z);
      const int value = this->parent->get(x, y, z);
      return value == Biomes::JUNGLE.id && nextInt(10) == 0 ? Biomes::BAMBOO_JUNGLE.id : value;
    }
  };

  struct EaseEdgeLayer : public CrossLayer {
    EaseEdgeLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      int is = 0;
      if (!replaceEdgeIfNeeded(is, n, e, s, w, center, Biomes::MOUNTAINS.id, Biomes::MOUNTAIN_EDGE.id) &&
          replaceEdge(is, n, e, s, w, center, Biomes::WOODED_BADLANDS_PLATEAU.id, Biomes::BADLANDS.id) &&
          replaceEdge(is, n, e, s, w, center, Biomes::BADLANDS_PLATEAU.id, Biomes::BADLANDS.id) &&
          replaceEdge(is, n, e, s, w, center, Biomes::GIANT_TREE_TAIGA.id, Biomes::TAIGA.id)) {
        if (center == Biomes::DESERT.id && someEq(n, e, w, s, Biomes::SNOWY_TUNDRA.id)) {
          return Biomes::WOODED_MOUNTAINS.id;
        } else {
          if (center == Biomes::SWAMP.id) {
            if (someEq(n, e, w, s, Biomes::DESERT.id) || someEq(n, e, w, s, Biomes::SNOWY_TUNDRA.id) || someEq(n, e, w, s, Biomes::SNOWY_TAIGA.id)) {
              return Biomes::PLAINS.id;
            }

            if (someEq(n, e, w, s, Biomes::JUNGLE.id) || someEq(n, e, w, s, Biomes::BAMBOO_JUNGLE.id)) {
              return Biomes::JUNGLE_EDGE.id;
            }
          }

          return center;
        }
      }
      return is;
    }

    bool someEq(int n, int e, int w, int s, int x) {
      return n == x || e == x || w == x || s == x;
    }

    bool replaceEdgeIfNeeded (int& is, int i, int j, int k, int l, int m, int n, int o) {
      if (!Biomes::areSimilar(m, n)) return false;

      if (canBeNeighbors(i, n) && canBeNeighbors(j, n) && canBeNeighbors(l, n) && canBeNeighbors(k, n)) {
        is = m;
      } else {
        is = o;
      }
      return true;
    }

    bool replaceEdge (int& is, int i, int j, int k, int l, int m, int n, int o) {
      if (m != n) return true;

      if (Biomes::areSimilar(i, n) && Biomes::areSimilar(j, n) && Biomes::areSimilar(l, n) && Biomes::areSimilar(k, n)) {
        is = m;
      } else {
        is = o;
      }
      return false;
    }

    bool canBeNeighbors (int id1, int id2) {
      if (Biomes::areSimilar(id1, id2)) return true;

      const Biomes::Biome* b1 = Biomes::byId[id1];
      const Biomes::Biome* b2 = Biomes::byId[id2];

      if (b1 != nullptr && b2 != nullptr) {
        return b1->temperature == b2->temperature || b1->temperature == Biomes::Biome::Temperature::T_MEDIUM || b2->temperature == Biomes::Biome::Temperature::T_MEDIUM;
      }

      return false;
    }
  };

  struct NoiseLayer : public LayerBase {
    NoiseLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }
    int sample (int x, int y, int z) override {
      setSeed(x, z);
      const int i = this->parent->get(x, y, z);
      return Biomes::isShallowOcean(i) ? i : nextInt(299999) + 2;
    }
  };

  struct HillsLayer : public LayerBase {
    HillsLayer (int64_t worldSeed, int64_t salt, LayerBase* biomes, LayerBase* noise) : LayerBase(worldSeed, salt, biomes), noise(noise) { }

    int sample (int x, int y, int z) override {
      setSeed(x, z);
      const int i = this->parent->get(x, y, z); // biomes
      const int j = this->noise->get(x, y, z); // noise (river)

      const int k = (j - 2) % 29;

      if (!Biomes::isShallowOcean(i) && j >= 2 && k == 1) {
        const Biomes::Biome* biome = Biomes::byId[i];
        if (biome == nullptr || biome->parent == nullptr) {
          const Biomes::Biome* biome3 = biome == nullptr ? nullptr : biome->child;
          return biome3 == nullptr ? i : biome3->id;
        }
      }

      if (nextInt(3) == 0 || k == 0) {
        int l = i;
        if (i == Biomes::DESERT.id) {
          l = Biomes::DESERT_HILLS.id;
        } else if (i == Biomes::FOREST.id) {
          l = Biomes::WOODED_HILLS.id;
        } else if (i == Biomes::BIRCH_FOREST.id) {
          l = Biomes::BIRCH_FOREST_HILLS.id;
        } else if (i == Biomes::DARK_FOREST.id) {
          l = Biomes::PLAINS.id;
        } else if (i == Biomes::TAIGA.id) {
          l = Biomes::TAIGA_HILLS.id;
        } else if (i == Biomes::GIANT_TREE_TAIGA.id) {
          l = Biomes::GIANT_TREE_TAIGA_HILLS.id;
        } else if (i == Biomes::SNOWY_TAIGA.id) {
          l = Biomes::SNOWY_TAIGA_HILLS.id;
        } else if (i == Biomes::PLAINS.id) {
          l = nextInt(3) == 0 ? Biomes::WOODED_HILLS.id : Biomes::FOREST.id;
        } else if (i == Biomes::SNOWY_TUNDRA.id) {
          l = Biomes::SNOWY_MOUNTAINS.id;
        } else if (i == Biomes::JUNGLE.id) {
          l = Biomes::JUNGLE_HILLS.id;
        } else if (i == Biomes::BAMBOO_JUNGLE.id) {
          l = Biomes::BAMBOO_JUNGLE_HILLS.id;
        } else if (i == Biomes::OCEAN.id) {
          l = Biomes::DEEP_OCEAN.id;
        } else if (i == Biomes::LUKEWARM_OCEAN.id) {
          l = Biomes::DEEP_LUKEWARM_OCEAN.id;
        } else if (i == Biomes::COLD_OCEAN.id) {
          l = Biomes::DEEP_COLD_OCEAN.id;
        } else if (i == Biomes::FROZEN_OCEAN.id) {
          l = Biomes::DEEP_FROZEN_OCEAN.id;
        } else if (i == Biomes::MOUNTAINS.id) {
          l = Biomes::WOODED_MOUNTAINS.id;
        } else if (i == Biomes::SAVANNA.id) {
          l = Biomes::SAVANNA_PLATEAU.id;
        } else if (Biomes::areSimilar(i, Biomes::WOODED_BADLANDS_PLATEAU.id)) {
          l = Biomes::BADLANDS.id;
        } else if ((i == Biomes::DEEP_OCEAN.id || i == Biomes::DEEP_LUKEWARM_OCEAN.id ||
            i == Biomes::DEEP_COLD_OCEAN.id || i == Biomes::DEEP_FROZEN_OCEAN.id) &&
            nextInt(3) == 0) {
          // in 1.12 this check is only for DEEP_OCEAN but since the other can't spawn, its ok
          l = nextInt(2) == 0 ? Biomes::PLAINS.id : Biomes::FOREST.id;
        }

        if (k == 0 && l != i) {
          const Biomes::Biome* biome = Biomes::byId[l];
          l = (biome != nullptr && biome->child != nullptr) ? biome->child->id : i;
        }

        if (l != i) {
          int m = 0;
          if (Biomes::areSimilar(this->parent->get(x, y, z - 1), i)) m++;
          if (Biomes::areSimilar(this->parent->get(x + 1, y, z), i)) m++;
          if (Biomes::areSimilar(this->parent->get(x - 1, y, z), i)) m++;
          if (Biomes::areSimilar(this->parent->get(x, y, z + 1), i)) m++;
          if (m >= 3) return l;
        }
      }
      return i;
    }

    LayerBase* noise;
  };

  struct SunflowerPlainsLayer : public LayerBase {
    SunflowerPlainsLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : LayerBase(worldSeed, salt, parent) { }

    int sample (int x, int y, int z) override {
      setSeed(x, z);
      const int value = this->parent->get(x, y, z);
      return value == Biomes::PLAINS.id && nextInt(57) == 0 ? Biomes::SUNFLOWER_PLAINS.id : value;
    }
  };

  struct EdgeBiomesLayer : public CrossLayer {
    EdgeBiomesLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      const Biomes::Biome* biome = Biomes::byId[center];

      if (center == Biomes::MUSHROOM_FIELDS.id) {
        if (everyNotShallowOcean(n, e, s, w)) return center;
        return Biomes::MUSHROOM_FIELD_SHORE.id;
      } else if (biome != nullptr && biome->category == Biomes::Biome::Category::JUNGLE) {
        if (!everyIsWooded(n, e, s, w)) return Biomes::JUNGLE_EDGE.id;
        if (everyNotOcean(n, e, s, w)) return center;
        return Biomes::BEACH.id;
      } else if (center != Biomes::MOUNTAINS.id && center != Biomes::WOODED_MOUNTAINS.id && center != Biomes::MOUNTAIN_EDGE.id) {
        if (biome != nullptr && biome->precipitation == Biomes::Biome::Precipitation::P_SNOW) {
          if (!Biomes::isOcean(center) && !everyNotOcean(n, e, s, w)) {
            return Biomes::SNOWY_BEACH.id;
          }
        } else if (center != Biomes::BADLANDS.id && center != Biomes::WOODED_BADLANDS_PLATEAU.id) {
          if (!Biomes::isOcean(center) && center != Biomes::RIVER.id && center != Biomes::SWAMP.id && !everyNotOcean(n, e, s, w)) {
            return Biomes::BEACH.id;
          }
        } else if (everyNotOcean(n, e, s, w) && !everyIsBadlands(n, e, s, w)) {
          return Biomes::DESERT.id;
        }
      } else if (!Biomes::isOcean(center) && !everyNotOcean(n, e, s, w)) {
        return Biomes::STONE_SHORE.id;
      }
      return center;
    }

    bool isWooded(int id) {
      const Biomes::Biome* b = Biomes::byId[id];
      if (b != nullptr && b->category == Biomes::Biome::Category::JUNGLE) return true;
      return id == Biomes::JUNGLE_EDGE.id || id == Biomes::JUNGLE.id || id == Biomes::JUNGLE_HILLS.id || id == Biomes::FOREST.id || id == Biomes::TAIGA.id || Biomes::isOcean(id);
    }

    bool everyIsWooded(int n, int e, int s, int w) {
      return isWooded(n) && isWooded(e) && isWooded(s) && isWooded(w);
    }

    bool isBadlands (int id) {
      return id == Biomes::BADLANDS.id || id == Biomes::WOODED_BADLANDS_PLATEAU.id || id == Biomes::BADLANDS_PLATEAU.id || id == Biomes::ERODED_BADLANDS.id || id == Biomes::MODIFIED_WOODED_BADLANDS_PLATEAU.id || id == Biomes::MODIFIED_BADLANDS_PLATEAU.id;
    }

    bool everyIsBadlands(int n, int e, int s, int w) {
      return isBadlands(n) && isBadlands(e) && isBadlands(s) && isBadlands(w);
    }

    bool everyNotShallowOcean(int n, int e, int s, int w) {
      return !Biomes::isShallowOcean(n) && !Biomes::isShallowOcean(e) && !Biomes::isShallowOcean(s) && !Biomes::isShallowOcean(w);
    }

    bool everyNotOcean(int n, int e, int s, int w) {
      return !Biomes::isOcean(n) && !Biomes::isOcean(e) && !Biomes::isOcean(s) && !Biomes::isOcean(w);
    }
  };

  struct SmoothScaleLayer : public CrossLayer {
    SmoothScaleLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      const bool xMatches = e == w;
      const bool zMatches = n == s;

      if (xMatches && zMatches) {
        return choose(w, n);
      } else if (!xMatches && !zMatches) {
        return center;
      } else if (xMatches) {
        return w;
      }
      return n;
    }
  };

  struct NoiseToRiverLayer : public CrossLayer {
    NoiseToRiverLayer (int64_t worldSeed, int64_t salt, LayerBase* parent) : CrossLayer(worldSeed, salt, parent) { }

    int xsample(int n, int e, int s, int w, int center) override {
      const int i = isValidForRiver(center);
      return i == isValidForRiver(w) && i == isValidForRiver(n) && i == isValidForRiver(e) && i == isValidForRiver(s) ? -1 : Biomes::RIVER.id;
    }

    int isValidForRiver (int value) {
      return value >= 2 ? 2 + (value & 1) : value;
    }
  };

  struct RiverLayer : public LayerBase {
    RiverLayer (int64_t worldSeed, int64_t salt, LayerBase* biomes, LayerBase* noise) : LayerBase(worldSeed, salt, biomes), noise(noise) { }

    int sample (int x, int y, int z) override {
      const int landStackCenter = this->parent->get(x, y, z);
      const int noiseStackCenter = this->noise->get(x, y, z);

      if (Biomes::isOcean(landStackCenter)) return landStackCenter;

      if (noiseStackCenter == Biomes::RIVER.id) {
        if (landStackCenter == Biomes::SNOWY_TUNDRA.id) {
          return Biomes::FROZEN_RIVER.id;
        } else {
          return landStackCenter != Biomes::MUSHROOM_FIELDS.id && landStackCenter != Biomes::MUSHROOM_FIELD_SHORE.id ? noiseStackCenter & 255 : Biomes::MUSHROOM_FIELD_SHORE.id;
        }
      }
      return landStackCenter;
    }

    LayerBase* noise;
  };

  struct OceanTemperatureLayer : public LayerBase {
    OceanTemperatureLayer (int64_t worldSeed, int64_t salt) : LayerBase(worldSeed, salt, nullptr), perlin(Random{worldSeed}){ }

    int sample (int x, int y, int z) override {
      const double normalizedNoise = perlin.sample((double)x / 8.0, (double)z / 8.0, 0, 0, 0);
      if (normalizedNoise > 0.4) {
        return Biomes::WARM_OCEAN.id;
      } else if (normalizedNoise > 0.2) {
        return Biomes::LUKEWARM_OCEAN.id;
      } else if (normalizedNoise < -0.4) {
        return Biomes::FROZEN_OCEAN.id;
      } else if (normalizedNoise < -0.2) {
        return Biomes::COLD_OCEAN.id;
      }
      return Biomes::OCEAN.id;
    }

    PerlinNoiseSampler perlin;
  };

  struct ApplyOceanTemperatureLayer : public LayerBase {
    ApplyOceanTemperatureLayer (int64_t worldSeed, int64_t salt, LayerBase* parent, LayerBase* ocean) : LayerBase(worldSeed, salt, parent), ocean(ocean) { }

    int sample (int x, int y, int z) override {
      const int fullStackCenter = this->parent->get(x, y, z);
      if (!Biomes::isOcean(fullStackCenter)) return fullStackCenter;

      const int oceanStackCenter = this->ocean->get(x, y, z);
      for (int rx = -8; rx <= 8; rx += 4) {
        for (int rz = -8; rz <= 8; rz += 4) {
          const int shiftedXZ = this->parent->get(x + rx, y, z + rz);
          if (Biomes::isOcean(shiftedXZ)) continue;

          if (oceanStackCenter == Biomes::WARM_OCEAN.id) {
            return Biomes::LUKEWARM_OCEAN.id;
          } else if (oceanStackCenter == Biomes::FROZEN_OCEAN.id) {
            return Biomes::COLD_OCEAN.id;
          }
        }
      }

      if (fullStackCenter != Biomes::DEEP_OCEAN.id) return oceanStackCenter;

      if (oceanStackCenter == Biomes::LUKEWARM_OCEAN.id) {
        return Biomes::DEEP_LUKEWARM_OCEAN.id;
      } else if (oceanStackCenter == Biomes::OCEAN.id) {
        return Biomes::DEEP_OCEAN.id;
      } else if (oceanStackCenter == Biomes::COLD_OCEAN.id) {
        return Biomes::DEEP_COLD_OCEAN.id;
      } else if (oceanStackCenter == Biomes::FROZEN_OCEAN.id) {
        return Biomes::DEEP_FROZEN_OCEAN.id;
      }

      return oceanStackCenter;
    }

    LayerBase* ocean;
  };

  struct VoronoiLayer : public LayerBase {

    int version;
    int64_t seed;
    bool is3D;

    VoronoiLayer(int version, int64_t worldSeed, bool is3D, LayerBase* parent)
      : LayerBase(worldSeed, version >= MC::v1_15 ? 0 : 10, parent), version(version), seed(version >= MC::v1_15 ? RandUtils::hashWorldSeed(worldSeed) : worldSeed), is3D(is3D) { }

    int sample(int x, int y, int z) override {
      return version >= MC::v1_15 ? sample15plus(x, y, z) : sample14minus(x, z);
    }

    int sample14minus(int x, int z) {
      int offset;
      x -= 2;
      z -= 2;
      int pX = x >> 2;
      int pZ = z >> 2;
      int sX = pX << 2;
      int sZ = pZ << 2;
      double off_0_0[2];
      calcOffset(this->layerSeed, sX, sZ, 0, 0, off_0_0);
      double off_1_0[2];
      calcOffset(this->layerSeed, sX, sZ, 4, 0, off_1_0);
      double off_0_1[2];
      calcOffset(this->layerSeed, sX, sZ, 0, 4, off_0_1);
      double off_1_1[2];
      calcOffset(this->layerSeed, sX, sZ, 4, 4, off_1_1);

      int cell = (z & 3) * 4 + (x & 3);
      double corner0 = calcContribution(off_0_0, cell >> 2, cell & 3);
      double corner1 = calcContribution(off_1_0, cell >> 2, cell & 3);
      double corner2 = calcContribution(off_0_1, cell >> 2, cell & 3);
      double corner3 = calcContribution(off_1_1, cell >> 2, cell & 3);
      if (corner0 < corner1 && corner0 < corner2 && corner0 < corner3) {
        offset = 0;
      } else if (corner1 < corner0 && corner1 < corner2 && corner1 < corner3) {
        offset = 1;
      } else if (corner2 < corner0 && corner2 < corner1 && corner2 < corner3) {
        offset = 2;
      } else {
        offset = 3;
      }


      //  X -> (offset&1)
      // _________
      // | 0 | 1 |   Z (offset>>1)
      // |---|---|   |
      // | 2 | 3 |  \_/
      // |___|___|

      return this->parent->get(pX + (offset & 1), 0, pZ + (offset >> 1));
    }

    int sample15plus(int x, int y, int z) {
      int i = x - 2;
      int j = y - 2;
      int k = z - 2;
      int l = i >> 2;
      int m = j >> 2;
      int n = k >> 2;
      double d = (double)(i & 3) / 4.0;
      double e = (double)(j & 3) / 4.0;
      double f = (double)(k & 3) / 4.0;
      double ds[8];

      for (int cell = 0; cell < 8; ++cell) {
          bool bl = (cell & 4) == 0;
          bool bl2 = (cell & 2) == 0;
          bool bl3 = (cell & 1) == 0;
          int aa = bl ? l : l + 1;
          int ab = bl2 ? m : m + 1;
          int ac = bl3 ? n : n + 1;
          double g = bl ? d : d - 1.0;
          double h = bl2 ? e : e - 1.0;
          double s = bl3 ? f : f - 1.0;
          ds[cell] = calcSquaredDistance(this->seed, aa, ab, ac, g, h, s);
      }

      int index = 0;
      double min = ds[0];

      for(int cell = 1; cell < 8; ++cell) {
          if (ds[cell] >= min) continue;
          index = cell;
          min = ds[cell];
      }

      int xFinal = (index & 4) == 0 ? l : l + 1;
      int yFinal = (index & 2) == 0 ? m : m + 1;
      int zFinal = (index & 1) == 0 ? n : n + 1;
      return this->parent->get(xFinal, is3D ? yFinal : 0, zFinal);
    }

    double calcContribution(double d[2], int x, int z) {
      return ((double) x - d[1]) * ((double) x - d[1]) + ((double) z - d[0]) * ((double) z - d[0]);
    }

    void calcOffset(int64_t layerSeed, int x, int z, int offX, int offZ, double d[2]) {
      int64_t mixedSeed = RandUtils::mixSeed(layerSeed, x + offX);
      mixedSeed = RandUtils::mixSeed(mixedSeed, z + offZ);
      mixedSeed = RandUtils::mixSeed(mixedSeed, x + offX);
      mixedSeed = RandUtils::mixSeed(mixedSeed, z + offZ);
      d[0] = (((double) ((int) RandUtils::floorMod(mixedSeed >> 24, 1024L)) / 1024.0) - 0.5) * 3.6 + offX;
      mixedSeed = RandUtils::mixSeed(mixedSeed, layerSeed);
      d[1] = (((double) ((int) RandUtils::floorMod(mixedSeed >> 24, 1024L)) / 1024.0) - 0.5) * 3.6 + offZ;
    }

    double calcSquaredDistance(int64_t seed, int x, int y, int z, double xFraction, double yFraction, double zFraction) {
      int64_t mixedSeed = RandUtils::mixSeed(seed, x);
      mixedSeed = RandUtils::mixSeed(mixedSeed, y);
      mixedSeed = RandUtils::mixSeed(mixedSeed, z);
      mixedSeed = RandUtils::mixSeed(mixedSeed, x);
      mixedSeed = RandUtils::mixSeed(mixedSeed, y);
      mixedSeed = RandUtils::mixSeed(mixedSeed, z);
      double d = xFraction + distribute(mixedSeed);
      mixedSeed = RandUtils::mixSeed(mixedSeed, seed);
      double e = yFraction + distribute(mixedSeed);
      mixedSeed = RandUtils::mixSeed(mixedSeed, seed);
      double f = zFraction + distribute(mixedSeed);
      return f * f + e * e + d * d;
    }

    double distribute(int64_t seed) {
      double d = (double) ((int) RandUtils::floorMod(seed >> 24, 1024L)) / 1024.0;
      return (d - 0.5) * 0.9;
    }
  };
}