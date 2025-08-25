// scripts/reindex-exercise-ids.js
// Zero-indexes the "id" field of all exercise rows in assets/exercises.json.
// Safe to run repeatedly; it subtracts 1 only from numeric-like ids > 0 and leaves others alone.

const fs = require("fs");
const path = require("path");

const INPUT_PATH = path.resolve(__dirname, "../assets/exercises.json");
const BACKUP_PATH = path.resolve(__dirname, "../assets/exercises.backup.json");

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  return { raw, json: JSON.parse(raw) };
}

function writeJson(filePath, obj) {
  const pretty = JSON.stringify(obj, null, 2) + "\n";
  fs.writeFileSync(filePath, pretty, "utf8");
}

function findDataArray(root) {
  // phpMyAdmin export is usually an array like:
  // [ {type:'header',...}, {type:'database',...}, {type:'table', data:[...] } ]
  if (Array.isArray(root)) {
    // Try to locate a "table" entry with a data array.
    const tableObj = root.find(
      (x) => x && typeof x === "object" && x.type === "table" && Array.isArray(x.data)
    );
    if (tableObj) {
      return { container: tableObj, get: () => tableObj.data, set: (arr) => (tableObj.data = arr) };
    }
    // Fallback: maybe the array itself is the data
    if (root.length && root.every((x) => x && typeof x === "object")) {
      return { container: root, get: () => root, set: () => {} };
    }
  }

  // Object with a "data" array at the top level
  if (root && typeof root === "object" && Array.isArray(root.data)) {
    return { container: root, get: () => root.data, set: (arr) => (root.data = arr) };
  }

  throw new Error("Could not find a data array of exercise rows in the JSON.");
}

function zeroIndexIds(rows) {
  let changed = 0;
  for (const row of rows) {
    if (!row || typeof row !== "object" || !("id" in row)) continue;
    const n = Number(row.id);
    if (Number.isFinite(n) && n > 0) {
      row.id = String(n - 1);
      changed++;
    }
  }
  return changed;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error(`Cannot find ${INPUT_PATH}.`);
    process.exit(1);
  }

  const { raw, json } = readJson(INPUT_PATH);

  // Create a one-time backup if it doesn't exist yet.
  if (!fs.existsSync(BACKUP_PATH)) {
    fs.writeFileSync(BACKUP_PATH, raw, "utf8");
    console.log(`Backup written to ${path.relative(process.cwd(), BACKUP_PATH)}`);
  } else {
    console.log("Backup already exists; leaving it untouched.");
  }

  const dataRef = findDataArray(json);
  const rows = dataRef.get();

  const beforeSample = rows.slice(0, 3).map((r) => ({ id: r.id, name: r.name }));
  const changed = zeroIndexIds(rows);
  const afterSample = rows.slice(0, 3).map((r) => ({ id: r.id, name: r.name }));

  // Persist changes
  dataRef.set(rows);
  writeJson(INPUT_PATH, json);

  console.log(`Updated ${changed} id fields to be zero-indexed.`);
  console.log("First few rows before:", beforeSample);
  console.log("First few rows after: ", afterSample);
  console.log(`Done. Wrote changes to ${path.relative(process.cwd(), INPUT_PATH)}`);
}

try {
  main();
} catch (err) {
  console.error("Error:", err.message);
  process.exit(1);
}
// Usage: node scripts/reindex-exercise-ids.js