import request from 'supertest';
import app from '../server.js';

describe('GET /health', () => {
    it('responds 200 with JSON', async () => {
        const res = await request(app).get('/api/v1/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({});
    });
});
