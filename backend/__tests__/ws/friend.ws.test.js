/**
 * Friends WS tests — Option A (attach to main server)
 * Connect to the SAME Socket.IO instance your app uses.
 */
import request from "supertest";
import { io as ClientIO } from "socket.io-client";
import server from "../../server"; // <- your real server
import NetworkService from "../../services/network.service.js"; // <- ws token

// keep overall test budget reasonable; your flows finish well under this

/* ------------------------------- helpers -------------------------------- */

async function ensureServer() {
  // Reuse the main server if already listening; otherwise start it once
  let shouldClose = false;
  if (!server.listening) {
    server.listen(process.env.PORT || 0, "0.0.0.0");
    await new Promise((r) => server.once("listening", r));
    shouldClose = true;
  }
  const addr = server.address();
  const port = typeof addr === "object" ? addr.port : addr;
  return { httpServer: server, port, shouldClose };
}

async function createHttpUser() {
  const username = `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
  const password = "StrongPass1!";
  const email = `user${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`;
  const reg = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);
  return reg.body.data.user;
}

async function issueWsToken(user) {
  return NetworkService.wsToken(user);
}

async function connectSocket(port, token) {
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

// Ack helper
function ack(socket, evt, data) {
  return new Promise((resolve, reject) => {
    socket.timeout(5000).emit(evt, data, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

/**
 * Wait for an event of a given type, from either emission channel:
 *  - "newEvent" (single object)
 *  - "newEvents" (array of objects)
 */
function waitForType(socket, type, ms = 7000) {
  return new Promise((resolve, reject) => {
    const done = (err, value) => {
      clearTimeout(timer);
      socket.off("newEvent", onOne);
      socket.off("newEvents", onMany);
      err ? reject(err) : resolve(value);
    };
    const onOne = (payload) => {
      if (payload?.type === type) done(null, payload);
    };
    const onMany = (arr) => {
      const match = (arr || []).find((e) => e?.type === type);
      if (match) done(null, match);
    };
    const timer = setTimeout(
      () => done(new Error(`Timeout waiting for type "${type}"`)),
      ms
    );
    socket.on("newEvent", onOne);
    socket.on("newEvents", onMany);
  });
}

/* ----------------------------- test wiring ------------------------------ */

let httpServer, port, shouldClose;
beforeAll(async () => {
  ({ httpServer, port, shouldClose } = await ensureServer());
});

afterAll(async () => {
  if (shouldClose) {
    await new Promise((r) => httpServer.close(() => r()));
  }
});

/* --------------------------------- tests -------------------------------- */

describe("Friends WS flows (attach to main io, listen to newEvent|newEvents)", () => {
  test("friend-request-initiated → target gets event", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      const wait = waitForType(bSock, "friend-request-initiated");
      const res = await ack(aSock, "addFriend", b.username);
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-request-initiated");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("friend-request-accepted → requester gets event", async () => {
    const a = await createHttpUser(); // requester
    const b = await createHttpUser(); // acceptor
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      const wait = waitForType(aSock, "friend-request-accepted");
      const res = await ack(bSock, "acceptRequest", a.id);
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-request-accepted");
      expect(evt.actorId).toBe(b.id);
      expect(evt.userId).toBe(a.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("friend-request-declined → requester gets event", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      const wait = waitForType(aSock, "friend-request-declined");
      const res = await ack(bSock, "declineRequest", a.id);
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-request-declined");
      expect(evt.actorId).toBe(b.id);
      expect(evt.userId).toBe(a.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("friend-request-cancelled → target gets event", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      const wait = waitForType(bSock, "friend-request-cancelled");
      const res = await ack(aSock, "cancelRequest", b.id);
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-request-cancelled");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("friend-removed → other friend gets event", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      await ack(bSock, "acceptRequest", a.id);
      const wait = waitForType(bSock, "friend-removed");
      const res = await ack(aSock, "removeFriend", b.id);
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-removed");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("friend-status-updated → broadcast to friends", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      await ack(bSock, "acceptRequest", a.id);
      const wait = waitForType(bSock, "friend-status-updated");
      const res = await ack(aSock, "statusChanged", "Busy");
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("friend-status-updated");
      expect(evt.payload?.status).toBe("Busy");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("user-profile-updated → fanned out", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      await ack(bSock, "acceptRequest", a.id);
      const wait = waitForType(bSock, "user-profile-updated");
      const res = await ack(aSock, "profileUpdated");
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("user-profile-updated");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });

  test("user-profile-pic-updated → fanned out", async () => {
    const a = await createHttpUser();
    const b = await createHttpUser();
    const aSock = await connectSocket(port, await issueWsToken(a));
    const bSock = await connectSocket(port, await issueWsToken(b));
    try {
      await ack(aSock, "addFriend", b.username);
      await ack(bSock, "acceptRequest", a.id);
      const wait = waitForType(bSock, "user-profile-pic-updated");
      const res = await ack(aSock, "profilePictureUpdated");
      expect(res?.ok).toBe(true);
      const evt = await wait;
      expect(evt.type).toBe("user-profile-pic-updated");
      expect(evt.actorId).toBe(a.id);
      expect(evt.userId).toBe(b.id);
    } finally {
      aSock.close();
      bSock.close();
    }
  });
});
