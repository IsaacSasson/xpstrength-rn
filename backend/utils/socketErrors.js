import AppError from "./AppError.js";

export function toAppError(err) {
  if (err instanceof AppError) return err;
  const status = err.status || 500;
  const code = err.code || "INTERNAL_ERROR";
  const msg = err.message || "Internal server error";
  return new AppError(msg, status, code);
}

// For connect-time errors (middleware)
export function nextWithAppError(next, err) {
  const e = toAppError(err);
  // Socket.IO will send e.message to client via "connect_error"
  next(e);
}

// For runtime event handler errors (From socket Handler)
export function emitSocketError(socket, err, ack) {
  const e = toAppError(err);
  // 1) Emit a standard error event for listeners
  socket.emit("error", { code: e.code, message: e.message, status: e.status });

  // 2) If client provided an ack callback, reply there too
  if (typeof ack === "function") {
    ack({
      ok: false,
      error: { code: e.code, message: e.message, status: e.status },
    });
  }
}
