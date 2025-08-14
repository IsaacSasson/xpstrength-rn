import { safeHandler } from "../../utils/safeHandler.js";
import AppError from "../../utils/AppError.js";
import FriendService from "../../services/friends.service.js";
import ReportService from "../../services/report.service.js";
import friendsService from "../../services/friends.service.js";
/*
safeHandler(socket, "ping", async () => {
    socket.to(`user:${userId}`).emit("pong", { ts: Date.now() });
  });
  */
export function attachFriendHandlers(io, socket, buckets) {
  const userId = socket.data.user.id;

  safeHandler(socket, "addFriend", async (friendName) => {
    const bucket = buckets.get(userId);

    return await FriendService.addFriend(friendName, socket, bucket);
  });

  safeHandler(socket, "acceptRequest", async (friendId) => {
    const bucket = buckets.get(userId);

    return await FriendService.acceptRequest(friendId, socket, bucket);
  });

  safeHandler(socket, "declineRequest", async (friendId) => {
    const bucket = buckets.get(userId);

    return await FriendService.declineRequest(friendId, socket, bucket);
  });

  safeHandler(socket, "cancelRequest", async (friendId) => {
    const bucket = buckets.get(userId);

    return await FriendService.cancelRequest(friendId, socket, bucket);
  });

  safeHandler(socket, "removeFriend", async (friendId) => {
    const bucket = buckets.get(userId);

    return await FriendService.removeFriend(friendId, socket, bucket);
  });

  safeHandler(socket, "blockUser", async (friendId) => {
    const bucket = buckets.get(userId);

    if (bucket.blocked.has(friendId)) {
      throw new AppError("User already has friend blocked", 400, "BAD_DATA_WS");
    }

    if (bucket.friends.has(friendId)) {
      await FriendService.removeFriend(friendId, socket, bucket);
    } else if (bucket.outgoingRequests.has(friendId)) {
      await FriendService.cancelRequest(friendId, socket, bucket);
    } else if (bucket.incomingRequests.has(friendId)) {
      await FriendService.declineRequest(friendId, socket, bucket);
    }

    return await FriendService.blockFriend(friendId, socket, bucket);
  });

  safeHandler(socket, "unblockUser", async (friendId) => {
    const bucket = buckets.get(userId);

    if (!bucket.blocked.has(friendId)) {
      throw new AppError(
        "Cannot unblock a foreign user does not have already blocked"
      );
    }

    return await FriendService.unblockFriend(friendId, socket, bucket);
  });

  safeHandler(socket, "sendReport", async (reportObj, offenderId) => {
    const bucket = buckets.get(userId);

    await ReportService.reportUser(reportObj, offenderId, userId);
    return { msg: "Report succesfully recieved" };
  });

  safeHandler(socket, "profileUpdated", async () => {
    const bucket = buckets.get(userId);

    const uniqueIds = [
      new Set([
        ...bucket.friends,
        ...bucket.outgoingRequests,
        ...bucket.incomingRequests,
      ]),
    ];

    await Promise.all(
      uniqueIds.map((id) => FriendService.profileUpdated(userId, id))
    );

    return { msg: "Sent to all online/offline Knowns of user" };
  });

  safeHandler(socket, "profilePictureUpdated", async () => {
    const bucket = buckets.get(userId);

    const uniqueIds = [
      new Set([
        ...bucket.friends,
        ...bucket.outgoingRequests,
        ...bucket.incomingRequests,
      ]),
    ];

    await Promise.all(
      uniqueIds.map((id) => FriendService.profilePictureUpdated(userId, id))
    );

    return { msg: "Sent to all online/offline Knowns of user" };
  });

  safeHandler(socket, "statusChanged", async (status) => {
    const bucket = buckets.get(userId);

    bucket.status = status;

    const uniqueIds = [new Set([...bucket.friends])];

    await Promise.all(
      uniqueIds.map((id) => FriendService.statusChanged(userId, id, status))
    );

    return { msg: "Sent to all online/offline Knowns of user" };
  });

  safeHandler(socket, "getKnownProfile", async (knownId) => {
    const bucket = buckets.get(userId);
    if (
      !(
        bucket.friends.has(knownId) ||
        bucket.outgoingRequests.has(knownId) ||
        bucket.incomingRequests.has(knownId)
      )
    ) {
      throw new AppError("not a known profile to user");
    }
    return await FriendService.getKnownProfile(knownId);
  });

  safeHandler(socket, "getKnownProfilePicture", async (knownId) => {
    const bucket = buckets.get(userId);
    if (
      !(
        bucket.friends.has(knownId) ||
        bucket.outgoingRequests.has(knownId) ||
        bucket.incomingRequests.has(knownId)
      )
    ) {
      throw new AppError("not a known profile to user");
    }
    return await FriendService.getKnownProfilePic(knownId);
  });

  safeHandler(socket, "getFriendStatus", async (friendId) => {
    const bucket = buckets.get(userId);

    if (!bucket.friends.has(friendId)) {
      throw new AppError("not a known friend to the user");
    }

    return await FriendService.getFriendStatus(friendId);
  });

  safeHandler(socket, "getAllKnownProfiles", async () => {
    const bucket = buckets.get(userId);

    const uniqueIds = [
      ...new Set([
        ...bucket.friends,
        ...bucket.outgoingRequests,
        ...bucket.incomingRequests,
      ]),
    ];

    const profiles = await Promise.all(
      uniqueIds.map(async (id) => {
        const profile = await FriendService.getKnownProfile(id);
        return { id, profile };
      })
    );

    return profiles;
  });

  afeHandler(socket, "getAllFriendStatus", async () => {
    const bucket = buckets.get(userId);

    const uniqueIds = [...new Set([...bucket.friends])];

    const statuses = await Promise.all(
      uniqueIds.map(async (id) => {
        const status = await FriendService.getFriendStatus(id);
        return { id, status };
      })
    );

    return statuses;
  });
}
