import request from "supertest";
import server from "../../server";

const errorChecker = async (res, status_code, error_message, error_code) => {
  expect(res.statusCode).toBe(status_code);
  expect(res.body.error).toEqual(error_message);
  expect(res.body.code).toEqual(error_code);
};

// Helper: register a fresh test user
const createTestUser = async (
  username = "TestUser",
  password = "StrongPass1!",
  email = "testuser@example.com"
) => {
  await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);
  return { username, email };
};

// Tests for POST /forgotUsername
describe.skip("POST /api/v1/auth/forgotUsername", () => {
  it("returns 400 BAD_DATA if no payload is sent", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotUsername")
      .send({});
    await errorChecker(res, 400, "Missing data payload", "BAD_DATA");
  });

  it("returns 400 BAD_DATA if email is missing", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotUsername")
      .send({ data: {} });
    await errorChecker(res, 400, "Missing email paylaod", "BAD_DATA");
  });

  it("returns 400 BAD_DATA if email is not registered", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotUsername")
      .send({ data: { email: "noone@nowhere.test" } });
    await errorChecker(
      res,
      400,
      "User does not exist with that email",
      "BAD_DATA"
    );
  });

  it("returns 200 and success message if email exists", async () => {
    const { email } = await createTestUser();
    const res = await request(server)
      .post("/api/v1/auth/forgotUsername")
      .send({ data: { email } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      `Username succesfully sent to ${email}`
    );
  });
});

// Tests for POST /forgotPassword
describe.skip("POST /api/v1/auth/forgotPassword", () => {
  it("returns 400 BAD_DATA if no payload is sent", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotPassword")
      .send({});
    await errorChecker(res, 400, "Missing data payload", "BAD_DATA");
  });

  it("returns 400 BAD_DATA if username is missing", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotPassword")
      .send({ data: {} });
    await errorChecker(res, 400, "Missing username paylaod", "BAD_DATA");
  });

  it("returns 400 BAD_DATA if username is not registered", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotPassword")
      .send({ data: { username: "NonExistentUser" } });
    await errorChecker(
      res,
      400,
      "User does not exist with that username",
      "BAD_DATA"
    );
  });

  it("returns 200 and success message if username exists", async () => {
    const res = await request(server)
      .post("/api/v1/auth/forgotPassword")
      .send({ data: { username: "TestUser" } });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty(
      "message",
      `Password reset link succesfully sent to TestUser`
    );
  });
});
