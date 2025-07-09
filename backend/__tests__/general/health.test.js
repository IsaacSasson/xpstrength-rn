import request from 'supertest';
import server from '../../server.js';

describe('GET /health', () => {
    it('responds 200 with JSON', async () => {
        const res = await request(server).get('/api/v1/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toEqual({});
    });
});
