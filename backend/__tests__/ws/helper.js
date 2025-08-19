// __tests__/ws/ws.helpers.js
import request from "supertest";
import server from "../../server"; // adjust if your HTTP tests import from a different file
import { io as ClientIO } from "socket.io-client";
import NetworkService from "../../services/network.service.js"; // adjust path if needed

export async function createHttpUser() {
  const username = `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const password = "StrongPass1!";
  const email = `user${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;

  const reg = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);

  return reg.body.data.user; // { id, username, email, ... }
}

export async function issueWsToken(user) {
  // Uses your service wrapper over generateWebSocketToken
  return await NetworkService.wsToken(user);
}

export async function startHttpServer() {
  // Start on an ephemeral port so socket.io-client can connect
  const httpServer = server.listen(0);
  await new Promise((r) => httpServer.once("listening", r));
  const address = httpServer.address();
  const port = typeof address === "object" ? address.port : address;
  return { httpServer, port };
}

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

// Convenience: emit with ack and timeout
export function ack(socket, evt, data) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(evt, data, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}
