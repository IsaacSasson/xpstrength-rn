// ----------------- Imports
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import v1Router from './routes/v1.routes.js';
import rateLimiter from './middleware/rateLimit.middleware.js'
import { assertDatabaseConnected, sequelize } from './config/db.config.js';
import models from './models/index.js';
import { requestLogger } from './middleware/log.middleware.js';

// ----------------- Config
dotenv.config();
const app = express();

//  Deserialziers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS
app.use(
    cors({
        origin: [
            'https://your-spa-domain.com',
            `http://localhost:${process.env.PORT}`,
            'http://localhost:3000'
        ],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

//  Rate Limiters
app.use(rateLimiter.limiter);
app.use(rateLimiter.speedLimiter);

//  Morgan
if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'))
}

//  Routes
app.use('/api/v1', requestLogger, v1Router);

//  Boot sequence
async function start() {
    try {
        // fail-fast if DB is unavailable
        await assertDatabaseConnected();

        const PORT = process.env.PORT || 3000;

        if (process.env.NODE_ENV === 'production') {
            app.listen(PORT, '0.0.0.0', () =>
                console.log(`✅  Prod server listening on: ${PORT}`)
            );
        } else if (process.env.NODE_ENV === 'development') {
            app.listen(PORT, () =>
                console.log(`✅  Dev server listening at http://localhost:${PORT}`)
            );
        } else {
            throw new Error('UNKNOWN NODE_ENV setting');
        }
    } catch (err) {
        console.error('🚨  Startup failed:', err);
        process.exit(1);
    }
}

if (process.env.NODE_ENV !== 'test') start();

export default app;
