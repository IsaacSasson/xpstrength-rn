import { rateLimit } from "express-rate-limit";
import { slowDown } from "express-slow-down";
import { json } from "sequelize";

const limiter = rateLimit({
    windowMs: 1000 * 60, // 60 Seconds
    limit: 200, // max from IP
    message: json({ error: "Too many requests, try again later." })
});

const speedLimiter = slowDown({
    windowMs: 1000 * 10, // 60 Seconds
    delayAfter: 50, // max from IP
    delayMs: () => 3000,
});

export default { limiter, speedLimiter };