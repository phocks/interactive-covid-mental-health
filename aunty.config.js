const { resolve } = require("path");

module.exports = {
  webpack: config => {
    const rules = config.module.rules;
    const scriptsRule = rules.find(x => x.__hint__ === "scripts");

    scriptsRule.include.push(
      resolve(__dirname, "node_modules/d3-axis"),
      resolve(__dirname, "node_modules/d3-array"),
      resolve(__dirname, "node_modules/d3-format"),
      resolve(__dirname, "node_modules/d3-fetch"),
      resolve(__dirname, "node_modules/d3-scale"),
      resolve(__dirname, "node_modules/d3-selection"),
      resolve(__dirname, "node_modules/d3-scale-chromatic"),
      resolve(__dirname, "node_modules/d3-shape"),
      resolve(__dirname, "node_modules/d3-transition"),
      resolve(__dirname, "node_modules/fuse.js")
    );

    return {
      ...config,
      performance: {
        hints: false,
        maxEntrypointSize: 512000,
        maxAssetSize: 512000,
      },
    };
  },
};
