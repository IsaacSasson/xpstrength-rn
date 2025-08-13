import { safeHandler } from "../../utils/safeHandler.js";
import AppError from "../../utils/AppError.js";
import EventService from "../../services/eventsOutbox.service.js";

export function attachCommonHandlers(io, socket, buckets) {
  const userId = socket.data.user.id;

  safeHandler(socket, "ping", async () => {
    socket.emit("pong", { ts: Date.now() });

    //Testing creating random event
    await EventService.createEvent(
      socket.data.user.id,
      "dummyEvent",
      null,
      1,
      { msg: "dummyPongEvent" },
      socket
    );
  });

  safeHandler(socket, "syncNow", async () => {
    await EventService.getAllUnseenEvents(socket.data.user.id, socket);
  });

  safeHandler(socket, "markEvents", async (upToId) => {
    await EventService.markEventsSeen(upToId, socket.data.user.id, socket);
  });

  if (process.env.NODE_ENV !== "production") {
    // create an arbitrary event
    safeHandler(socket, "createEvent", async (data) => {
      const {
        type = "testEvent",
        actorId = null,
        resourceId = 1,
        payload = {},
      } = data || {};
      await EventService.createEvent(
        userId,
        type,
        actorId,
        resourceId,
        payload,
        socket
      );
    });

    // create N dummy events quickly
    safeHandler(socket, "spamDummy", async ({ n = 5 } = {}) => {
      n = Math.max(1, Math.min(Number(n) || 1, 100)); // clamp 1..100
      for (let i = 1; i <= n; i++) {
        await EventService.createEvent(
          userId,
          "dummyEvent",
          null,
          1,
          { i, msg: "dummy" },
          socket
        );
      }
    });
  }

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
