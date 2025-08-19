import { verifyWebSocketToken } from "../../utils/security.js";
import { getFriendData } from "../../utils/GetFriendData.js";
import AppError from "../../utils/AppError.js";
import FriendService from "../../services/friends.service.js";
import { nextWithAppError } from "../../utils/socketErrors.js";
import { ensureBucket, buckets } from "../state/buckets.js";

export default async function authMiddleware(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token ||
      socket.handshake.headers?.authorization?.replace(/^Bearer /, "");

    if (!token) {
      return next(new AppError("No Token", 401, "NO_TOKEN"));
    }

    const { user, payload } = await verifyWebSocketToken(token);

    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      return next(new AppError("Token Expired", 403, "UNAUTHORIZED"));
    }

    // attach user and add expiry to socket
    socket.data.user = user;
    socket.data.expAt = payload.exp * 1000;

    // auto-disconnect on expiry
    socket.data.expiryTimer = setTimeout(() => {
      socket.emit("error", { code: "token_expired" });
      socket.disconnect(true);
    }, msUntilExpiry);

    // join per-user room
    socket.join(`user:${user.id}`);

    // ensure per-user bucket
    const bucket = ensureBucket(user.id);

    // if first socket for this user, load friend data once
    if (bucket.sockets.size === 0) {
      const friendData = await getFriendData(user);
      bucket.friends = friendData.friends;
      bucket.incomingRequests = friendData.incomingRequests;
      bucket.outgoingRequests = friendData.outgoingRequests;
      bucket.blocked = friendData.blocked;
      const uniqueIds = [...bucket.friends];
      await Promise.all(
        uniqueIds.map((id) =>
          FriendService.statusChanged(user.id, id, "Online")
        )
      );
    }

    bucket.sockets.add(socket);

    //In the future Call the service in events outbox to get all events

    next();
  } catch (err) {
    nextWithAppError(next, err);
  }
}
