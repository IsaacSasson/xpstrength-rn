// ----------------- Imports
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import morgan from "morgan";
import v1Router from "./routes/v1.routes.js";
import rateLimiter from "./middleware/rateLimit.middleware.js";
import { assertDatabaseConnected, sequelize } from "./config/db.config.js";
import { requestLogger } from "./middleware/log.middleware.js";
import cookieParser from "cookie-parser";
import { WebSocketServer } from "ws";
import { verifyWebSocketToken } from "./utils/security.js";
import { getFriendData } from "./utils/GetFriendData.js";
import { AVLTree } from "avl";
import { handleClientMessage } from "./utils/serverWebSocketManager.js";
import { fileURLToPath } from "url";
import path from "path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------- Config
dotenv.config();
const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

//  Deserialziers
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
  cors({
    origin: [
      "https://your-spa-domain.com",
      `http://localhost:${process.env.PORT}`,
      "http://localhost:8081",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

//  Rate Limiters
app.use(rateLimiter.limiter);
app.use(rateLimiter.speedLimiter);

//  Morgan
//if (process.env.NODE_ENV === 'development') {
//app.use(morgan("dev"));
//}

//  Routes
app.use("/api/v1", requestLogger, v1Router);

//Websocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/socket" });
const connections = new Map();

//Websocket will have "changes" where you update the client with all the changes in the database events, and grab all fresh data from DB into the websocket, then do a hash comparison of the data
//if the hash passes nothing
//if the hash failes, send client websocket data to store and then rerun changes

//Executive decision all data will be stored and cached, we will not have a write through cache

//On initilization websocket will grab all data for the initialized user and set timeouts for the websocket auth
//User can get websocket auth token on network/websocket-token
//On the inital handshake the token should be send in to /socket with the token in the appropiate querying
//In the future we will set up https and wss

//After succesful handshake do an event sync immediatly, client assumes empty arrays for everything as the start

wss.on("connection", async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  let token = url.searchParams.get("token");
  if (!token) {
    return ws.close(4001, "Missing token");
  }

  //Verify Token Validity
  try {
    const { user, payload } = await verifyWebSocketToken(token);
  } catch (err) {
    return ws.close(4002, "Invalid token");
  }

  //Grab Friend Data
  try {
    const friendData = await getFriendData(user);
  } catch (err) {
    return ws.close(4004, "Friend data not found");
  }

  //Serialize friend data into usable balanced BST instance, set Timeout and set client Map
  try {
    const msUntilExpiry = payload.exp * 1000 - Date.now();
    if (msUntilExpiry <= 0) {
      return ws.close(4003, "Token already expired");
    }

    const expiryTimer = setTimeout(() => {
      ws.close(4003, "Token expired");
    }, msUntilExpiry);

    const Friends = new AVLTree();
    Friends.load(friendData.friends);

    const IncomingRequests = new AVLTree();
    IncomingRequests.load(friendData.incomingRequests);

    const OutgoingRequests = new AVLTree();
    OutgoingRequests.load(friendData.outgoingRequests);

    const key = user.id;
    const value = {
      friends: Friends,
      incomingRequests: IncomingRequests,
      outgoingRequests: OutgoingRequests,
      expiration: expiryTimer,
      socket: ws,
    };

    if (connections.has(key)) {
      clearTimeout(connections.get(key).expiration);
      connections.set(key, value);
    } else {
      connections.set(key, value);
    }
  } catch (err) {
    return ws.close(5000, "Failed to initalize connection with server");
  }

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch {
      return ws.send(JSON.stringify({ error: "Bad Json" }));
    }

    //Is their a token on the message?
    const incomingToken = msg.token;
    if (!incomingToken) {
      clearTimeout(expiration);
      connections.delete(key);
      return ws.close(4001, "Missing token on message");
    }

    //is the token valid?
    try {
      const { user, payload } = await verifyWebSocketToken(token);
    } catch (err) {
      clearTimeout(expiration);
      connections.delete(key);
      return ws.close(4002, "Invalid token");
    }

    handleClientMessage(connections, ws, msg, key);
  });

  ws.on("close", () => {
    clearTimeout(expiration);
    connections.delete(key);
  });

  //message is for logging purpose for server, action is a requestedAction to the other party, payload has the data for sending
  ws.send(
    JSON.stringify({ message: "Succesful connection", event: "requestSync" })
  );
});

//  Boot sequence
async function start() {
  try {
    // fail-fast if DB is unavailable
    await assertDatabaseConnected();

    const PORT = process.env.PORT || 3000;

    if (process.env.NODE_ENV === "production") {
      //Add IN HTTPS and WSS for the future

      server.listen(PORT, "0.0.0.0", () =>
        console.log(`✅  Prod server listening on: ${PORT}`)
      );
    } else if (process.env.NODE_ENV === "development") {
      server.listen(PORT, () =>
        console.log(`✅  Dev server listening at http://localhost:${PORT}`)
      );
    } else {
      throw new Error("UNKNOWN NODE_ENV setting");
    }
  } catch (err) {
    console.error("🚨  Startup failed:", err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== "test") start();

export default server;
