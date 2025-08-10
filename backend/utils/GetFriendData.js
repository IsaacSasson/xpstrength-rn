import {
  User,
  Friend,
  OutgoingRequests,
  IncomingRequests,
  Blocked,
} from "../models/index.js";
import { sequelize } from "../config/db.config.js";

export async function getFriendData(user) {
  if (!user?.id) {
    throw new Error("User was not passed along to get Friend Data");
  }

  const userId = user.id;

  try {
    return await sequelize.transaction(async (t) => {
      const [friends, incoming, outgoing, blocked] = await Promise.all([
        // Friends this user has added
        Friend.findAll({
          where: { userId },
          attributes: ["friendId"],
          transaction: t,
          raw: true,
        }),
        // Requests sent TO this user
        IncomingRequests.findAll({
          where: { userId },
          attributes: ["incomingId"],
          transaction: t,
          raw: true,
        }),
        // Requests this user sent OUT
        OutgoingRequests.findAll({
          where: { userId },
          attributes: ["outgoingId"],
          transaction: t,
          raw: true,
        }),
        // Users this user has blocked
        Blocked.findAll({
          where: { userId },
          attributes: ["blockedId"],
          transaction: t,
          raw: true,
        }),
      ]);

      // Return plain arrays of user IDs (deduped just in case)
      return {
        friends: Array.from(new Set(friends.map((r) => Number(r.friendId)))),
        incomingRequests: Array.from(
          new Set(incoming.map((r) => Number(r.incomingId)))
        ),
        outgoingRequests: Array.from(
          new Set(outgoing.map((r) => Number(r.outgoingId)))
        ),
        blocked: Array.from(new Set(blocked.map((r) => Number(r.blockedId)))),
      };
    });
  } catch (err) {
    throw new Error("Failed to properly get friend data");
  }
}
