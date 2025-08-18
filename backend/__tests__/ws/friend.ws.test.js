// __tests__/ws/friend.ws.test.js
import request from "supertest";
import { io as ClientIO } from "socket.io-client";
import server from "../../server"; // same as your HTTP tests
import NetworkService from "../../src/services/network.service.js";

jest.setTimeout(30000);

// ---- helpers (unchanged pattern, same as your original) ----
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
  return await NetworkService.wsToken(user);
}

async function startHttpServer() {
  const httpServer = server.listen(0);
  await new Promise((r) => httpServer.once("listening", r));
  const addr = httpServer.address();
  const port = typeof addr === "object" ? addr.port : addr;
  return { httpServer, port };
}

async function connectSocket(port, token) {
  return await new Promise((resolve, reject) => {
    const socket = ClientIO(`http://localhost:${port}`, {
      path: "/socket",
      transports: ["websocket"],
      auth: { token },
      reconnection: false,
      timeout: 6000,
    });
    socket.on("connect", () => resolve(socket));
    socket.on("connect_error", (err) => reject(err));
  });
}

function ack(socket, evt, data) {
  return new Promise((resolve, reject) => {
    socket.timeout(8000).emit(evt, data, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
  });
}

// ---- tiny FIX: listen to "newEvent" and filter by type ----
function waitForTypedEvent(socket, expectedType, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const onEvent = (event) => {
      if (event && event.type === expectedType) {
        clearTimeout(timer);
        socket.off("newEvent", onEvent);
        resolve(event);
      }
    };
    const timer = setTimeout(() => {
      socket.off("newEvent", onEvent);
      reject(new Error(`Timed out waiting for event type "${expectedType}"`));
    }, timeoutMs);
    socket.on("newEvent", onEvent);
  });
}

// ----------------------------------------------------------------

let httpServer, port;
let aUser, bUser, aToken, bToken, aSock, bSock;

beforeAll(async () => {
  const started = await startHttpServer();
  httpServer = started.httpServer;
  port = started.port;
});

afterAll(async () => {
  try {
    aSock?.close();
  } catch {}
  try {
    bSock?.close();
  } catch {}
  await new Promise((r) => httpServer.close(() => r()));
});

describe("Friends WS handlers end-to-end (original flow, live sockets)", () => {
  test("connect users A and B", async () => {
    aUser = await createHttpUser();
    bUser = await createHttpUser();
    aToken = await issueWsToken(aUser);
    bToken = await issueWsToken(bUser);

    aSock = await connectSocket(port, aToken);
    bSock = await connectSocket(port, bToken);

    expect(aSock.connected).toBe(true);
    expect(bSock.connected).toBe(true);
  });

  test("A -> addFriend(B.username): ack + B receives friend-request-initiated", async () => {
    // FIX 1: listen on "newEvent" and filter
    const evtPromise = waitForTypedEvent(bSock, "friend-request-initiated");

    const res = await ack(aSock, "addFriend", bUser.username);
    // your original console.log showed this shape already
    expect(res?.ok).toBe(true);
    expect(res.code).toBe("FRIEND_REQUEST_SENT");
    expect(res?.data?.deltas?.addToOutgoing).toBe(bUser.id);

    const evt = await evtPromise;
    expect(evt.type).toBe("friend-request-initiated");
  });

  test("B -> getAllKnownProfiles includes A", async () => {
    const res = await ack(bSock, "getAllKnownProfiles");
    expect(res?.ok).toBe(true);
    const ids = res.data.list.map((x) => x.id);
    expect(ids).toContain(aUser.id);
  });

  test("B -> acceptRequest(A.id): ack + A receives friend-request-accepted", async () => {
    // FIX 2: same typed-event wait via "newEvent"
    const evtPromise = waitForTypedEvent(aSock, "friend-request-accepted");

    const res = await ack(bSock, "acceptRequest", aUser.id);
    expect(res?.ok).toBe(true);
    expect(res.code).toBe("FRIEND_REQUEST_ACCEPTED");
    expect(res?.data?.deltas?.addToFriends).toBe(aUser.id);

    const evt = await evtPromise;
    expect(evt.type).toBe("friend-request-accepted");
  });

  test("A -> statusChanged('Online'): ack + B receives friend-status-updated", async () => {
    const evtPromise = waitForTypedEvent(bSock, "friend-status-updated");

    const res = await ack(aSock, "statusChanged", "Online");
    expect(res?.ok).toBe(true);
    expect(res.code).toBe("STATUS_CHANGED_FANNED_OUT");
    expect(res?.data?.status).toBe("Online");

    const evt = await evtPromise;
    const status = evt?.payload?.status ?? evt?.status;
    expect(status).toBe("Online");
  });

  test("A -> profileUpdated & profilePictureUpdated: both events arrive to B", async () => {
    const got1 = waitForTypedEvent(bSock, "user-profile-updated");
    const got2 = waitForTypedEvent(bSock, "user-profile-pic-updated");

    const p1 = await ack(aSock, "profileUpdated");
    expect(p1?.ok).toBe(true);

    const p2 = await ack(aSock, "profilePictureUpdated");
    expect(p2?.ok).toBe(true);

    await got1;
    await got2;
  });

  test("B can fetch A’s known profile + status", async () => {
    const prof = await ack(bSock, "getKnownProfile", aUser.id); // raw object
    expect(prof && typeof prof).toBe("object");

    const pic = await ack(bSock, "getKnownProfilePicture", aUser.id);
    // nullable is fine; no assertion

    const st = await ack(bSock, "getFriendStatus", aUser.id);
    const status = st?.data?.status ?? st?.status;
    expect(status).toBeDefined();
  });

  test("A -> removeFriend(B.id): ack + B receives friend-removed", async () => {
    const evtPromise = waitForTypedEvent(bSock, "friend-removed");
    const res = await ack(aSock, "removeFriend", bUser.id);
    expect(res?.ok).toBe(true);
    expect(res.code).toBe("FRIEND_REMOVED");
    await evtPromise;
  });

  test("A -> blockUser(B.id) then unblockUser(B.id): ack parsing", async () => {
    const blocked = await ack(aSock, "blockUser", bUser.id);
    expect(blocked?.ok).toBe(true);
    expect(blocked.code).toBe("USER_BLOCKED");
    expect(blocked?.data?.deltas?.addToBlocked).toBe(bUser.id);

    const unblocked = await ack(aSock, "unblockUser", bUser.id);
    expect(unblocked?.ok).toBe(true);
    expect(unblocked.code).toBe("USER_UNBLOCKED");
    expect(unblocked?.data?.deltas?.removeFromBlocked).toBe(bUser.id);
  });
});
