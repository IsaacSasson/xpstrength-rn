// Path: /context/constants/themeConstants.ts
export type ThemeColors = {
  primary: string;
  secondary: string;
  tertiary: string;
};

export type Theme = {
  id: string;
  name: string;
  colors: ThemeColors;
};

// Updated themes with refined, nearly black tertiary colors
export const THEMES: Record<string, Theme> = {
  purple_default: {
    id: "purple_default",
    name: "Classic Purple",
    colors: {
      primary: "#A742FF",
      secondary: "#BD7AFF",
      tertiary: "#1A1726", // remains as our reference dark purple
    },
  },
  red_inferno: {
    id: "red_inferno",
    name: "Inferno Red",
    colors: {
      primary: "#FF0000",
      secondary: "#FF4D4D",
      // Slightly raised red channel compared to a baseline nearly-black
      tertiary: "#2A1616", // (42,22,22)
    },
  },
  orange_sunrise: {
    id: "orange_sunrise",
    name: "Sunrise Orange",
    colors: {
      primary: "#FF7F00",
      secondary: "#FF9933",
      // A subtle tint with a hint of warmth
      tertiary: "#2A1816", // (42,24,22)
    },
  },
  green_forest: {
    id: "green_forest",
    name: "Forest Green",
    colors: {
      primary: "#00AA00",
      secondary: "#66CC66",
      // Leaning into green by boosting the green channel slightly
      tertiary: "#1A2A1A", // (26,42,26)
    },
  },
  blue_ocean: {
    id: "blue_ocean",
    name: "Ocean Blue",
    colors: {
      primary: "#0066FF",
      secondary: "#4D94FF",
      // A refined dark blue with a modest blue channel boost
      tertiary: "#161A2A", // (22,26,42)
    },
  },
  gold_premium: {
    id: "gold_premium",
    name: "Premium Gold",
    colors: {
      primary: "#FFD700",
      secondary: "#FFDF4D",
      // A dark tone with a gentle nod toward a golden hue
      tertiary: "#2A1A16", // (42,26,22)
    },
  },
  neon_future: {
    id: "neon_future",
    name: "Neon Future",
    colors: {
      primary: "#00FFFF",
      secondary: "#4DFFFF",
      tertiary: "#171726", // remains as our reference dark cyan
    },
  },
};

// Shop theme metadata
export interface ShopItem extends Theme {
  price: number;
  description: string;
}

// Define shop items with metadata
export const SHOP_THEMES: Record<string, ShopItem> = {
  purple_default: {
    ...THEMES.purple_default,
    price: 0, // Free default theme
    description: "The default purple theme. Bold and energetic.",
  },
  red_inferno: {
    ...THEMES.red_inferno,
    price: 500,
    description: "Fiery and intense. Perfect for high-intensity workouts.",
  },
  orange_sunrise: {
    ...THEMES.orange_sunrise,
    price: 500,
    description: "Warm and motivating. Start your day with energy.",
  },
  green_forest: {
    ...THEMES.green_forest,
    price: 750,
    description: "Natural and calming. Find your zen while working out.",
  },
  blue_ocean: {
    ...THEMES.blue_ocean,
    price: 750,
    description: "Deep and focused. Dive into your training routine.",
  },
  gold_premium: {
    ...THEMES.gold_premium,
    price: 1500,
    description: "Luxurious and prestigious. Show off your achievements.",
  },
  neon_future: {
    ...THEMES.neon_future,
    price: 2000,
    description: "Futuristic and bright. Train like you're from the future.",
  },
};
