// __tests__/ws/helper.js
import request from "supertest";
import server from "../../server";
import { io as ClientIO } from "socket.io-client";
import NetworkService from "../../services/network.service.js";

export async function createHttpUser() {
  const username = `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const password = "StrongPass1!";
  const email = `user${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;

  const reg = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);

  return reg.body.data.user;
}

export async function issueWsToken(user) {
  return await NetworkService.wsToken(user);
}

// NEW: use the existing server if it's already listening, otherwise start one.
export async function ensureServer() {
  let startedExternally = false;

  if (server.listening) {
    startedExternally = true;
  } else {
    server.listen(process.env.PORT || 0);
    await new Promise((r) => server.once("listening", r));
  }

  const addr = server.address();
  const port = typeof addr === "object" ? addr.port : addr;

  return { httpServer: server, port, shouldClose: !startedExternally };
}

// unchanged
export async function connectSocket(port, token) {
  return await new Promise((resolve, reject) => {
    const socket = ClientIO(`http://localhost:${port}`, {
      path: "/socket",
      transports: ["websocket"],
      auth: { token },
      reconnection: false,
      timeout: 4000,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

export async function connectExpectError(port, token) {
  return await new Promise((resolve) => {
    const socket = ClientIO(`http://localhost:${port}`, {
      path: "/socket",
      transports: ["websocket"],
      auth: token ? { token } : undefined,
      reconnection: false,
      timeout: 2000,
    });
    socket.on("connect_error", (err) => {
      socket.close();
      resolve(err);
    });
  });
}

export function ack(socket, evt, data) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(evt, data, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}
