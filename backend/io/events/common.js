import { safeHandler } from "../../utils/safeHandler.js";
import AppError from "../../utils/AppError.js";
import EventService from "../../services/eventsOutbox.service.js";
import FriendService from "../../services/friends.service.js";
import { getFriendData } from "../../utils/GetFriendData.js";

export function attachCommonHandlers(io, socket, buckets) {
  const userId = socket.data.user.id;

  safeHandler(socket, "ping", async () => {
    io.to(`user:${userId}`).emit("pong", { ts: Date.now() });
  });

  safeHandler(socket, "dataSync", async () => {
    const bucket = buckets.get(userId);
    if (!bucket) {
      return;
    }
    const friendData = await getFriendData(socket.data.user);
    bucket.friends = friendData.friends;
    bucket.incomingRequests = friendData.incomingRequests;
    bucket.outgoingRequests = friendData.outgoingRequests;
    bucket.blocked = friendData.blocked;
    io.to(`user:${userId}`).emit("dataSync", {
      friends: Array.from(bucket.friends),
      incomingRequests: Array.from(bucket.incomingRequests),
      outgoingRequests: Array.from(bucket.outgoingRequests),
      blocked: Array.from(bucket.blocked),
    });
  });

  safeHandler(socket, "eventSync", async () => {
    await EventService.getAllUnseenEvents(userId, socket);
  });

  safeHandler(socket, "eventStream", async (ref) => {
    await EventService.getEventsAfterRef(userId, socket, ref);
  });

  safeHandler(socket, "markEvents", async (upToId) => {
    await EventService.markEventsSeen(upToId, userId, socket);
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
      const uniqueIds = [...bucket.friends];
      await Promise.all(
        uniqueIds.map((id) =>
          FriendService.statusChanged(userId, id, "Offline")
        )
      );
      buckets.delete(userId); // drop cache when last socket leaves
    }
  });
}
