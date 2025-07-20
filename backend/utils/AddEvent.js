import AppError from "./AppError.js";
import { Event } from "../models/index.js";

export default class AddEvent {
  constructor(userId, type, actorId = null, resourceId, payload = {}) {
    this.userId = userId;
    this.type = type;
    this.actorId = actorId;
    this.resourceId = resourceId;
    this.payload = payload;
  }

  async forward(t) {
    const event = await Event.create(
      {
        userId: this.userId,
        type: this.type,
        actorId: this.actorId,
        resourceId: this.resourceId,
        payload: this.payload,
      },
      { transaction: t }
    );

    return event;
  }
}
