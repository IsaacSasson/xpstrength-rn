import pino from "pino";

const prettyTransport = pino.transport({
  target: "pino-pretty",
  options: {
    colorize: true,
    customColors: "info:yellow",
  },
});

export const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  prettyTransport
);

// Max characters to keep for any logged string value
const MAX_LOG_LEN = 50;

// Keys to omit entirely from logs
const OMIT_KEYS = new Set(["password", "token"]); // add "profilePic" etc. if you want to drop them entirely

function truncateString(s) {
  return s.length > MAX_LOG_LEN ? s.slice(0, MAX_LOG_LEN) + "…" : s;
}

function isSerializedBufferLike(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    obj.type === "Buffer" &&
    Array.isArray(obj.data) &&
    obj.data.every((n) => typeof n === "number")
  );
}

function sanitizeValue(value, seen) {
  if (typeof value === "string") return truncateString(value);
  if (value == null) return value; // null/undefined
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
    return value;

  // Real Buffer
  if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(value)) {
    return `[Buffer ${value.length} bytes]`;
  }

  // Already-serialized Buffer: { type: "Buffer", data: [...] }
  if (isSerializedBufferLike(value)) {
    return `[Buffer ${value.data.length} bytes]`;
  }

  // ArrayBuffer / TypedArrays / DataView
  if (value instanceof ArrayBuffer) {
    return `[ArrayBuffer ${value.byteLength} bytes]`;
  }
  if (ArrayBuffer.isView(value)) {
    // Covers Uint8Array, DataView, etc. (Buffer is handled earlier)
    return `[${value.constructor.name} ${value.byteLength} bytes]`;
  }

  // Blob / File (Node 18+ and browsers)
  const g = globalThis;
  if (typeof g.Blob !== "undefined" && value instanceof g.Blob) {
    const name = "name" in value ? value.name : undefined; // File extends Blob
    const kind = name ? "File" : "Blob";
    const type = value.type ? ` ${value.type}` : "";
    return name
      ? `[${kind} ${name} ${value.size} bytes${type}]`
      : `[${kind} ${value.size} bytes${type}]`;
  }

  // Date
  if (value instanceof Date) return value.toISOString();

  // Functions: show a placeholder
  if (typeof value === "function")
    return `[Function ${value.name || "anonymous"}]`;

  // Objects / Arrays with circular handling
  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((v) => sanitizeValue(v, seen));
  }

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (OMIT_KEYS.has(k)) continue;
    out[k] = sanitizeValue(v, seen);
  }
  return out;
}

export function requestLogger(req, res, next) {
  const started = Date.now();
  const { method, originalUrl: url } = req;

  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  const safeBody = () => {
    if (!req.body || !Object.keys(req.body).length) return undefined;
    return sanitizeValue(req.body, new WeakSet());
  };

  res.on("finish", () => {
    logger.info(
      {
        ts: Date.now(),
        method,
        url,
        status: res.statusCode,
        ms: Date.now() - started,
        ip: clientIp,
        body: safeBody(),
      },
      "request-complete"
    );
  });

  next();
}
