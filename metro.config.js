const { getDefaultConfig } = require('@react-native/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push(
  'db', 'sqlite', 'mp3', 'wav', 'ttf', 'otf', 'png', 'jpg', 'jpeg'
);

// Configuración de alias CORREGIDA
config.resolver.extraNodeModules = {
  '@assets': path.resolve(__dirname, 'src/core/assets'),
  '@core': path.resolve(__dirname, 'src/core'),
  '@features': path.resolve(__dirname, 'src/features'),
  '@shared': path.resolve(__dirname, 'src/shared')
};

module.exports = config;