// Safe SVGO v3 config for React Native anatomy SVGs.
// - Keeps <g id="muscle-..."> groups and viewBox
// - Avoids merges/shape conversions that might drop ids
// - Conservative numeric/transform optimization

module.exports = {
  multipass: true,
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          // Keep structure we rely on
          cleanupIds: false,               // preserve id attributes
          collapseGroups: false,
          mergePaths: false,
          convertShapeToPath: false,
          moveElemsAttrsToGroup: false,
          moveGroupAttrsToElems: false,
        },
      },
    },
    // In SVGO v3, configure these as separate plugins:
    { name: 'removeViewBox', active: false },                // keep viewBox
    { name: 'removeUselessStrokeAndFill', active: false },   // keep strokes/fills

    // Conservative numeric reductions
    { name: 'cleanupNumericValues', params: { floatPrecision: 2 } },
    { name: 'convertPathData',      params: { floatPrecision: 2, transformPrecision: 3 } },
    { name: 'convertTransform',     params: { floatPrecision: 2 } },

    // Safe cleanups
    'removeDoctype',
    'removeXMLProcInst',
    'removeComments',
    'removeMetadata',
    'removeEditorsNSData',
    'removeEmptyText',
    'removeEmptyAttrs',
    'removeUselessDefs',
    'removeTitle',
    'removeDesc',
  ],
};