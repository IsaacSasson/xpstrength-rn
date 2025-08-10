// .svgrrc.js
module.exports = {
  native: true,
  svgo: true,
  svgoConfig: require("./svgo.config"),
  svgProps: {
    pointerEvents: "auto",
    preserveAspectRatio: "xMidYMid meet",
  },
};
// This configuration file is for SVGR, which allows importing SVGs as React components.