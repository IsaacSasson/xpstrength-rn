import request from "supertest";
import server from "../../server";

describe.skip("testing rate limiter", () => {
    it("responds with 'Too many requests, try again later.'", async () => {

        let res = null;

        //maxout 200 req in one minute
        for (let i = 0; i < 200; i++) {
            res = await request(server).get("/api/v1/health");
            expect(res.status).toBe(200);
        }

        res = await request(server).get("/api/v1/health");
        expect(res.body).toEqual({ "conditions": { "error": "Too many requests, try again later.", }, })
    }, 60_000)
})