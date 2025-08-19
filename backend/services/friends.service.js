/**
 * @typedef {Object} Bucket
 * @property {Set<number>} friends
 * @property {Set<number>} outgoingRequests
 * @property {Set<number>} incomingRequests
 * @property {Set<number>} blocked
 * @property {string} [status]
 * @property {{values(): IterableIterator<import('socket.io').Socket>}} sockets
 */

/**
 * @typedef {Object} ServiceOk
 * @property {true} ok
 * @property {string} code
 * @property {any} data
 * @property {string} message
 */

/**
 * @typedef {Object} ServiceErr
 * @property {false} ok
 * @property {string} code
 * @property {string} message
 */

/**
 * @typedef {ServiceOk|ServiceErr} ServiceResult
 */

import { sequelize } from "../config/db.config.js";
import {
  User,
  Blocked,
  OutgoingRequests,
  IncomingRequests,
  Friend,
} from "../models/index.js";
import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";
import EventService from "./eventsOutbox.service.js";
import { buckets } from "../io/state/buckets.js";
import AddHistory from "../utils/AddHistory.js";

/**
 * Send a friend request to a user by username.
 *
 * Validates:
 * - Username exists and is not self.
 * - Neither party has blocked the other.
 * - Not already friends, and no duplicate outgoing request.
 * If the target already sent *you* a request, this auto-accepts instead.
 *
 * Side effects:
 * - Creates OutgoingRequests (sender→target) and IncomingRequests (target→sender) rows.
 * - Updates in-memory bucket sets (outgoing/incoming).
 * - Emits a "friend-request-initiated" event to the target (if online).
 *
 * @param {string} friendUsername Target user's username.
 * @param {import('socket.io').Socket} socket Caller socket (provides caller user id).
 * @param {Bucket} bucket Caller bucket state.
 * @returns {Promise<ServiceOk>} OK result with deltas and target's safe profile.
 * @throws {AppError} On bad input (e.g., self-add, blocked) or missing user.
 */
export async function addFriend(friendUsername, socket, bucket) {
  try {
    if (!friendUsername) {
      throw new AppError("Username not supplied", 400, "BAD-DATA-WS");
    }

    let friend = await User.findOne({
      where: { username: friendUsername },
    });

    //Check if the Friend ID even exists
    if (!friend) {
      throw new AppError("Username not found", 400, "BAD-DATA-WS");
    }
    let friendUserId = friend.id;

    //Check if the Friend ID even exists
    if (!friendUserId) {
      throw new AppError("Internal Database Error", 500, "DB-INTERNAL");
    }

    if (friendUserId === socket.data.user.id) {
      throw new AppError("You cannot add yourself", 400, "BAD-DATA-WS");
    }

    //Check if blocked
    if (
      await Blocked.findOne({
        where: { userId: friendUserId, blockedId: socket.data.user.id },
      })
    ) {
      throw new AppError(
        "User is blocked by Outgoing, cant request",
        400,
        "BLOCKED"
      );
    }
    if (
      await Blocked.findOne({
        where: { userId: socket.data.user.id, blockedId: friendUserId },
      })
    ) {
      throw new AppError(
        "User has OutGoing Blocked, cant request",
        400,
        "BLOCKED"
      );
    }

    //Check if their already friends
    if (bucket.friends.has(friendUserId)) {
      throw new AppError("Your already friends with user", 400, "BAD-DATA-WS");
    }

    //Check if you already sent a request
    if (bucket.outgoingRequests.has(friendUserId)) {
      throw new AppError("User already requested", 400, "BAD-DATA-WS");
    }

    //Check if they sent you a request
    if (bucket.incomingRequests.has(friendUserId)) {
      return await acceptRequest(friendUserId, socket, bucket, true);
    }
    const { OutgoingReq, IncomingReq } = await sequelize.transaction(
      async (t) => {
        const OutgoingReq = await OutgoingRequests.create(
          { userId: socket.data.user.id, outgoingId: friendUserId },
          { transaction: t }
        );

        const IncomingReq = await IncomingRequests.create(
          { userId: friendUserId, incomingId: socket.data.user.id },
          { transaction: t }
        );

        const history = new AddHistory(
          "FRIEND",
          "User successfully added friend",
          socket.data.user.id,
          friendUserId
        );

        await history.log(t);

        return { OutgoingReq, IncomingReq };
      }
    );

    const friendBucket = buckets.get(friendUserId);

    if (friendBucket) {
      friendBucket.incomingRequests.add(socket.data.user.id);
      await EventService.createEvent(
        friendUserId,
        "friend-request-initiated",
        socket.data.user.id,
        IncomingReq.id,
        { profileData: await parseProfileObj(socket.data.user) },
        friendBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        friendUserId,
        "friend-request-initiated",
        socket.data.user.id,
        IncomingReq.id,
        { profileData: await parseProfileObj(socket.data.user) },
        null,
        false
      );
    }

    bucket.outgoingRequests.add(friendUserId);

    const safeProfile = await parseProfileObj(friend);
    const userId = socket.data.user.id;
    return ok(
      "FRIEND_REQUEST_SENT",
      {
        userId: userId,
        friendUserId: friendUserId,
        outgoingRequestId: OutgoingReq.id,
        deltas: {
          addToOutgoing: friendUserId,
        },
        friendProfile: safeProfile,
      },
      "Friend request sent."
    );
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Strip sensitive fields from a User model/POJO and return a safe profile.
 *
 * Removes: password, email, authority, totalCoins, shopUnlocks.
 * Accepts either a Sequelize instance (uses `.get({ plain: true })`) or a plain object.
 *
 * @param {any} profile User instance or plain object.
 * @returns {Promise<object>} Safe profile object.
 * @throws {AppError} If profile is missing.
 */

export async function parseProfileObj(profile) {
  if (!profile) {
    throw new AppError(
      "No Profile added to parseProfileObj",
      400,
      "BAD-DATA-WS"
    );
  }
  const {
    password,
    email,
    authority,
    totalCoins,
    shopUnlocks,
    ...safeProfile
  } = profile.get?.({ plain: true }) || profile;

  return safeProfile;
}

/**
 * Accept an incoming friend request from a specific user.
 *
 * Preconditions:
 * - The caller must have an incoming request from `friendUserId`.
 *
 * Effects (transactional):
 * - Deletes matching OutgoingRequests/IncomingRequests rows.
 * - Creates reciprocal Friend rows (caller↔friend).
 * - Increments totalFriends for both users.
 * - Writes a FRIEND history entry.
 *
 * Side effects (post-transaction):
 * - Updates bucket state on both sides.
 * - Emits "friend-request-accepted" to the other user (if online).
 *
 * @param {number} friendUserId The requesting user's id.
 * @param {import('socket.io').Socket} socket Caller socket.
 * @param {Bucket} bucket Caller bucket.
 * @param {boolean} auto If true, this was triggered from addFriend auto-match.
 * @returns {Promise<ServiceOk>} OK result with friendship ids, deltas, and friend profile.
 * @throws {AppError} If no matching request exists or DB records are missing.
 */
export async function acceptRequest(friendUserId, socket, bucket, auto) {
  try {
    const userId = socket.data.user.id;

    if (!bucket.incomingRequests.has(friendUserId)) {
      throw new AppError(
        "Cannot accept a friendRequest from a user who did not request you",
        400,
        "BAD-DATA-WS"
      );
    }

    const friendBucket = buckets.get(friendUserId);

    const { friendResource, userResource, incomingReqId, userAcc, friendAcc } =
      await sequelize.transaction(async (t) => {
        //Delete incoming and outgoing requests and alert user also increment friend count for both

        const OutgoingReq = await OutgoingRequests.findOne({
          where: { userId: friendUserId, outgoingId: userId },
          transaction: t,
        });

        if (!OutgoingReq) {
          throw new AppError(
            "No Outgoing Request found to accept friend Request",
            400,
            "BAD-DATA-WS"
          );
        }

        await OutgoingReq.destroy({ transaction: t });

        const IncomingReq = await IncomingRequests.findOne({
          where: { userId: userId, incomingId: friendUserId },
          transaction: t,
        });

        if (!IncomingReq) {
          throw new AppError(
            "No IncomingReq found to accept friend Request",
            400,
            "BAD-DATA-WS"
          );
        }

        const incomingReqId = IncomingReq.id;

        await IncomingReq.destroy({ transaction: t });

        const userResource = await Friend.create(
          { userId: userId, friendId: friendUserId },
          { transaction: t }
        );

        const friendResource = await Friend.create(
          { userId: friendUserId, friendId: userId },
          { transaction: t }
        );

        const friendAcc = await User.findOne({
          where: { id: friendUserId },
          transaction: t,
        });

        if (!friendAcc) {
          throw new AppError(
            "No Friend Account found during accept request process",
            500,
            "DB-INTERNAL"
          );
        }

        friendAcc.totalFriends += 1;

        await friendAcc.save({ transaction: t });

        const userAcc = await User.findOne({
          where: { id: userId },
          transaction: t,
        });

        if (!userAcc) {
          throw new AppError(
            "No User Profile account found during accept request process",
            500,
            "DB-INTERNAL"
          );
        }

        userAcc.totalFriends += 1;

        await userAcc.save({ transaction: t });

        const history = new AddHistory(
          "FRIEND",
          "User successfully accepted incoming friendRequest",
          socket.data.user.id,
          friendUserId
        );

        await history.log(t);

        return {
          friendResource,
          userResource,
          incomingReqId,
          userAcc,
          friendAcc,
        };
      });

    if (friendBucket) {
      friendBucket.outgoingRequests.delete(userId);
      friendBucket.friends.add(userId);
      await EventService.createEvent(
        friendUserId,
        "friend-request-accepted",
        userId,
        friendResource.id,
        await parseProfileObj(userAcc),
        friendBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        friendUserId,
        "friend-request-accepted",
        userId,
        friendResource.id,
        await parseProfileObj(userAcc),
        null,
        false
      );
    }

    bucket.incomingRequests.delete(friendUserId);
    bucket.friends.add(friendUserId);

    const safeProfile = await parseProfileObj(friendAcc);
    const friendResourceId = friendResource.id;
    const userResourceId = userResource.id;

    if (auto) {
      return ok(
        "FRIEND_REQUEST_AUTOMATCH_ACCEPTED",
        {
          userId,
          friendUserId,
          friendshipIdForUser: userResourceId,
          friendshipIdForFriend: friendResourceId,
          deltas: {
            removeFromIncoming: friendUserId,
            removeFromTheirOutgoing: userId,
            addToFriends: friendUserId,
          },
          friendProfile: safeProfile,
        },
        "Request matched and accepted."
      );
    } else {
      return ok(
        "FRIEND_REQUEST_ACCEPTED",
        {
          userId,
          friendUserId,
          friendshipIdForUser: userResourceId,
          friendshipIdForFriend: friendResourceId,
          removedIncomingId: incomingReqId,
          deltas: {
            removeFromIncoming: friendUserId,
            removeFromTheirOutgoing: userId,
            addToFriends: friendUserId,
          },
          friendProfile: safeProfile,
        },
        "Friend request accepted."
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Decline an incoming friend request from a specific user.
 *
 * Preconditions:
 * - The caller must have an incoming request from `friendUserId`.
 *
 * Effects (transactional):
 * - Deletes the corresponding OutgoingRequests/IncomingRequests pair.
 * - Writes a FRIEND history entry.
 *
 * Side effects:
 * - Updates bucket state.
 * - Emits "friend-request-declined" to the requester.
 *
 * @param {number} friendUserId Requester's user id.
 * @param {import('socket.io').Socket} socket Caller socket.
 * @param {Bucket} bucket Caller bucket.
 * @returns {Promise<ServiceOk>} OK result with deltas and removed incoming id.
 * @throws {AppError} If no matching request exists or DB records are missing.
 */
export async function declineRequest(friendUserId, socket, bucket) {
  try {
    const userId = socket.data.user.id;
    if (!bucket.incomingRequests.has(friendUserId)) {
      throw new AppError(
        "Cannot decline a friendRequest from a user who did not request you"
      );
    }

    const friendBucket = buckets.get(friendUserId);

    const { outGoingReqId, incomingId } = await sequelize.transaction(
      async (t) => {
        //Delete incoming and outgoing requests and alert user also increment friend count for both

        const OutgoingReq = await OutgoingRequests.findOne({
          where: { userId: friendUserId, outgoingId: userId },
          transaction: t,
        });

        if (!OutgoingReq) {
          throw new AppError(
            "Couldnt find Outgoing Request for decline Request",
            500,
            "DB-INTERNAL"
          );
        }

        const outGoingReqId = OutgoingReq.id;

        await OutgoingReq.destroy({ transaction: t });

        const IncomingReq = await IncomingRequests.findOne({
          where: { userId: userId, incomingId: friendUserId },
          transaction: t,
        });

        if (!IncomingReq) {
          throw new AppError(
            "Couldnt find Incoming Request for decline Request",
            500,
            "DB-INTERNAL"
          );
        }

        const incomingId = IncomingReq.id;

        await IncomingReq.destroy({ transaction: t });

        const history = new AddHistory(
          "FRIEND",
          "User successfully declined incoming friendRequest",
          socket.data.user.id,
          friendUserId
        );

        await history.log(t);

        return { outGoingReqId, incomingId };
      }
    );

    if (friendBucket) {
      friendBucket.outgoingRequests.delete(userId);
      await EventService.createEvent(
        friendUserId,
        "friend-request-declined",
        userId,
        outGoingReqId,
        null,
        friendBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        friendUserId,
        "friend-request-declined",
        userId,
        outGoingReqId,
        null,
        null,
        false
      );
    }

    bucket.incomingRequests.delete(friendUserId);

    return ok(
      "FRIEND_REQUEST_DECLINED",
      {
        userId,
        friendUserId,
        removedIncomingId: incomingId ?? null,
        deltas: {
          removeFromIncoming: friendUserId,
        },
      },
      "Friend request declined."
    );
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Cancel a previously sent outgoing friend request.
 *
 * Preconditions:
 * - Caller must have an outgoing request to `friendUserId`.
 *
 * Effects (transactional):
 * - Deletes OutgoingRequests (caller→friend) and IncomingRequests (friend→caller).
 * - Writes a FRIEND history entry.
 *
 * Side effects:
 * - Updates bucket state.
 * - Emits "friend-request-cancelled" to the target (if online).
 *
 * @param {number} friendUserId Target user's id.
 * @param {import('socket.io').Socket} socket Caller socket.
 * @param {Bucket} bucket Caller bucket.
 * @returns {Promise<ServiceOk>} OK result with deltas and removed outgoing id.
 * @throws {AppError} If request rows are missing.
 */

export async function cancelRequest(friendUserId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    if (!bucket.outgoingRequests.has(friendUserId)) {
      throw new AppError(
        "Cannot cancel a friendRequest from a user whom you did not request"
      );
    }

    const friendBucket = buckets.get(friendUserId);
    const { OutgoingReqId, IncomingReqId } = await sequelize.transaction(
      async (t) => {
        //Delete incoming and outgoing requests and alert user
        const OutgoingReq = await OutgoingRequests.findOne({
          where: { userId: userId, outgoingId: friendUserId },
          transaction: t,
        });

        if (!OutgoingReq) {
          throw new AppError(
            "OutGoing Request Not found to cancel",
            500,
            "DB-INTERNAL"
          );
        }

        const OutgoingReqId = OutgoingReq.id;

        await OutgoingReq.destroy({ transaction: t });

        const IncomingReq = await IncomingRequests.findOne({
          where: { userId: friendUserId, incomingId: userId },
          transaction: t,
        });

        if (!IncomingReq) {
          throw new AppError(
            "IncomingRequest Request not found to for the user you cancelled on!",
            500,
            "DB-INTERNAL"
          );
        }

        const IncomingReqId = IncomingReq.id;

        await IncomingReq.destroy({ transaction: t });

        const history = new AddHistory(
          "FRIEND",
          "User successfully cancelled outgoing friendRequest",
          socket.data.user.id,
          friendUserId
        );

        await history.log(t);

        return { OutgoingReqId, IncomingReqId };
      }
    );

    if (friendBucket) {
      friendBucket.incomingRequests.delete(userId);
      await EventService.createEvent(
        friendUserId,
        "friend-request-cancelled",
        userId,
        IncomingReqId,
        null,
        friendBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        friendUserId,
        "friend-request-cancelled",
        userId,
        IncomingReqId,
        null,
        null,
        false
      );
    }

    bucket.outgoingRequests.delete(friendUserId);

    return ok(
      "FRIEND_REQUEST_CANCELLED",
      {
        userId,
        friendUserId,
        removedOutgoingId: OutgoingReqId ?? null,
        deltas: {
          removeFromOutgoing: friendUserId,
        },
      },
      "Friend request cancelled."
    );
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Remove an existing friendship between the current user and `friendId`.
 *
 * - Validates that the target is currently in the caller's `bucket.friends`.
 * - Deletes both directional rows from `Friends` within a single transaction.
 * - Decrements `totalFriends` for both users.
 * - Writes a history record.
 * - Emits a `"friend-removed"` event to the friend (immediate if online).
 * - Updates in-memory buckets for both sides.
 *
 * @param {number} friendId - The other user's id to remove as a friend.
 * @param {import('socket.io').Socket} socket - The caller's Socket.IO socket; used for identity and routing.
 * @param {UserBucket} bucket - The caller's in-memory bucket (friends/requests/blocked/sockets/etc).
 * @returns {Promise<OkResponse>} Success payload including removed friendship ids and delta hints.
 * @throws {AppError} `BAD-DATA-WS` if not currently friends or expected rows are missing.
 * @throws {AppError} `DB-INTERNAL` on unexpected DB state.
 */
export async function removeFriend(friendId, socket, bucket) {
  try {
    const userId = socket.data.user.id;
    let friendBucket = buckets.get(friendId);

    if (!bucket.friends.has(friendId)) {
      throw new AppError(
        "Cannot remove a friend you are not friends with",
        400,
        "BAD-DATA-WS"
      );
    }

    const { friendAccFriendId, userAccFriendId } = await sequelize.transaction(
      async (t) => {
        const userAccFriend = await Friend.findOne({
          where: { userId: userId, friendId: friendId },
          transaction: t,
        });

        if (!userAccFriend) {
          throw new AppError(
            "Could not find friend of user to destory",
            400,
            "BAD-DATA-WS"
          );
        }

        const userAccFriendId = userAccFriend.id;

        await userAccFriend.destroy({ transaction: t });

        const friendAccFriend = await Friend.findOne({
          where: { userId: friendId, friendId: userId },
          transaction: t,
        });

        if (!friendAccFriend) {
          throw new AppError(
            "Could not find friend of user to destory",
            400,
            "BAD-DATA-WS"
          );
        }

        const friendAccFriendId = friendAccFriend.id;

        await friendAccFriend.destroy({ transaction: t });

        const friendAcc = await User.findOne({
          where: { id: friendId },
          transaction: t,
        });

        if (!friendAcc) {
          throw new AppError(
            "Could not find friend account with friendId",
            500,
            "DB-INTERNAL"
          );
        }

        friendAcc.totalFriends = Math.max(0, friendAcc.totalFriends - 1);

        await friendAcc.save({ transaction: t });

        const userAcc = await User.findOne({
          where: { id: userId },
          transaction: t,
        });

        if (!userAcc) {
          throw new AppError(
            "Could not find friend account with friendId",
            500,
            "DB-INTERNAL"
          );
        }

        userAcc.totalFriends = Math.max(0, userAcc.totalFriends - 1);

        await userAcc.save({ transaction: t });

        const history = new AddHistory(
          "FRIEND",
          "User successfully removed friend",
          socket.data.user.id,
          friendId
        );

        await history.log(t);

        return { friendAccFriendId, userAccFriendId };
      }
    );

    if (friendBucket) {
      friendBucket.friends.delete(userId);
      await EventService.createEvent(
        friendId,
        "friend-removed",
        userId,
        friendAccFriendId,
        null,
        friendBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        friendId,
        "friend-removed",
        userId,
        friendAccFriendId,
        null,
        null,
        false
      );
    }

    bucket.friends.delete(friendId);

    return ok(
      "FRIEND_REMOVED",
      {
        userId,
        friendUserId: friendId,
        removedFriendshipIdForUser: userAccFriendId ?? null,
        removedFriendshipIdForFriend: friendAccFriendId ?? null,
        deltas: {
          removeFromFriends: friendId,
        },
      },
      "Friend removed."
    );
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Block a user. This prevents future interactions and updates in-memory state.
 *
 * - Creates a `Blocked` row inside a transaction.
 * - Updates the caller's `bucket.blocked`.
 * - Records a history entry.
 * - Returns delta hints to remove any in-flight friendship/requests from UI state.
 *
 * @param {number} friendId - The id of the user to block.
 * @param {import('socket.io').Socket} socket - The caller's socket.
 * @param {UserBucket} bucket - The caller's in-memory bucket.
 * @returns {Promise<OkResponse>} Block metadata and recommended client deltas.
 * @throws {AppError} `DB-INTERNAL` when the row cannot be created.
 */
export async function blockFriend(friendId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    // Create a blocked object, add blocked to the users bucket mappings, thats it bc already handled before in outer function?
    return await sequelize.transaction(async (t) => {
      const blockedObj = await Blocked.create(
        { userId: userId, blockedId: friendId },
        { transaction: t }
      );

      if (!blockedObj) {
        throw new AppError(
          "Blocked Object wasnt able to be created",
          500,
          "DB-INTERNAL"
        );
      }

      const blockedId = blockedObj.id;

      bucket.blocked.add(friendId);

      const history = new AddHistory(
        "FRIEND",
        "User successfully blocked aggressor",
        socket.data.user.id,
        friendId
      );

      await history.log(t);

      return ok(
        "USER_BLOCKED",
        {
          userId,
          friendUserId: friendId,
          blockId: blockedId,
          deltas: {
            addToBlocked: friendId,
            removeFromFriends: friendId,
            removeFromIncoming: friendId,
            removeFromOutgoing: friendId,
          },
        },
        "User blocked."
      );
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}
/**
 * Unblock a previously blocked user.
 *
 * - Looks up and deletes the `Blocked` row inside a transaction.
 * - Updates the caller's `bucket.blocked`.
 * - Records a history entry.
 *
 * @param {number} friendId - The id of the user to unblock.
 * @param {import('socket.io').Socket} socket - The caller's socket.
 * @param {UserBucket} bucket - The caller's in-memory bucket.
 * @returns {Promise<OkResponse>} Success payload with removed block id and delta hints.
 * @throws {AppError} `DB-INTERNAL` if no block exists or delete fails.
 */
export async function unblockFriend(friendId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    // Destroy a blocked object, remove blocked from the users bucket mappings, thats it bc already handled before in outer function?
    return await sequelize.transaction(async (t) => {
      const blockedObj = await Blocked.findOne({
        where: { userId: userId, blockedId: friendId },
        transaction: t,
      });

      if (!blockedObj) {
        throw new AppError(
          "Blocked Object never existed for user",
          500,
          "DB-INTERNAL"
        );
      }

      const blockedId = blockedObj.id;

      await blockedObj.destroy({ transaction: t });

      bucket.blocked.delete(friendId);

      const history = new AddHistory(
        "FRIEND",
        "User successfully unblocked aggressor",
        socket.data.user.id,
        friendId
      );

      await history.log(t);

      return ok(
        "USER_UNBLOCKED",
        {
          userId,
          friendUserId: friendId,
          removedBlockId: blockedId ?? null,
          deltas: {
            removeFromBlocked: friendId,
          },
        },
        "User unblocked."
      );
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Notify a user (`toId`) that another user (`fromId`) updated their profile.
 * If online, the event is sent immediately via Socket.IO; otherwise it is enqueued.
 *
 * @param {number} fromId - User who changed profile.
 * @param {number} toId - Friend to notify.
 * @returns {Promise<void>}
 */
export async function profileUpdated(fromId, toId) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "user-profile-updated",
        fromId,
        null,
        null,
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "user-profile-updated",
        fromId,
        null,
        null,
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Notify a user (`toId`) that `fromId` changed their profile picture.
 *
 * @param {number} fromId - User who changed profile picture.
 * @param {number} toId - Friend to notify.
 * @returns {Promise<void>}
 */
export async function profilePictureUpdated(fromId, toId) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "user-profile-pic-updated",
        fromId,
        null,
        null,
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "user-profile-pic-updated",
        fromId,
        null,
        null,
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Notify `toId` that `fromId`'s presence status changed.
 *
 * @param {number} fromId - The friend whose status changed.
 * @param {number} toId - The recipient to notify.
 * @param {"Online"|"Offline"|"WorkingOut"|"Busy"|string} status - New status string.
 * @returns {Promise<void>}
 */
export async function statusChanged(fromId, toId, status) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "friend-status-updated",
        fromId,
        null,
        { status: status },
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "friend-status-updated",
        fromId,
        null,
        { status: status },
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Fetch a known profile (by id) and return a sanitized object
 * with sensitive fields stripped AND without `profilePic`.
 *
 * @param {number} profileId - The user id to fetch.
 * @returns {Promise<Object>} A plain object suitable for client usage (minus `profilePic`).
 * @throws {AppError} `BAD-DATA-WS` if the profile is not found.
 */
export async function getKnownProfile(profileId) {
  try {
    let profile = await User.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new AppError("Profile not found for profileId", 400, "BAD-DATA-WS");
    }
    profile = await parseProfileObj(profile);
    const { profilePic, ...noPic } = profile;

    return noPic;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Fetch only the profile picture URL (or blob ref) for a given profile id.
 *
 * @param {number} profileId - The user id to fetch.
 * @returns {Promise<string>} The `profilePic` field.
 * @throws {AppError} `BAD-DATA-WS` if the profile is not found.
 */
export async function getKnownProfilePic(profileId) {
  try {
    let profile = await User.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new AppError(
        "ProfilePic not found for profileId",
        400,
        "BAD-DATA-WS"
      );
    }
    return profile.profilePic;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Get the current presence status for a friend from in-memory buckets.
 * Defaults to `"Offline"` when no bucket or status exists.
 *
 * @param {number} friendId - The friend's user id.
 * @returns {Promise<{status: string}>} An object with a `status` field.
 */
export async function getFriendStatus(friendId) {
  try {
    return { status: buckets.get(friendId)?.status ?? "Offline" };
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

/**
 * Build a standard success response for WS handlers.
 *
 * @param {string} code - Machine-readable code for the client.
 * @param {any} data - Arbitrary payload.
 * @param {string} message - Human-readable message.
 * @returns {OkResponse}
 */

function ok(code, data, message) {
  return { ok: true, code, data, message };
}

/**
 * Public API for the Friends domain service.
 * Each function returns a standardized `OkResponse` (except the notify helpers),
 * throws `AppError` on expected business errors, and wraps unexpected failures
 * via `mapSequelizeError`.
 */
export default {
  addFriend,
  acceptRequest,
  declineRequest,
  cancelRequest,
  removeFriend,
  blockFriend,
  unblockFriend,
  profileUpdated,
  profilePictureUpdated,
  statusChanged,
  getKnownProfile,
  getKnownProfilePic,
  getFriendStatus,
};
