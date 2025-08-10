// images
declare module "*.png" {
  import { ImageSourcePropType } from "react-native";
  const content: ImageSourcePropType;
  export default content;
}

// svgs
declare module "*.svg" {
  import * as React from "react";
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}
