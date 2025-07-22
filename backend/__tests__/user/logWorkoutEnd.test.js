// tests/user/logWorkoutEndpoints.test.js

import request from "supertest";
import server from "../../server";
import { Stats, PersonalBest, ExerciseLog } from "../../models/index.js";

// Reusable error checker, mirrors your controller’s error shape
const errorChecker = async (res, status_code, error_message, error_code) => {
  expect(res.statusCode).toBe(status_code);
  expect(res.body.error).toEqual(error_message);
  expect(res.body.code).toEqual(error_code);
};

// Helper: register & login a fresh test user, returning { user, accessToken }
const createAuthUser = async (
  username = `u_${Date.now()}`,
  password = "StrongPass1!",
  email = `user${Date.now()}@test.com`
) => {
  // Register (also logs in)
  const regRes = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);
  const { user, accessToken } = regRes.body.data;
  return { user, accessToken };
};

describe("POST /api/v1/user/log‑workout", () => {
  it("returns 400 BAD_DATA if no payload is sent", async () => {
    const { accessToken } = await createAuthUser();
    const res = await request(server)
      .post("/api/v1/user/log-workout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({}); // entirely empty body
    await errorChecker(res, 400, "WorkoutLog Data Malformed", "BAD_DATA");
  });

  it("returns 400 BAD_DATA if payload has no log object", async () => {
    const { accessToken } = await createAuthUser();
    const res = await request(server)
      .post("/api/v1/user/log-workout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ data: {} }); // missing .data.log
    await errorChecker(res, 400, "WorkoutLog Data Malformed", "BAD_DATA");
  });

  it("returns 201 and the expected response shape when given a valid workout log", async () => {
    const { user, accessToken } = await createAuthUser();

    // Example workout log payload
    const validLog = {
      length: 3600,
      exercises: [
        {
          id: 0,
          weight: 110,
          reps: 8,
          sets: 3,
          cooldown: 60,
          notes: "Felt strong on bench press.",
        },
        {
          id: 1,
          weight: 150,
          reps: 5,
          sets: 4,
          cooldown: 90,
          notes: "Squats depth was solid.",
        },
        {
          id: 2,
          weight: 120,
          reps: 6,
          sets: 3,
          cooldown: 60,
          notes: "Focused on keeping back flat.",
        },
        {
          id: 3,
          weight: 60,
          reps: 10,
          sets: 3,
          cooldown: 45,
          notes: "Overhead press felt stable.",
        },
        {
          id: 4,
          weight: 20,
          reps: 12,
          sets: 3,
          cooldown: 30,
          notes: "Biceps pump finisher.",
        },
      ],
    };

    const res = await request(server)
      .post("/api/v1/user/log-workout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ data: { log: validLog } });

    expect(res.statusCode).toBe(201);
    // should return an array of events
    expect(Array.isArray(res.body.data.events)).toBe(true);
    // should include the total XP gained
    expect(typeof res.body.data.userGainedXP).toBe("number");
    // should include per‑category XP breakdown
    expect(typeof res.body.data.muscleCategoryGainedXP).toBe("object");
    // matches controller’s success message
    expect(res.body).toHaveProperty(
      "message",
      "User workout succesfully logged!"
    );
  });
});
