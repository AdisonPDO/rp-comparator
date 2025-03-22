// config-overrides.js
module.exports = function override(config, env) {
  // Ajout du fallback pour crypto
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "buffer": require.resolve("buffer"),
  };

  return config;
};