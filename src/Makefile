all:
	emcc --bind -O2 -Wall -s WASM=1 -s MODULARIZE=1 -s 'EXPORT_NAME="createWorldGenModule"' -o ../lib/wasm/WorldGen.js WorldGen.cpp