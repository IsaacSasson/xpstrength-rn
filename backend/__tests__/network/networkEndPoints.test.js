import request from "supertest";
import server from "../../server";

const errorChecker = async (res, status_code, error_message, error_code) => {
  expect(res.statusCode).toBe(status_code);
  expect(res.body.error).toEqual(error_message);
  expect(res.body.code).toEqual(error_code);
};

const createUserAndGetAccessToken = async () => {
  const unique = Date.now();
  const username = `networkUser${unique}`;
  const password = "StrongPass1!";
  const email = `network${unique}@test.com`;

  // Register
  const regRes = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);
  // Register returns data.accessToken as well
  // But we'll log in to be consistent
  const loginRes = await request(server)
    .post("/api/v1/auth/login")
    .send({ data: { username, password } })
    .expect(200);

  return loginRes.body.data.accessToken;
};

describe.skip("Network Routes", () => {
  describe("POST /api/v1/network/logout", () => {
    it("returns 401 NO_TOKEN when no Authorization header is sent", async () => {
      const res = await request(server).post("/api/v1/network/logout");
      await errorChecker(
        res,
        401,
        "No authorization header provided",
        "NO_TOKEN"
      );
    });

    it("returns 401 NO_TOKEN when malformed Authorization header is sent", async () => {
      const res = await request(server)
        .post("/api/v1/network/logout")
        .set("Authorization", "Bearer");
      await errorChecker(
        res,
        401,
        "Missing or malformed access token",
        "NO_TOKEN"
      );
    });

    it("logs out successfully and clears the refreshToken cookie", async () => {
      const token = await createUserAndGetAccessToken();
      const res = await request(server)
        .post("/api/v1/network/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Success message
      expect(res.body).toEqual({ message: "User succesfully logged out!" });

      // Cookie cleared
      const setCookies = res.headers["set-cookie"] || [];
      expect(setCookies.some((c) => c.startsWith("refreshToken="))).toBe(true);
    });
  });

  describe.skip("GET /api/v1/network/websocket-token", () => {
    it("returns 401 NO_TOKEN when no Authorization header is sent", async () => {
      const res = await request(server).get("/api/v1/network/websocket-token");
      await errorChecker(
        res,
        401,
        "No authorization header provided",
        "NO_TOKEN"
      );
    });

    it("returns 401 NO_TOKEN when malformed Authorization header is sent", async () => {
      const res = await request(server)
        .get("/api/v1/network/websocket-token")
        .set("Authorization", "Token abc123");
      await errorChecker(
        res,
        401,
        "Missing or malformed access token",
        "NO_TOKEN"
      );
    });

    it("returns a WebSocket token when authenticated", async () => {
      const token = await createUserAndGetAccessToken();
      const res = await request(server)
        .get("/api/v1/network/websocket-token")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // Response shape
      expect(res.body).toHaveProperty("data.WsToken");
      expect(typeof res.body.data.WsToken).toBe("string");
      expect(res.body).toHaveProperty(
        "message",
        "User succesfully generated web-socket token!"
      );
    });

    it("returns 403 UNAUTHORIZED when using a valid token for a user who is already logged out", async () => {
      // 1) Get a fresh, authorized token
      const token = await createUserAndGetAccessToken();

      // 2) First logout succeeds (and unauthorizes them)
      await request(server)
        .post("/api/v1/network/logout")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      // 3) Second logout with same token now fails authorization
      const res = await request(server)
        .post("/api/v1/network/logout")
        .set("Authorization", `Bearer ${token}`);

      await errorChecker(res, 403, "User is not authorized", "UNAUTHORIZED");
    });
  });
});
