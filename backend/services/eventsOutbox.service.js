import { sequelize } from "../config/db.config.js";
import { Event } from "../models/index.js";
import AppError from "../utils/AppError.js";
import mapSequelizeError from "../utils/mapSequelizeError.js";
import AddEvent from "../utils/AddEvent.js";
import { io } from "../server.js";

//Singular event sent to user
export function sendEvent(event, socket) {
  io.to(`user:${socket.data.user.id}`).emit("newEvent", event);
}

//Multiple events sent to user via an Array of events
export function sendEvents(events, socket) {
  io.to(`user:${socket.data.user.id}`).emit("newEvents", events);
}

export async function createEvent(
  userId,
  type,
  actorId,
  resourceId,
  payload,
  socket,
  forward
) {
  try {
    await sequelize.transaction(async (t) => {
      let newEvent = new AddEvent(userId, type, actorId, resourceId, payload);
      newEvent = await newEvent.forward(t);
      const plain = newEvent.get ? newEvent.get({ plain: true }) : newEvent;

      if (forward) {
        t.afterCommit(() => {
          try {
            sendEvent(plain, socket);
          } catch (err) {
            throw new AppError(err, 500, "WEBSOCKET");
          }
        });
      }
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function markEventsSeen(upToId, userId, socket) {
  try {
    await sequelize.transaction(async (t) => {
      await Event.markSeen(userId, upToId, t);
    });
    socket.emit("eventsSeenUpToId", { upTo: upToId });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getEventsAfterRef(userId, socket, refId) {
  try {
    await sequelize.transaction(async (t) => {
      const events = await Event.allFromRef(userId, refId, t);
      const plain = events.map((e) => (e.get ? e.get({ plain: true }) : e));
      t.afterCommit(() => {
        try {
          sendEvents(plain, socket);
        } catch (err) {
          throw new AppError(
            "Failed to send events back through socket",
            500,
            "WEBSOCKET"
          );
        }
      });
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

//Future might add an option for events with ref ID to be recieved
export async function getAllUnseenEvents(userId, socket) {
  try {
    await sequelize.transaction(async (t) => {
      const events = await Event.findAll({
        where: { userId: userId, seenAt: null },
        transaction: t,
        order: [["id", "ASC"]],
      });

      const plain = events.map((e) => (e.get ? e.get({ plain: true }) : e));

      t.afterCommit(() => {
        try {
          sendEvents(plain, socket);
        } catch (err) {
          throw new AppError(err, 500, "WEBSOCKET");
        }
      });
    });
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export default {
  getAllUnseenEvents,
  markEventsSeen,
  createEvent,
  sendEvent,
  sendEvents,
  getEventsAfterRef,
};
