const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite's web implementation loads a WASM SQLite build; Metro needs to
// treat .wasm as a static asset instead of trying to parse it as source.
config.resolver.assetExts.push('wasm');

module.exports = config;
