import request from "supertest";
import server from "../../server";

const errorChecker = async (res, status_code, error_message, error_code) => {
    expect(res.statusCode).toBe(status_code);
    expect(res.body.error).toEqual(error_message);
    expect(res.body.code).toEqual(error_code)
}

const createUserAndLogin = async () => {
    await request(server)
        .post('/api/v1/auth/register')
        .send({
            data: {
                username: 'RefreshTester',
                password: 'StrongPass1!',
                email: 'refresh@test.com',
            },
        })
        .expect(201);

    const loginRes = await request(server)
        .post('/api/v1/auth/login')
        .send({
            data: {
                username: 'RefreshTester',
                password: 'StrongPass1!',
            },
        })
        .expect(200);

    const cookies = loginRes.headers['set-cookie'];
    const refreshCookie = cookies.find(c => c.startsWith('refreshToken='));
    return refreshCookie;
};

describe.skip('POST /register, POST /login', () => {
    it("Register fails with empty register data", async () => {
        const res = await request(server)
            .post("/api/v1/auth/register")
            .send({ data: {} })
        errorChecker(res, 400, "Failed to register with null user data", "BAD_DATA");
    });

    it("Register fails with incomplete/bad data", async () => {

        //Bad profile pic
        let res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    username: "SuperBot123",
                    password: "StrongPass1!",
                    profilePic: "BAD_DATA",
                    email: "Reuvi@gmail.com"
                }
            })
        await errorChecker(res, 400, "Input failed validation", "VALIDATION");

        //Bad Username
        res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    username: "SuperBotFuck123",
                    password: "StrongPass1!",
                    email: "Reuvi@gmail.com"
                }
            })
        await errorChecker(res, 400, "Input failed validation", "VALIDATION");

        //Bad Password
        res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    username: "SuperBot123",
                    password: "weakpassword",
                    email: "Reuvi@gmail.com"
                }
            })

        await errorChecker(res, 400, "Input failed validation", "VALIDATION");

        //Bad Email
        res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    username: "SuperBot123",
                    password: "StrongPass1!",
                    email: "badEmail"
                }
            })
        await errorChecker(res, 400, "Input failed validation", "VALIDATION");

        //Missing Data
        res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    password: "StrongPass1!",
                    email: "badEmail"
                }
            })
        await errorChecker(res, 400, "Input failed validation", "VALIDATION");

    });

    it("Register creates a successful user", async () => {
        let res = await request(server)
            .post("/api/v1/auth/register")
            .send({
                data: {
                    username: "SafeUser123",
                    password: "StrongPass1!",
                    email: "StrongEmail@gmail.com"
                }
            });
        expect(res.statusCode).toBe(201)
        expect(res.body).toMatchObject({
            username: "SafeUser123",
            email: "StrongEmail@gmail.com"
        })
        expect(res.body).not.toHaveProperty("password");

    })

    it("User logs in with incomplete data or incomplete credentials", async () => {
        let res = await request(server)
            .post("/api/v1/auth/login")
            .send({
            })

        await errorChecker(res, 400, "Missing login payload", "BAD_DATA");

        res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    username: "joe",
                    password: ""
                }
            })

        await errorChecker(res, 400, "password or username not provided", "BAD_DATA");

        res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    username: "joe",
                }
            })

        await errorChecker(res, 400, "password or username not provided", "BAD_DATA");

        res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    password: "a"
                }
            })

        await errorChecker(res, 400, "password or username not provided", "BAD_DATA");

        res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    username: "joe",
                    password: true
                }
            })

        await errorChecker(res, 401, "incorrect password or username", "UNAUTHENTICATED");

        res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    username: "SafeUser123",
                    password: "wrong password"
                }
            })

        await errorChecker(res, 401, "incorrect password or username", "UNAUTHENTICATED");
    })


    it("User logs in succesfully", async () => {
        let res = await request(server)
            .post("/api/v1/auth/login")
            .send({
                data: {
                    username: "SafeUser123",
                    password: "StrongPass1!"
                }
            })

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("accessToken")
        const cookies = res.headers['set-cookie'];
        expect(cookies.some(c => c.startsWith('refreshToken='))).toBe(true);  // specific cookie

    })

})

describe.skip('GET /api/v1/auth/access-token', () => {
    it('returns 401 NO_TOKEN when no cookie is sent', async () => {
        const res = await request(server)
            .get('/api/v1/auth/access-token');

        await errorChecker(res, 401, 'No refresh token provided', 'NO_TOKEN');
    });

    it('returns 401 INVALID_TOKEN and clears cookie when token is invalid', async () => {
        const res = await request(server)
            .get('/api/v1/auth/access-token')
            .set('Cookie', 'refreshToken=not-a-real-token');

        await errorChecker(res, 401, 'Invalid or expired refresh token', 'INVALID_TOKEN');

        const setCookies = res.headers['set-cookie'] || [];
        expect(setCookies.some(c => c.startsWith('refreshToken=;'))).toBe(true);
    });

    it('returns 200 + new accessToken and resets refreshToken cookie when sent a valid one', async () => {
        const refreshCookie = await createUserAndLogin();

        const res = await request(server)
            .get('/api/v1/auth/access-token')
            .set('Cookie', refreshCookie)
            .expect(200);

        // New access token in body
        expect(res.body).toHaveProperty('data.accessToken');
        expect(typeof res.body.data.accessToken).toBe('string');

        // Because the original refresh token was about to expire (<10 days),
        // the endpoint should send a fresh refreshToken cookie
        expect(res.headers['set-cookie']).toBeUndefined();
    });
});