// io/middleware/socketLogger.js
import { logger } from "../../middleware/log.middleware.js"; // reuse your pino instance

// lightweight copy of your sanitization for socket handshake/event payloads
const MAX_LOG_LEN = 50;
const OMIT_KEYS = new Set(["password", "token"]); // add more if needed

function truncateString(s) {
  return s.length > MAX_LOG_LEN ? s.slice(0, MAX_LOG_LEN) + "…" : s;
}

function isSerializedBufferLike(obj) {
  return (
    obj &&
    typeof obj === "object" &&
    obj.type === "Buffer" &&
    Array.isArray(obj.data)
  );
}

function sanitizeValue(value, seen = new WeakSet()) {
  if (typeof value === "string") return truncateString(value);
  if (value == null) return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
    return value;

  if (typeof Buffer !== "undefined" && Buffer.isBuffer?.(value))
    return `[Buffer ${value.length} bytes]`;
  if (isSerializedBufferLike(value))
    return `[Buffer ${value.data.length} bytes]`;
  if (value instanceof Date) return value.toISOString();

  if (seen.has(value)) return "[Circular]";
  seen.add(value);

  if (Array.isArray(value)) return value.map((v) => sanitizeValue(v, seen));

  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (OMIT_KEYS.has(k)) continue;
    out[k] = sanitizeValue(v, seen);
  }
  return out;
}

export default function socketLogger(socket, next) {
  const hdrs = socket.handshake?.headers || {};
  const xff = hdrs["x-forwarded-for"];
  const clientIp =
    (xff && xff.split(",")[0].trim()) ||
    socket.handshake?.address ||
    socket.conn?.remoteAddress ||
    "unknown";

  // keep context for later logs
  socket.data.__log = {
    ip: clientIp,
    ua: hdrs["user-agent"],
    url: socket.handshake?.url, // e.g. "/socket?token=..."
    tsStart: Date.now(),
  };

  // Log the connection "request-complete"-style
  logger.info(
    {
      ts: socket.data.__log.tsStart,
      method: "WS",
      url: socket.data.__log.url,
      status: 101, // Switching Protocols (conceptually)
      ms: 0,
      ip: clientIp,
      headers: sanitizeValue(hdrs),
    },
    "socket-connect"
  );

  // Per-event logging (optional but handy during dev):
  // Measures handler time and logs sanitized payloads.
  socket.onAny((event, payload, ...rest) => {
    const started = Date.now();
    // defer to next tick to capture duration after handler runs
    setImmediate(() => {
      const ms = Date.now() - started;
      logger.info(
        {
          ts: Date.now(),
          event,
          ms,
          ip: clientIp,
          payload: sanitizeValue(payload),
          extra: rest?.length ? sanitizeValue(rest) : undefined,
          socketId: socket.id,
        },
        "socket-event"
      );
    });
  });

  // Disconnect log mirrors your HTTP finish log
  socket.on("disconnect", (reason) => {
    const ms = Date.now() - (socket.data.__log.tsStart || Date.now());
    logger.info(
      {
        ts: Date.now(),
        method: "WS",
        url: socket.data.__log.url,
        status: 200, // closed cleanly
        ms,
        ip: clientIp,
        reason,
        socketId: socket.id,
      },
      "socket-disconnect"
    );
  });

  next();
}
