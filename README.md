# prismarine-rng
[![NPM version](https://img.shields.io/npm/v/prismarine-rng.svg)](http://npmjs.com/package/prismarine-rng)
[![Build Status](https://github.com/PrismarineJS/prismarine-rng/workflows/CI/badge.svg)](https://github.com/PrismarineJS/prismarine-rng/actions?query=workflow%3A%22CI%22)
[![Discord](https://img.shields.io/badge/chat-on%20discord-brightgreen.svg)](https://discord.gg/GsEFRM8)
[![Gitter](https://img.shields.io/badge/chat-on%20gitter-brightgreen.svg)](https://gitter.im/PrismarineJS/general)
[![Irc](https://img.shields.io/badge/chat-on%20irc-brightgreen.svg)](https://irc.gitter.im/)
[![Try it on gitpod](https://img.shields.io/badge/try-on%20gitpod-brightgreen.svg)](https://gitpod.io/#https://github.com/PrismarineJS/prismarine-rng)

Collection of utilities to work with minecraft RNG.

## API

## LCG
?tbd

## Random
?tbd

## crackPlayerSeed
### crackPlayerSeed.crack(bits)
Returns the decrypted player seed
* `Returns` - Seed number
* `bits` - Encrypted seed string?


## enchantments
### enchantments.findEnchantment(playerSeed, item, power, matching)
* `Returns` - Object or null ?tbd
* `playerSeed` - Number ?tbd
* `item` - Item object ?tbd
* `power` - ?tbd
* `matching` - Matching function that returns a bool ?tbd

### enchantments.getEnchantmentList(xpseed, item, slot, level)
* `Returns` - Array ?tbd
* `xpseed` - ?tbd
* `item` - Item object ?tbd
* `slot` - ?tbd
* `level` - Number ?tbd

### enchantments.getEnchantmentCost(rand, slot, power, item)
* `Returns` - Numeber ?tbd
* `rand` - ?tbd
* `slot` - ?tbd
* `power` - ?tbd
* `item` - ?tbd

### enchantments.getEnchantmentPower(pos, world)
* `Returns` - Power number ?tbd
* `pos` - Vec3 ?tbd
* `world` - ?tbd

## createWorldGenerator
### createWorldGenerator(mcData, worldSeed, dimension)
Returns a promise
* `Returns` - Promise that resolves to ?tbd
* `mcData` - mcData
* `worldSeed` - World seed number
* `dimension` - Dimension string (defaults to "overworld")