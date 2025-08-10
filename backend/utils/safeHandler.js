import { emitSocketError } from "./socketErrors.js";

//Takes in socket, the eventName, and the handlerFunction
export function safeHandler(socket, eventName, handler) {
  socket.on(eventName, async (payload, ack) => {
    try {
      const result = await handler(payload, ack);
      if (typeof ack === "function" && result !== undefined) {
        ack({ ok: true, data: result });
      }
    } catch (err) {
      emitSocketError(socket, err, ack);
    }
  });
}
