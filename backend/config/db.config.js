import { Sequelize } from "sequelize";
import dotenv from "dotenv"
dotenv.config()

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT,
});

export async function assertDatabaseConnected() {
    try {

        await sequelize.authenticate();
        console.log("DB connection established.")

        console.log('DB schema: ', await sequelize.getDatabaseName());
    } catch (err) {
        console.error("Unable to connect to the database: ", err);
        process.exit(1);
    }
}

export default { sequelize, assertDatabaseConnected };