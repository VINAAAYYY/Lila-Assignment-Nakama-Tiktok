const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Exclude mounted volumes and other paths that cause ETIMEDOUT file-watch errors.
// The /Volumes directory on macOS may contain network or browser mounts that
// Metro's watcher cannot read, causing it to crash mid-bundle.
config.watchFolders = [__dirname];

config.resolver.blockList = [
  /\/Volumes\/.*/,
  /\/private\/var\/folders\/.*/,
];

module.exports = config;
