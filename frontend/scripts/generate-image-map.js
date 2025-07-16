// node ≥ 18
import fg from "fast-glob";
import fs from "node:fs";
import path from "node:path";

const IMAGE_GLOB = "assets/exerciseImages/**/*.{jpg,jpeg,png}";
const OUT_FILE = "utils/exerciseImageMap.ts";

const files = await fg(IMAGE_GLOB);
if (files.length === 0) {
  console.error("No exercise images found. Check IMAGE_GLOB.");
  process.exit(1);
}

const rows = files
  .map((file) => {
    const key = "/" + file.replace(/\\/g, "/");                 // JSON path
    const requirePath = "@/" + file.replace(/\\/g, "/");       // @/ alias import
    return `  "${key}": require("${requirePath}"),`;
  })
  .join("\n");

const out = `// AUTO‑GENERATED — DO NOT EDIT
export const exerciseImageMap: Record<string, number> = {
${rows}
};
`;

fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, out);
console.log(`✅  Wrote ${OUT_FILE}  (${files.length} images)`);

// yarn gen:images