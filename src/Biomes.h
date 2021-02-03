#pragma once

namespace MC {
  enum Version {
    v1_8 = 0,
    v1_9 = 169,
    v1_10 = 510,
    v1_11 = 819,
    v1_12 = 1139,
    v1_13 = 1519,
    v1_14 = 1952,
    v1_15 = 2225,
    v1_16 = 2566
  };
}

namespace Biomes {
  enum Dimension { OVERWORLD, NETHER, END };
  
  struct Biome;
  Biome* byId[174] = { nullptr };

  struct Biome {
    enum Category {
      NONE, TAIGA, EXTREME_HILLS,
      JUNGLE, MESA, PLAINS, SAVANNA,
      ICY, THE_END, BEACH, FOREST,
      OCEAN, DESERT, RIVER, SWAMP,
      MUSHROOM, NETHER
    };
    enum Temperature { T_OCEAN, T_COLD, T_MEDIUM, T_WARM };
    enum Precipitation { P_NONE, P_RAIN, P_SNOW };
    Biome(const MC::Version v, const Dimension dim, const int id, const char*,
          const Category cat, const Precipitation pre, float temp, float scale,
          float depth, Biome* parent)
    : version(v), dimension(dim), id(id), category(cat), precipitation(pre), parent(parent), scale(scale), depth(depth) {
      byId[id] = this;

      if (category == Category::OCEAN) {
        temperature = Temperature::T_OCEAN;
      } else if (temp < 0.2f) {
        temperature = Temperature::T_COLD;
      } else if (temp < 1.f) {
        temperature = Temperature::T_MEDIUM;
      } else {
        temperature = Temperature::T_WARM;
      }

      if (parent != nullptr) parent->child = this;
    }

    const MC::Version version;
    const Dimension dimension;
    const int id;
    const Category category;
    Precipitation precipitation;
    Temperature temperature;
    Biome* parent;
    Biome* child{nullptr};
    float scale;
    float depth;
  };

  Biome OCEAN{MC::Version::v1_8, Dimension::OVERWORLD, 0, "ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.000F, nullptr};
  Biome PLAINS{MC::Version::v1_8, Dimension::OVERWORLD, 1, "plains", Biome::Category::PLAINS, Biome::Precipitation::P_RAIN, 0.8F, 0.050F, 0.125F, nullptr};
  Biome DESERT{MC::Version::v1_8, Dimension::OVERWORLD, 2, "desert", Biome::Category::DESERT, Biome::Precipitation::P_NONE, 2.0F, 0.050F, 0.125F, nullptr};
  Biome MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 3, "mountains", Biome::Category::EXTREME_HILLS, Biome::Precipitation::P_RAIN, 0.2F, 0.500F, 1.000F, nullptr};
  Biome FOREST{MC::Version::v1_8, Dimension::OVERWORLD, 4, "forest", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.7F, 0.200F, 0.100F, nullptr};
  Biome TAIGA{MC::Version::v1_8, Dimension::OVERWORLD, 5, "taiga", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.25F, 0.200F, 0.200F, nullptr};
  Biome SWAMP{MC::Version::v1_8, Dimension::OVERWORLD, 6, "swamp", Biome::Category::SWAMP, Biome::Precipitation::P_RAIN, 0.8F, 0.100F, -0.200F, nullptr};
  Biome RIVER{MC::Version::v1_8, Dimension::OVERWORLD, 7, "river", Biome::Category::RIVER, Biome::Precipitation::P_RAIN, 0.5F, 0.000F, -0.500F, nullptr};
  Biome NETHER_WASTES{MC::Version::v1_8, Dimension::NETHER, 8, "nether_wastes", Biome::Category::NETHER, Biome::Precipitation::P_NONE, 2.0F, 0.200F, 0.100F, nullptr};
  Biome THE_END{MC::Version::v1_8, Dimension::END, 9, "the_end", Biome::Category::THE_END, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome FROZEN_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 10, "frozen_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_SNOW, 0.0F, 0.100F, -1.000F, nullptr};
  Biome FROZEN_RIVER{MC::Version::v1_8, Dimension::OVERWORLD, 11, "frozen_river", Biome::Category::RIVER, Biome::Precipitation::P_SNOW, 0.0F, 0.000F, -0.500F, nullptr};
  Biome SNOWY_TUNDRA{MC::Version::v1_8, Dimension::OVERWORLD, 12, "snowy_tundra", Biome::Category::ICY, Biome::Precipitation::P_SNOW, 0.0F, 0.050F, 0.125F, nullptr};
  Biome SNOWY_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 13, "snowy_mountains", Biome::Category::ICY, Biome::Precipitation::P_SNOW, 0.0F, 0.300F, 0.450F, nullptr};
  Biome MUSHROOM_FIELDS{MC::Version::v1_8, Dimension::OVERWORLD, 14, "mushroom_fields", Biome::Category::MUSHROOM, Biome::Precipitation::P_RAIN, 0.9F, 0.300F, 0.200F, nullptr};
  Biome MUSHROOM_FIELD_SHORE{MC::Version::v1_8, Dimension::OVERWORLD, 15, "mushroom_field_shore", Biome::Category::MUSHROOM, Biome::Precipitation::P_RAIN, 0.9F, 0.025F, 0.000F, nullptr};
  Biome BEACH{MC::Version::v1_8, Dimension::OVERWORLD, 16, "beach", Biome::Category::BEACH, Biome::Precipitation::P_RAIN, 0.8F, 0.025F, 0.000F, nullptr};
  Biome DESERT_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 17, "desert_hills", Biome::Category::DESERT, Biome::Precipitation::P_NONE, 2.0F, 0.300F, 0.450F, nullptr};
  Biome WOODED_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 18, "wooded_hills", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.7F, 0.300F, 0.450F, nullptr};
  Biome TAIGA_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 19, "taiga_hills", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.25F, 0.300F, 0.450F, nullptr};
  Biome MOUNTAIN_EDGE{MC::Version::v1_8, Dimension::OVERWORLD, 20, "mountain_edge", Biome::Category::EXTREME_HILLS, Biome::Precipitation::P_RAIN, 0.2F, 0.300F, 0.800F, nullptr};
  Biome JUNGLE{MC::Version::v1_8, Dimension::OVERWORLD, 21, "jungle", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.200F, 0.100F, nullptr};
  Biome JUNGLE_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 22, "jungle_hills", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.300F, 0.450F, nullptr};
  Biome JUNGLE_EDGE{MC::Version::v1_8, Dimension::OVERWORLD, 23, "jungle_edge", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.200F, 0.100F, nullptr};
  Biome DEEP_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 24, "deep_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.800F, nullptr};
  Biome STONE_SHORE{MC::Version::v1_8, Dimension::OVERWORLD, 25, "stone_shore", Biome::Category::NONE, Biome::Precipitation::P_RAIN, 0.2F, 0.800F, 0.100F, nullptr};
  Biome SNOWY_BEACH{MC::Version::v1_8, Dimension::OVERWORLD, 26, "snowy_beach", Biome::Category::BEACH, Biome::Precipitation::P_SNOW, 0.05F, 0.025F, 0.000F, nullptr};
  Biome BIRCH_FOREST{MC::Version::v1_8, Dimension::OVERWORLD, 27, "birch_forest", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.6F, 0.200F, 0.100F, nullptr};
  Biome BIRCH_FOREST_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 28, "birch_forest_hills", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.6F, 0.300F, 0.450F, nullptr};
  Biome DARK_FOREST{MC::Version::v1_8, Dimension::OVERWORLD, 29, "dark_forest", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.7F, 0.200F, 0.100F, nullptr};
  Biome SNOWY_TAIGA{MC::Version::v1_8, Dimension::OVERWORLD, 30, "snowy_taiga", Biome::Category::TAIGA, Biome::Precipitation::P_SNOW, -0.5F, 0.200F, 0.200F, nullptr};
  Biome SNOWY_TAIGA_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 31, "snowy_taiga_hills", Biome::Category::TAIGA, Biome::Precipitation::P_SNOW, -0.5F, 0.300F, 0.450F, nullptr};
  Biome GIANT_TREE_TAIGA{MC::Version::v1_8, Dimension::OVERWORLD, 32, "giant_tree_taiga", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.3F, 0.200F, 0.200F, nullptr};
  Biome GIANT_TREE_TAIGA_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 33, "giant_tree_taiga_hills", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.3F, 0.300F, 0.450F, nullptr};
  Biome WOODED_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 34, "wooded_mountains", Biome::Category::EXTREME_HILLS, Biome::Precipitation::P_RAIN, 0.2F, 0.500F, 1.000F, nullptr};
  Biome SAVANNA{MC::Version::v1_8, Dimension::OVERWORLD, 35, "savanna", Biome::Category::SAVANNA, Biome::Precipitation::P_NONE, 1.2F, 0.050F, 0.125F, nullptr};
  Biome SAVANNA_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 36, "savanna_plateau", Biome::Category::SAVANNA, Biome::Precipitation::P_NONE, 1.0F, 0.025F, 1.500F, nullptr};
  Biome BADLANDS{MC::Version::v1_8, Dimension::OVERWORLD, 37, "badlands", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.200F, 0.100F, nullptr};
  Biome WOODED_BADLANDS_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 38, "wooded_badlands_plateau", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.025F, 1.500F, nullptr};
  Biome BADLANDS_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 39, "badlands_plateau", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.025F, 1.500F, nullptr};
  Biome SMALL_END_ISLANDS{MC::Version::v1_13, Dimension::END, 40, "small_end_islands", Biome::Category::THE_END, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome END_MIDLANDS{MC::Version::v1_13, Dimension::END, 41, "end_midlands", Biome::Category::THE_END, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome END_HIGHLANDS{MC::Version::v1_13, Dimension::END, 42, "end_highlands", Biome::Category::THE_END, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome END_BARRENS{MC::Version::v1_13, Dimension::END, 43, "end_barrens", Biome::Category::THE_END, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome WARM_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 44, "warm_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.000F, nullptr};
  Biome LUKEWARM_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 45, "lukewarm_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.000F, nullptr};
  Biome COLD_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 46, "cold_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.000F, nullptr};
  Biome DEEP_WARM_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 47, "deep_warm_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.800F, nullptr};
  Biome DEEP_LUKEWARM_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 48, "deep_lukewarm_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.800F, nullptr};
  Biome DEEP_COLD_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 49, "deep_cold_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.800F, nullptr};
  Biome DEEP_FROZEN_OCEAN{MC::Version::v1_13, Dimension::OVERWORLD, 50, "deep_frozen_ocean", Biome::Category::OCEAN, Biome::Precipitation::P_RAIN, 0.5F, 0.100F, -1.800F, nullptr};
  Biome THE_VOID{MC::Version::v1_8, Dimension::END, 127, "the_void", Biome::Category::NONE, Biome::Precipitation::P_NONE, 0.5F, 0.200F, 0.100F, nullptr};
  Biome SUNFLOWER_PLAINS{MC::Version::v1_8, Dimension::OVERWORLD, 129, "sunflower_plains", Biome::Category::PLAINS, Biome::Precipitation::P_RAIN, 0.8F, 0.050F, 0.125F, &PLAINS};
  Biome DESERT_LAKES{MC::Version::v1_8, Dimension::OVERWORLD, 130, "desert_lakes", Biome::Category::DESERT, Biome::Precipitation::P_NONE, 2.0F, 0.250F, 0.225F, &DESERT};
  Biome GRAVELLY_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 131, "gravelly_mountains", Biome::Category::EXTREME_HILLS, Biome::Precipitation::P_RAIN, 0.2F, 0.500F, 1.000F, &MOUNTAINS};
  Biome FLOWER_FOREST{MC::Version::v1_8, Dimension::OVERWORLD, 132, "flower_forest", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.7F, 0.400F, 0.100F, &FOREST};
  Biome TAIGA_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 133, "taiga_mountains", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.25F, 0.400F, 0.300F, &TAIGA};
  Biome SWAMP_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 134, "swamp_hills", Biome::Category::SWAMP, Biome::Precipitation::P_RAIN, 0.8F, 0.300F, -0.100F, &SWAMP};
  Biome ICE_SPIKES{MC::Version::v1_8, Dimension::OVERWORLD, 140, "ice_spikes", Biome::Category::ICY, Biome::Precipitation::P_SNOW, 0.0F, 0.450F, 0.425F, &SNOWY_TUNDRA};
  Biome MODIFIED_JUNGLE{MC::Version::v1_8, Dimension::OVERWORLD, 149, "modified_jungle", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.400F, 0.200F, &JUNGLE};
  Biome MODIFIED_JUNGLE_EDGE{MC::Version::v1_8, Dimension::OVERWORLD, 151, "modified_jungle_edge", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.400F, 0.200F, &JUNGLE_EDGE};
  Biome TALL_BIRCH_FOREST{MC::Version::v1_8, Dimension::OVERWORLD, 155, "tall_birch_forest", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.6F, 0.400F, 0.200F, &BIRCH_FOREST};
  Biome TALL_BIRCH_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 156, "tall_birch_hills", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.6F, 0.500F, 0.550F, &BIRCH_FOREST_HILLS};
  Biome DARK_FOREST_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 157, "dark_forest_hills", Biome::Category::FOREST, Biome::Precipitation::P_RAIN, 0.7F, 0.400F, 0.200F, &DARK_FOREST};
  Biome SNOWY_TAIGA_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 158, "snowy_taiga_mountains", Biome::Category::TAIGA, Biome::Precipitation::P_SNOW, -0.5F, 0.400F, 0.300F, &SNOWY_TAIGA};
  Biome GIANT_SPRUCE_TAIGA{MC::Version::v1_8, Dimension::OVERWORLD, 160, "giant_spruce_taiga", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.25F, 0.200F, 0.200F, &GIANT_TREE_TAIGA};
  Biome GIANT_SPRUCE_TAIGA_HILLS{MC::Version::v1_8, Dimension::OVERWORLD, 161, "giant_spruce_taiga_hills", Biome::Category::TAIGA, Biome::Precipitation::P_RAIN, 0.25F, 0.200F, 0.200F, &GIANT_TREE_TAIGA_HILLS};
  Biome MODIFIED_GRAVELLY_MOUNTAINS{MC::Version::v1_8, Dimension::OVERWORLD, 162, "modified_gravelly_mountains", Biome::Category::EXTREME_HILLS, Biome::Precipitation::P_RAIN, 0.2F, 0.500F, 1.000F, &WOODED_MOUNTAINS};
  Biome SHATTERED_SAVANNA{MC::Version::v1_8, Dimension::OVERWORLD, 163, "shattered_savanna", Biome::Category::SAVANNA, Biome::Precipitation::P_NONE, 1.1F, 1.225F, 0.362F, &SAVANNA};
  Biome SHATTERED_SAVANNA_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 164, "shattered_savanna_plateau", Biome::Category::SAVANNA, Biome::Precipitation::P_NONE, 1.0F, 1.212F, 1.050F, &SAVANNA_PLATEAU};
  Biome ERODED_BADLANDS{MC::Version::v1_8, Dimension::OVERWORLD, 165, "eroded_badlands", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.200F, 0.100F, &BADLANDS};
  Biome MODIFIED_WOODED_BADLANDS_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 166, "modified_wooded_badlands_plateau", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.300F, 0.450F, &WOODED_BADLANDS_PLATEAU};
  Biome MODIFIED_BADLANDS_PLATEAU{MC::Version::v1_8, Dimension::OVERWORLD, 167, "modified_badlands_plateau", Biome::Category::MESA, Biome::Precipitation::P_NONE, 2.0F, 0.300F, 0.450F, &BADLANDS_PLATEAU};
  Biome BAMBOO_JUNGLE{MC::Version::v1_14, Dimension::OVERWORLD, 168, "bamboo_jungle", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.200F, 0.100F, nullptr};
  Biome BAMBOO_JUNGLE_HILLS{MC::Version::v1_14, Dimension::OVERWORLD, 169, "bamboo_jungle_hills", Biome::Category::JUNGLE, Biome::Precipitation::P_RAIN, 0.95F, 0.300F, 0.450F, nullptr};
  Biome SOUL_SAND_VALLEY{MC::Version::v1_16, Dimension::NETHER, 170, "soul_sand_valley", Biome::Category::NETHER, Biome::Precipitation::P_NONE, 2.0F, 0.F, 0.F, nullptr};
  Biome CRIMSON_FOREST{MC::Version::v1_16, Dimension::NETHER, 171, "crimson_forest", Biome::Category::NETHER, Biome::Precipitation::P_NONE, 2.0F, 0.F, 0.F, nullptr};
  Biome WARPED_FOREST{MC::Version::v1_16, Dimension::NETHER, 172, "warped_forest", Biome::Category::NETHER, Biome::Precipitation::P_NONE, 2.0F, 0.F, 0.F, nullptr};
  Biome BASALT_DELTAS{MC::Version::v1_16, Dimension::NETHER, 173, "basalt_deltas", Biome::Category::NETHER, Biome::Precipitation::P_NONE, 2.0F, 0.F, 0.F, nullptr};

  bool isShallowOcean (int id) {
    return id == WARM_OCEAN.id || id == LUKEWARM_OCEAN.id || id == OCEAN.id ||
           id == COLD_OCEAN.id || id == FROZEN_OCEAN.id;
  }

  bool isOcean (int id) {
    return id == WARM_OCEAN.id || id == LUKEWARM_OCEAN.id || id == OCEAN.id ||
           id == COLD_OCEAN.id || id == FROZEN_OCEAN.id ||
           id == DEEP_WARM_OCEAN.id || id == DEEP_LUKEWARM_OCEAN.id ||
           id == DEEP_OCEAN.id || id == DEEP_COLD_OCEAN.id ||
           id == DEEP_FROZEN_OCEAN.id;
  }

  bool isRiver (int id) {
    return id == RIVER.id || id == FROZEN_RIVER.id;
  }

  bool areSimilar (int id1, int id2) {
    Biome* b2 = byId[id2];
    if (b2 == nullptr) return false;

    if (id1 == id2) return true;

    Biome* b1 = byId[id1];
    if (b1 == nullptr) return false;

    if (id1 != WOODED_BADLANDS_PLATEAU.id && id1 != BADLANDS_PLATEAU.id) {
      if (b1->category != Biome::Category::NONE && b2->category != Biome::Category::NONE && b1->category == b2->category) {
        return true;
      }
      return id1 == id2;
    }

    return id2 == WOODED_BADLANDS_PLATEAU.id || id2 == BADLANDS_PLATEAU.id;
  }
}