#pragma once

#include <cstdint>
#include "Layers.h"

class OverworldBiomeProvider {
public:
  OverworldBiomeProvider(int dataVersion, uint32_t worldSeedHi, uint32_t worldSeedLo) : worldSeed((((int64_t)worldSeedHi) << 32) + worldSeedLo) {
    const int biomeSize = 4;
    int scale = 0;
    // 4096
    base = REGISTER(new Layer::ContinentLayer(worldSeed, 1));
    // 2048
    base = REGISTER(new Layer::ScaleLayer(worldSeed, 2000, Layer::ScaleLayerType::FUZZY, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 1, base));
    // 1024
    base = REGISTER(new Layer::ScaleLayer(worldSeed, 2001, Layer::ScaleLayerType::NORMAL, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 2, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 50, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 70, base));
    base = REGISTER(new Layer::IslandLayer(worldSeed, 2, base));
    base = REGISTER(new Layer::ColdClimateLayer(worldSeed, 2, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 3, base));
    base = REGISTER(new Layer::TemperateClimateLayer(worldSeed, 2, base));
    base = REGISTER(new Layer::CoolClimateLayer(worldSeed, 2, base));
    base = REGISTER(new Layer::SpecialClimateLayer(worldSeed, 3, base));
    // 512
    scales[scale++] = base;
    base = REGISTER(new Layer::ScaleLayer(worldSeed, 2002, Layer::ScaleLayerType::NORMAL, base));
    // 256
    scales[scale++] = base;
    base = REGISTER(new Layer::ScaleLayer(worldSeed, 2003, Layer::ScaleLayerType::NORMAL, base));
    base = REGISTER(new Layer::LandLayer(worldSeed, 4, base));
    base = REGISTER(new Layer::MushroomLayer(worldSeed, 5, base));
    base = REGISTER(new Layer::DeepOceanLayer(worldSeed, 4, base));

    // new biomes chain
    biomes = REGISTER(new Layer::BaseBiomesLayer(worldSeed, 200, base));
    if (dataVersion >= MC::Version::v1_14) {
      biomes = REGISTER(new Layer::BambooJungleLayer(worldSeed, 1001, biomes));
    }
    // 128
    scales[scale++] = biomes;
    biomes = REGISTER(new Layer::ScaleLayer(worldSeed, 1000, Layer::ScaleLayerType::NORMAL, biomes));
    // 64
    scales[scale++] = biomes;
    biomes = REGISTER(new Layer::ScaleLayer(worldSeed, 1001, Layer::ScaleLayerType::NORMAL, biomes));
    biomes = REGISTER(new Layer::EaseEdgeLayer(worldSeed, 1000, biomes));

    // noise generation for variant and river
    noise = REGISTER(new Layer::NoiseLayer(worldSeed, 100, base));

    if (dataVersion < MC::Version::v1_13) {
      // this line needs an explanation : basically back when the stack was recursively initialized, only one parent was
      // initialized with its world seed but the hills layer had 2 parents so the noise was never initialized recursively,
      // we simulate this stuff here by scaling with world seed equals to 0
      // the river branch still use the full scaling with its normal layer seed
      river = REGISTER(new Layer::ScaleLayer(worldSeed, 1000, Layer::ScaleLayerType::NORMAL, noise));
      river = REGISTER(new Layer::ScaleLayer(worldSeed, 1001, Layer::ScaleLayerType::NORMAL, river));
      // Passing 0 for worldSeed and salt leads to the layerSeed being equal to 0.
      noise = REGISTER(new Layer::ScaleLayer(0, 0, Layer::ScaleLayerType::NORMAL, noise));
      noise = REGISTER(new Layer::ScaleLayer(0, 0, Layer::ScaleLayerType::NORMAL, noise));
    } else {
      noise = REGISTER(new Layer::ScaleLayer(worldSeed, 1000, Layer::ScaleLayerType::NORMAL, noise));
      noise = REGISTER(new Layer::ScaleLayer(worldSeed, 1001, Layer::ScaleLayerType::NORMAL, noise));
      river = noise;
    }

    // hills and variants chain
    variants = REGISTER(new Layer::HillsLayer(worldSeed, 1000, biomes, noise));
    variants = REGISTER(new Layer::SunflowerPlainsLayer(worldSeed, 1001, variants));

    for (int i=0 ; i<biomeSize ; i++) {
      scales[scale++] = variants;
      variants = REGISTER(new Layer::ScaleLayer(worldSeed, 1000 + i, Layer::ScaleLayerType::NORMAL, variants));

      if (i == 0) {
        variants = REGISTER(new Layer::LandLayer(worldSeed, 3, variants));
      }

      if (i == 1 || biomeSize == 1) {
        variants = REGISTER(new Layer::EdgeBiomesLayer(worldSeed, 1000, variants));
      }
    }
    
    variants = REGISTER(new Layer::SmoothScaleLayer(worldSeed, 1000, variants));

    for (int i = 0; i < biomeSize; i++) {
      river = REGISTER(new Layer::ScaleLayer(worldSeed, 1000 + i, Layer::ScaleLayerType::NORMAL, river));
    }

    river = REGISTER(new Layer::NoiseToRiverLayer(worldSeed, 1, river));
    river = REGISTER(new Layer::SmoothScaleLayer(worldSeed, 1000, river));

    // mixing of the river with the hills and variants
    full = REGISTER(new Layer::RiverLayer(worldSeed, 100, variants, river));

    if (dataVersion >= MC::Version::v1_13) {
      ocean = REGISTER(new Layer::OceanTemperatureLayer(worldSeed, 2));
      for (int i = 0; i < biomeSize + 2; i++) {
        ocean = REGISTER(new Layer::ScaleLayer(worldSeed, 2001 + i, Layer::ScaleLayerType::NORMAL, ocean));
      }
      // mixing of the two firsts stacks with the ocean chain
      full = REGISTER(new Layer::ApplyOceanTemperatureLayer(worldSeed, 100, full, ocean));
    }

    scales[scale++] = full;
    // Insert a fake scale layer to make the transition between full and voronoi (used only for map view)
    scales[scale++] = REGISTER(new Layer::ScaleLayer(worldSeed, 2001, Layer::ScaleLayerType::NORMAL, full));

    voronoi = REGISTER(new Layer::VoronoiLayer(dataVersion, worldSeed, false, full));
    scales[scale++] = voronoi;
  }

  Layer::LayerBase* REGISTER(Layer::LayerBase* layer) {
    layers[nLayers++] = layer;
    return layer;
  }

  ~OverworldBiomeProvider() {
    for (int i=0 ; i<nLayers; i++) {
      delete layers[i];
    }
  }

  int scaledBiomeAt(int scale, int x, int z) {
    return scales[scale]->sample(x, 0, z);
  }

  int biomeAt(int x, int z) {
    return full->sample(x, 0, z);
  }

  int64_t worldSeed;
  Layer::LayerBase* layers[52];
  Layer::LayerBase* scales[52];
  int nLayers{0};
  Layer::LayerBase* base{nullptr};
  Layer::LayerBase* biomes{nullptr};
  Layer::LayerBase* noise{nullptr};
  Layer::LayerBase* river{nullptr};
  Layer::LayerBase* variants{nullptr};
  Layer::LayerBase* full{nullptr};
  Layer::LayerBase* ocean{nullptr};
  Layer::LayerBase* voronoi{nullptr};
};