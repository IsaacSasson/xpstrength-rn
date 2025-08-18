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
//Mindset Order Database then Bucket/Event then Return value

//Sends back to user Friend Profile, and sends to Friend Users Profile when added, also creates Addings
export async function addFriend(friendUsername, socket, bucket) {
  try {
    return await sequelize.transaction(async (t) => {
      let friend = await User.findOne({
        where: { username: friendUsername },
        transaction: t,
      });

      //Check if the Friend ID even exists
      if (!friend) {
        throw new AppError("Username not found", 400, "BAD_DATA_WS");
      }
      let friendUserId = friend.id;

      //Check if the Friend ID even exists
      if (!friendUserId) {
        throw new AppError("Internal Database Error", 500, "INTERNAL_WS");
      }

      //Check if blocked
      if (
        await Blocked.findOne({
          where: { userId: friendUserId, blockedId: socket.data.user.id },
          transaction: t,
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
          transaction: t,
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
        throw new AppError(
          "Your already friends with user",
          400,
          "BAD_DATA_WS"
        );
      }

      //Check if you already sent a request
      if (bucket.outgoingRequests.has(friendUserId)) {
        throw new AppError("User already requested", 400, "BAD_DATA_WS");
      }

      //Check if they sent you a request
      if (bucket.incomingRequests.has(friendUserId)) {
        return await acceptRequest(friendUserId, socket, bucket);
      }

      const OutgoingReq = await OutgoingRequests.create(
        { userId: socket.data.user.id, outgoingId: friendUserId },
        { transaction: t }
      );

      const IncomingReq = await IncomingRequests.create(
        { userId: friendUserId, incomingId: socket.data.user.id },
        { transaction: t }
      );

      const friendBucket = buckets.get(friendUserId);

      if (friendBucket) {
        friendBucket.incomingRequests.add(socket.data.user.id);
        await EventService.createEvent(
          friendUserId,
          "friend-request-initiated",
          socket.data.user.id,
          IncomingReq.id,
          { profileData: parseProfileObj(socket.data.user) },
          friendBucket.sockets.values().next().value,
          true
        );
      } else {
        await EventService.createEvent(
          friendUserId,
          "friend-request-initiated",
          socket.data.user.id,
          IncomingReq.id,
          { profileData: parseProfileObj(socket.data.user) },
          null,
          false
        );
      }

      bucket.outgoingRequests.add(friendUserId);

      const history = new AddHistory(
        "FRIEND",
        "User succesfully added friend",
        socket.data.user.id,
        friendUserId
      );

      await history.log(t);

      return parseProfileObj(friend);
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function parseProfileObj(profile) {
  if (!profile) {
    throw new AppError(
      "No Profile added to parseProfileObj",
      400,
      "BAD-DATA_WS"
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

//When you accept a friend you get their status in return
export async function acceptRequest(friendUserId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    return sequelize.transaction(async (t) => {
      if (!bucket.incomingRequests.has(friendUserId)) {
        throw new AppError(
          "Cannot accept a friendRequest from a user who did not request you",
          400,
          "BAD-DATA_WS"
        );
      }

      const friendBucket = buckets.get(friendUserId);

      //Delete incoming and outgoing requests and alert user also increment friend count for both

      const OutgoingReq = await OutgoingRequests.findOne({
        where: { userId: friendUserId, outgoingId: userId },
        transaction: t,
      });

      if (!OutgoingReq) {
        throw new AppError(
          "No Outgoing Request found to accept friend Request",
          500,
          "DB Error"
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
          500,
          "DB Error"
        );
      }

      await IncomingReq.destroy({ transaction: t });

      await Friend.create(
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
          "DB_ERROR"
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
          "DB_ERROR"
        );
      }

      userAcc.totalFriends += 1;

      await userAcc.save({ transaction: t });

      if (friendBucket) {
        friendBucket.outgoingRequests.delete(userId);
        EventService.createEvent(
          friendUserId,
          "friend-request-accepted",
          userId,
          friendResource.id,
          parseProfileObj(userAcc),
          friendBucket.sockets.values().next().value,
          true
        );
      } else {
        EventService.createEvent(
          friendUserId,
          "friend-request-accepted",
          userId,
          friendResource.id,
          parseProfileObj(userAcc),
          null,
          false
        );
      }

      bucket.incomingRequests.delete(friendUserId);

      const history = new AddHistory(
        "FRIEND",
        "User succesfully accepted incoming friendRequest",
        socket.data.user.id,
        friendUserId
      );

      await history.log(t);

      return parseProfileObj(friendAcc);
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//Declines Request and Returns user ID of the person you declined
export async function declineRequest(friendUserId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    return sequelize.transaction(async (t) => {
      if (!bucket.incomingRequests.has(friendUserId)) {
        throw new AppError(
          "Cannot decline a friendRequest from a user who did not request you"
        );
      }

      const friendBucket = buckets.get(friendUserId);

      //Delete incoming and outgoing requests and alert user also increment friend count for both

      const OutgoingReq = await OutgoingRequests.findOne({
        where: { userId: friendUserId, outgoingId: userId },
        transaction: t,
      });

      if (!OutgoingReq) {
        throw new AppError(
          "Couldnt find Outgoing Request for decline Request",
          500,
          "DB_ERROR"
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
          "DB_ERROR"
        );
      }

      await IncomingReq.destroy({ transaction: t });

      if (friendBucket) {
        friendBucket.outgoingRequests.delete(userId);
        EventService.createEvent(
          friendUserId,
          "friend-request-declined",
          userId,
          outGoingReqId,
          null,
          friendBucket.sockets.values().next().value,
          true
        );
      } else {
        EventService.createEvent(
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

      const history = new AddHistory(
        "FRIEND",
        "User succesfully declined incoming friendRequest",
        socket.data.user.id,
        friendUserId
      );

      await history.log(t);

      return friendUserId;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function cancelRequest(friendUserId, socket, bucket) {
  try {
    const userId = socket.data.user.id;

    return sequelize.transaction(async (t) => {
      if (!bucket.outgoingRequests.has(friendUserId)) {
        throw new AppError(
          "Cannot cancel a friendRequest from a user whom you did not request"
        );
      }

      const friendBucket = buckets.get(friendUserId);

      //Delete incoming and outgoing requests and alert user
      const OutgoingReq = await OutgoingRequests.findOne({
        where: { userId: userId, outgoingId: friendUserId },
        transaction: t,
      });

      if (!OutgoingReq) {
        throw new AppError(
          "OutGoing Request Not found to cancel",
          500,
          "INTERNAL DB ERROR"
        );
      }

      await OutgoingReq.destroy({ transaction: t });

      const IncomingReq = await IncomingRequests.findOne({
        where: { userId: friendUserId, incomingId: userId },
        transaction: t,
      });

      if (!IncomingReq) {
        throw new AppError(
          "IncomingRequest Request not found to for the user you cancelled on!",
          500,
          "INTERNAL DB ERROR"
        );
      }

      const IncomingReqId = IncomingReq.id;

      await IncomingReq.destroy({ transaction: t });

      if (friendBucket) {
        friendBucket.incomingRequests.delete(userId);
        EventService.createEvent(
          friendUserId,
          "friend-request-cancelled",
          userId,
          IncomingReqId,
          null,
          friendBucket.sockets.values().next().value,
          true
        );
      } else {
        EventService.createEvent(
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

      const history = new AddHistory(
        "FRIEND",
        "User succesfully cancelled outgoing friendRequest",
        socket.data.user.id,
        friendUserId
      );

      await history.log(t);

      return friendUserId;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function removeFriend(friendId, socket, bucket) {
  try {
    const userId = socket.data.user.id;
    let friendBucket = buckets.get(friendId);

    if (!bucket.friends.has(friendId)) {
      throw new AppError(
        "Cannot remove a friend you are not friends with",
        400,
        "BAD_DATA_WS"
      );
    }

    return await sequelize.transaction(async (t) => {
      const userAccFriend = await Friend.findOne({
        where: { userId: userId, friendId: friendId },
        transaction: t,
      });

      if (!userAccFriend) {
        throw new AppError(
          "Could not find friend of user to destory",
          400,
          "BAD_DATA"
        );
      }

      await userAccFriend.destroy({ transaction: t });

      const friendAccFriend = await Friend.findOne({
        where: { userId: friendId, friendId: userId },
        transaction: t,
      });

      if (!friendAccFriend) {
        throw new AppError(
          "Could not find friend of user to destory",
          400,
          "BAD_DATA"
        );
      }

      const friendAccFriendId = friendAccFriend.id;

      await friendAccFriend.destroy({ transaction: t });

      if (friendBucket) {
        friendBucket.friends.delete(userId);
        EventService.createEvent(
          friendId,
          "friend-removed",
          userId,
          friendAccFriendId,
          null,
          friendBucket.sockets.values().next().value,
          true
        );
      } else {
        EventService.createEvent(
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

      friendAcc.totalFriends -= 1;

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

      userAcc.totalFriends -= 1;

      await userAcc.save({ transaction: t });

      const history = new AddHistory(
        "FRIEND",
        "User succesfully removed friend",
        socket.data.user.id,
        friendId
      );

      await history.log(t);

      return friendId;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

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
          "INTERNAL_WS"
        );
      }

      bucket.blocked.add(friendId);

      const history = new AddHistory(
        "FRIEND",
        "User succesfully blocked aggressor",
        socket.data.user.id,
        friendId
      );

      await history.log(t);

      return blockedObj.get?.({ plain: true }) || blockedObj;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

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
          "INTERNAL_WS"
        );
      }

      await blockedObj.destroy({ transaction: t });

      bucket.blocked.delete(friendId);

      const history = new AddHistory(
        "FRIEND",
        "User succesfully unblocked aggressor",
        socket.data.user.id,
        friendId
      );

      await history.log(t);

      return friendId;
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function profileUpdated(fromId, toId) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "user-profile-updated",
        fromId,
        toId,
        null,
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "user-profile-updated",
        fromId,
        toId,
        null,
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function profilePictureUpdated(fromId, toId) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "user-profile-pic-updated",
        fromId,
        toId,
        null,
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "user-profile-pic-updated",
        fromId,
        toId,
        null,
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function statusChanged(fromId, toId, status) {
  try {
    const toIdBucket = buckets.get(toId);

    if (toIdBucket) {
      await EventService.createEvent(
        toId,
        "friend-status-updated",
        fromId,
        toId,
        { status: status },
        toIdBucket.sockets.values().next().value,
        true
      );
    } else {
      await EventService.createEvent(
        toId,
        "friend-status-updated",
        fromId,
        toId,
        { status: status },
        null,
        false
      );
    }
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getKnownProfile(profileId) {
  try {
    let profile = await User.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new AppError("Profile not found for profileId", 400, "BAD_DATA_WS");
    }
    profile = parseProfileObj(profile);
    const { profilePic, ...noPic } = profile;
    return noPic;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getKnownProfilePic(profileId) {
  try {
    let profile = await User.findOne({ where: { id: profileId } });
    if (!profile) {
      throw new AppError(
        "ProfilePic not found for profileId",
        400,
        "BAD_DATA_WS"
      );
    }
    return profile.profilePic;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getFriendStatus(friendId) {
  try {
    return { status: buckets.get(friendId)?.status ?? "Offline" };
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  addFriend,
  acceptRequest,
  declineRequest,
  cancelRequest,
  blockFriend,
  unblockFriend,
  profileUpdated,
  profilePictureUpdated,
  statusChanged,
  getKnownProfile,
  getKnownProfilePic,
  getFriendStatus,
};
