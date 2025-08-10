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
import { fileURLToPath } from "url";
import path from "path";
import { createIo } from "./io/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ----------------- Config
dotenv.config();
const app = express();

app.set("trust proxy", 1);

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
      "http://localhost:4000",
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

//Serving the Websocket Test Client
app.use(express.static(path.join(__dirname, "public")));

//HTTP Server
const server = http.createServer(app);

//Websocket Server
createIo(server);

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
