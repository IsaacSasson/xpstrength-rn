import { emitSocketError } from "./socketErrors.js";

//Takes in socket, the eventName, and the handlerFunction
export function safeHandler(socket, eventName, handler) {
  socket.on(eventName, async (payload, ack) => {
    try {
      //Payload must be an array, Ack must be a func
      const result = await handler(...payload, ack);
      if (typeof ack === "function" && result !== undefined) {
        ack(result);
      }
    } catch (err) {
      emitSocketError(socket, err, ack);
    }
  });
}
