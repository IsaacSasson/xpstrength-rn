// __tests__/ws/common.ws.test.js
import {
  startHttpServer,
  createHttpUser,
  issueWsToken,
  connectSocket,
  connectExpectError,
  ack,
} from "./helper.js";

let httpServer;
let port;

beforeAll(async () => {
  const started = await startHttpServer();
  httpServer = started.httpServer;
  port = started.port;
});

afterAll(async () => {
  await new Promise((r) => httpServer.close(() => r()));
});

describe("WS auth + common handlers", () => {
  test("rejects connection with no token (auth middleware)", async () => {
    const err = await connectExpectError(port);
    expect(String(err?.message || err)).toMatch(
      /No Token|UNAUTHORIZED|NO_TOKEN/i
    );
  });

  test("connects with a valid token and responds to ping/pong", async () => {
    const user = await createHttpUser();
    const token = await issueWsToken(user);
    const socket = await connectSocket(port, token);

    const pong = await new Promise((resolve) => {
      socket.once("pong", (payload) => resolve(payload));
      socket.emit("ping");
    });

    expect(pong).toHaveProperty("ts"); // handler emits { ts: Date.now() }
    socket.close();
  });

  test("dataSync returns arrays (not raw Sets)", async () => {
    const user = await createHttpUser();
    const token = await issueWsToken(user);
    const socket = await connectSocket(port, token);

    const payload = await new Promise((resolve) => {
      socket.once("dataSync", (p) => resolve(p));
      socket.emit("dataSync");
    });

    expect(Array.isArray(payload.friends)).toBe(true);
    expect(Array.isArray(payload.incomingRequests)).toBe(true);
    expect(Array.isArray(payload.outgoingRequests)).toBe(true);
    expect(Array.isArray(payload.blocked)).toBe(true);

    socket.close();
  });
});
