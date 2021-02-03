#include <emscripten/bind.h>

#include "BiomeProvider.h"

using namespace emscripten;

// Binding code
EMSCRIPTEN_BINDINGS(biome_provider) {
  class_<OverworldBiomeProvider>("OverworldBiomeProvider")
    .constructor<int, int, int>()
    .function("scaledBiomeAt", &OverworldBiomeProvider::scaledBiomeAt)
    .function("biomeAt", &OverworldBiomeProvider::biomeAt);
}