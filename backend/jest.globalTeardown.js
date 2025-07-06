import { closeDatabase } from "./config/db.config.js";

export default async () => {
    await closeDatabase();
}
