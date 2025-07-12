import pino from "pino";

const prettyTransport = pino.transport({
  target: "pino-pretty",
  options: {
    colorize: true,
    customColors: "info:yellow",
  },
});

export const logger = pino(
  { level: process.env.LOG_LEVEL || "info" },
  prettyTransport
);

export function requestLogger(req, res, next) {
  const started = Date.now();
  const { method, originalUrl: url } = req;

  const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;

  const safeBody = () => {
    if (!req.body || !Object.keys(req.body).length) return undefined;
    const clone = { ...req.body };
    ["password", "token"].forEach((k) => delete clone[k]);
    return clone;
  };

  res.on("finish", () => {
    logger.info(
      {
        ts: Date.now(),
        method,
        url,
        status: res.statusCode,
        ms: Date.now() - started,
        ip: clientIp,
        body: safeBody(),
      },
      "request-complete"
    );
  });

  next();
}
