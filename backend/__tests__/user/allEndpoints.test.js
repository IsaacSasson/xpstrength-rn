// tests/user/users.routes.test.js
// Supertest + real DB (no mocks).
// Style mirrors your sample test file, with inline helpers and the same server import path.
// Profile-picture updates now use a binary blob (Buffer) read from ./__tests__/Images/goodPFP.jpg.

import request from "supertest";
import server from "../../server";
import fs from "fs/promises";

// Reusable error checker, mirrors your controller’s error shape
const errorChecker = async (res, status_code, error_message, error_code) => {
  expect(res.statusCode).toBe(status_code);
  expect(res.body.error).toEqual(error_message);
  expect(res.body.code).toEqual(error_code);
};

// Helper: register & login a fresh test user, returning { user, accessToken, password }
const createAuthUser = async (
  username = `u_${Date.now()}_${Math.floor(Math.random() * 1e6)}`,
  password = "StrongPass1!",
  email = `user${Date.now()}_${Math.floor(Math.random() * 1e6)}@test.com`
) => {
  const regRes = await request(server)
    .post("/api/v1/auth/register")
    .send({ data: { username, password, email } })
    .expect(201);

  const { user, accessToken } = regRes.body.data;
  return { user, accessToken, password };
};

// Utility: load a binary image buffer to use as a PFP blob
const loadPfpBuffer = async () => {
  // Use the exact path format you provided
  const path = "./__tests__/Images/goodPFP.jpg";
  const buf = await fs.readFile(path);
  // When JSON-serialized, Buffer becomes { type: 'Buffer', data: [...] }, which the server
  // can convert back with Buffer.from(obj.data). We send the Buffer directly.
  return buf;
};

describe("USER service routes (protected by auth middleware)", () => {
  describe("Profile picture lifecycle", () => {
    it("GET /profile-picture returns 404 when no PFP stored", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .get("/api/v1/user/profile-pic")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(404);
    });

    it("POST /profile-picture saves the blob and GET returns it", async () => {
      const { accessToken } = await createAuthUser();
      const imgBuf = await loadPfpBuffer();

      // Save
      const saveRes = await request(server)
        .post("/api/v1/user/profile-pic")
        .set("Authorization", `Bearer ${accessToken}`)
        .attach("newPFP", imgBuf, "goodPFP.jpg"); // field name `pfp` aligns with multer usage
      expect(saveRes.statusCode).toBe(201);
      expect(saveRes.body).toHaveProperty(
        "message",
        "Profile picture succesfully saved!"
      );

      // Retrieve
      const getRes = await request(server)
        .get("/api/v1/user/profile-pic")
        .set("Authorization", `Bearer ${accessToken}`)
        .buffer(true) // treat response as raw
        .parse((res, cb) => {
          const data = [];
          res.on("data", (chunk) => data.push(chunk));
          res.on("end", () => cb(null, Buffer.concat(data)));
        });
      expect(getRes.statusCode).toBe(200);
      expect(getRes.headers["content-type"]).toMatch(/image\/(jpeg|png)/);
      expect(Buffer.isBuffer(getRes.body)).toBe(true);
      expect(getRes.body.length).toBeGreaterThan(0);
    });

    it("POST /profile-picture 400 when no file attached", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .post("/api/v1/user/profile-pic")
        .set("Authorization", `Bearer ${accessToken}`)
        .field("dummy", "value"); // no file
      await errorChecker(res, 400, "Image data Malformed", "BAD_DATA");
    });
  });

  // --- Profile (without PFP updates) ---
  describe("GET /profile & PATCH /update-profile sans PFP", () => {
    it("requires auth header for GET /profile", async () => {
      const res = await request(server).get("/api/v1/user/profile");
      await errorChecker(
        res,
        401,
        "No authorization header provided",
        "NO_TOKEN"
      );
    });

    it("GET /profile returns sanitized data", async () => {
      const { user, accessToken } = await createAuthUser();
      const res = await request(server)
        .get("/api/v1/user/profile")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      const profile = res.body.data.profileData;
      expect(profile).toMatchObject({
        id: user.id,
        username: user.username,
        email: user.email,
      });
      expect(profile).not.toHaveProperty("password");
    });

    it("PATCH /update-profile 400 when no fields", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .patch("/api/v1/user/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: {} });
      await errorChecker(
        res,
        400,
        "No profile data added to update!",
        "BAD_DATA"
      );
    });

    it("PATCH /update-profile restricted fields require currentPassword", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .patch("/api/v1/user/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { newEmail: "new@email.com" } });
      await errorChecker(
        res,
        400,
        "Current password not sent to update restricted data",
        "BAD_DATA"
      );
    });

    it("PATCH /update-profile 403 on wrong currentPassword", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .patch("/api/v1/user/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            currentPassword: "WrongPass1!",
            newUsername: "bad_update",
          },
        });
      await errorChecker(res, 403, "Invalid Password", "FORBIDDEN");
    });

    it("PATCH /update-profile 201 on valid username/email/password update", async () => {
      const { accessToken, password } = await createAuthUser();
      const payload = {
        currentPassword: password,
        newUsername: `new_${Math.random().toString(36).slice(2, 8)}`,
        newEmail: `new_${Date.now()}@mail.com`,
        newPassword: "MuchStronger2!",
        newFitnessGoal: "I want to be able to bench 315 Pounds!",
      };
      const res = await request(server)
        .patch("/api/v1/user/update-profile")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: payload });
      expect(res.statusCode).toBe(201);
      expect(res.body.data).toHaveProperty("newAccessToken");
      const np = res.body.data.newProfile;
      expect(np.usernameChanged).toBe(payload.newUsername);
      expect(np.emailChanged).toBe(payload.newEmail);
      expect(np.passwordChanged).toBe("Changed");
      expect(np.fitnessGoalChanged).toBe("Changed");
    });
  });

  // --- Delete account ---
  describe("DELETE /delete-account", () => {
    it("deletes user and token becomes invalid", async () => {
      const { accessToken } = await createAuthUser();
      await request(server)
        .delete("/api/v1/user/delete-account")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(204);

      const res = await request(server)
        .get("/api/v1/user/profile")
        .set("Authorization", `Bearer ${accessToken}`);
      expect([401, 404]).toContain(res.statusCode);
    });
  });

  describe("Exercise history + notes", () => {
    it("GET /exercise-history returns 200 with history payload", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .get("/api/v1/user/exercise-history")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data.exerciseHistory");
      expect(res.body).toHaveProperty(
        "message",
        "User succesfully retieved their exercise history."
      );
    });

    it("POST /save-notes/:exerciseId saves a note and it appears in exercise-history", async () => {
      const { accessToken } = await createAuthUser();
      const exerciseId = 0;
      const note = "Great pump today";

      const save = await request(server)
        .post(`/api/v1/user/save-notes/${exerciseId}`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { notes: note } });
      expect([200, 201]).toContain(save.statusCode);

      const res = await request(server)
        .get("/api/v1/user/exercise-history")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      const hist = res.body.data.exerciseHistory;
      const record = hist[exerciseId] ?? hist[String(exerciseId)];
      expect(record).toBeTruthy();
      expect(record).toHaveProperty("notes", note);
    });

    it("POST /save-notes/:exerciseId 400 on missing notes", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .post(`/api/v1/user/save-notes/1`)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: {} });
      await errorChecker(
        res,
        400,
        "Invalid ExerciseID, Note, or User DATA",
        "BAD_DATA"
      );
    });
  });

  describe("History routes", () => {
    it("GET /history returns 200 and an array", async () => {
      const { accessToken } = await createAuthUser();
      // Produce at least one history entry by updating workout plan
      const wp = await request(server)
        .get("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      const oldPlan = wp.body.data.weeklyPlan.plan;
      const newPlan = oldPlan.map(() => -1);

      await request(server)
        .put("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { newPlan } })
        .expect(200);

      const res = await request(server)
        .get("/api/v1/user/history")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.userHistory)).toBe(true);
    });

    it("GET /history/:page/:pageSize paginates and rejects negative params", async () => {
      const { accessToken } = await createAuthUser();
      // Generate a couple of history entries
      await request(server)
        .post("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            name: "CW1",
            exercises: [
              { exercise: 0, sets: [{ reps: 10, weight: 4 }], cooldown: 0 },
            ],
          },
        })
        .expect(201);
      await request(server)
        .post("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            name: "CW2",
            exercises: [
              { exercise: 1, sets: [{ reps: 10, weight: 4 }], cooldown: 0 },
            ],
          },
        })
        .expect(201);

      const p1 = await request(server)
        .get("/api/v1/user/history/0/1")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      const p2 = await request(server)
        .get("/api/v1/user/history/1/1")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(p1.body.data.userHistory)).toBe(true);
      expect(Array.isArray(p2.body.data.userHistory)).toBe(true);

      const bad = await request(server)
        .get("/api/v1/user/history/-1/5")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(bad.statusCode).toBe(400);
      expect(String(bad.body.error || "")).toMatch(
        /Page and\/or Pagesize must be positive/i
      );
    });
  });

  describe("Workout plan routes", () => {
    it("GET /workout-plan returns 200 with plan array", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .get("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty("data.weeklyPlan.plan");
      expect(Array.isArray(res.body.data.weeklyPlan.plan)).toBe(true);
    });

    it("PUT /workout-plan 400 when missing newPlan", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .put("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: {} });
      await errorChecker(res, 400, "Malfored data payload", "BAD_DATA");
    });

    it("PUT /workout-plan 200 updates plan", async () => {
      const { accessToken } = await createAuthUser();
      const current = await request(server)
        .get("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      const oldPlan = current.body.data.weeklyPlan.plan;
      const newPlan = oldPlan.map(() => -1);

      const res = await request(server)
        .put("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { newPlan } });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.weeklyPlan.plan).toEqual(newPlan);
    });
  });

  describe("Custom workouts CRUD", () => {
    it("GET /custom-workouts returns 200 (array)", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .get("/api/v1/user/custom-workouts")
        .set("Authorization", `Bearer ${accessToken}`);
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.body.data.customWorkouts)).toBe(true);
    });

    it("POST /custom-workout 400 when missing name", async () => {
      const { accessToken } = await createAuthUser();
      const res = await request(server)
        .post("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            exercises: [
              { exercise: 1, sets: [{ reps: 10, weight: 4 }], cooldown: 0 },
            ],
          },
        });
      await errorChecker(res, 400, "Malformed CustomWorkout Data", "BAD_DATA");
    });

    it("Full CRUD cycle: create -> update -> include in plan -> delete (plan rewritten)", async () => {
      const { accessToken } = await createAuthUser();

      // Create
      const createRes = await request(server)
        .post("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            name: "Push Day",
            exercises: [
              { exercise: 1, sets: [{ reps: 10, weight: 4 }], cooldown: 0 },
            ],
          },
        })
        .expect(201);
      const cw = createRes.body.data.newCustomWorkout;
      expect(cw).toHaveProperty("id");

      // Update
      const updatedName = "Push Day v2";
      const updateRes = await request(server)
        .put("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({
          data: {
            id: cw.id,
            name: updatedName,
            exercises: [
              { exercise: 2, sets: [{ reps: 10, weight: 4 }], cooldown: 0 },
            ],
          },
        })
        .expect(201);
      const updated = updateRes.body.data.updatedCustomWorkout;
      expect(updated).toHaveProperty("id", cw.id);
      expect(updated).toHaveProperty("name", updatedName);

      // Set workout-plan to include this custom workout id at index 0
      const wp0 = await request(server)
        .get("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .expect(200);
      const plan = wp0.body.data.weeklyPlan.plan;
      const planWithCW = plan.map((x, i) => (i === 0 ? cw.id : x));
      await request(server)
        .put("/api/v1/user/workout-plan")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { newPlan: planWithCW } })
        .expect(200);

      // Delete the custom workout: service should rewrite plan entry to -1
      const delRes = await request(server)
        .delete("/api/v1/user/custom-workout")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ data: { id: cw.id } })
        .expect(201);

      const newPlan =
        delRes.body.data.newPlan?.plan || delRes.body.data.newPlan;
      expect(Array.isArray(newPlan)).toBe(true);
      expect(newPlan[0]).toBe(-1);
    });
  });
});
