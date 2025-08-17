import { Server } from "socket.io";
import authMiddleware from "./middleware/auth.js";
import { attachCommonHandlers } from "./events/common.js";
import { attachFriendHandlers } from "./events/friends.js";
import { buckets } from "./state/buckets.js";
import socketLogger from "./middleware/socketLogger.js";

/*How Error Handling Work
When any auth middleware error happens we send back a connect_error with the message of the error intact, this is caught inside of our error handling when we do next() after transforming the error

When a specific event endpoint fails we have an error translator that 1) sends back the error and if their a callback does the callback aswell

SafeHanlder used so we can support App Errors with out service calls

No need for try Catch's in services except for mapping sequelize errors, then it gets caught my the Handler
*/
export async function createIo(server) {
  const io = new Server(server, {
    path: "/socket",
    cors: { origin: true, credentials: true },
  });

  // auth / bootstrap
  io.use(socketLogger);
  io.use(authMiddleware);

  // per-connection handlers
  io.on("connection", (socket) => {
    attachCommonHandlers(io, socket, buckets);
    attachFriendHandlers(io, socket, buckets);
  });

  return io;
}
