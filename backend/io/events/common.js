import { safeHandler } from "../../utils/safeHandler.js";
import AppError from "../../utils/AppError.js";

export function attachCommonHandlers(io, socket, buckets) {
  const userId = socket.data.user.id;

  safeHandler(socket, "ping", async () => {
    socket.emit("pong", { ts: Date.now() });
  });

  safeHandler(socket, "disconnect", async () => {
    clearTimeout(socket.data.expiryTimer);
    const bucket = buckets.get(userId);
    if (!bucket) return;
    bucket.sockets.delete(socket);
    if (bucket.sockets.size === 0) {
      buckets.delete(userId); // drop cache when last socket leaves
    }
  });
}
