import { buckets } from "../state/buckets.js";
import FriendService from "../../services/friends.service.js";

export async function profileUpdatedEmitter(userId) {
  try {
    const bucket = buckets.get(userId);

    const uniqueIds = [
      ...new Set([
        ...bucket.friends,
        ...bucket.outgoingRequests,
        ...bucket.incomingRequests,
      ]),
    ];

    await Promise.all(
      uniqueIds.map((id) => FriendService.profileUpdated(userId, id))
    );
  } catch (err) {
    console.log(err);
  }
}

export async function profilePictureUpdatedEmitter(userId) {
  try {
    const bucket = buckets.get(userId);

    const uniqueIds = [
      ...new Set([
        ...bucket.friends,
        ...bucket.outgoingRequests,
        ...bucket.incomingRequests,
      ]),
    ];

    await Promise.all(
      uniqueIds.map((id) => FriendService.profilePictureUpdated(userId, id))
    );
  } catch (err) {
    console.log(err);
  }
}

export default { profilePictureUpdatedEmitter, profileUpdatedEmitter };
