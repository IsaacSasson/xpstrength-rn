import request from "supertest";
import app from "../../../server.js";

describe.skip("GET Page Not Found", () => {
    it("responds 404 Error", async () => {
        const res = await request(app).get('/DOESNOTEXIST');
        expect(res.statusCode).toBe(404);
    })
})