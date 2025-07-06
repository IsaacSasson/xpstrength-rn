import models from './models/index.js';
import { assertDatabaseConnected } from './config/db.config.js';

export default async () => {
    await assertDatabaseConnected();
};
