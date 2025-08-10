// svgo.config.js
module.exports = {
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,        // keep id attributes
          removeViewBox: false,     // keep viewBox
          // --- preserve grouping & element structure ---
          collapseGroups: false,    // don't inline/remove <g> (we need <g id="muscle-...">)
          mergePaths: false,        // don't merge paths (can drop ids)
          convertShapeToPath: false,// keep original elements
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
        },
      },
    },
  ],
};