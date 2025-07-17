import { Sequelize } from "sequelize";
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV ?? "development";
const isDev = env === "development";
const isTest = env === "test";
const isProd = env === "production";

let cfg = null;

if (isTest) {
  cfg = {
    name: process.env.TEST_DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  };
} else if (isDev) {
  cfg = {
    name: process.env.DEV_DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  };
} else if (isProd) {
  cfg = {
    name: process.env.PROD_DB_NAME,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT,
  };
}

const sequelize = new Sequelize(cfg.name, cfg.user, cfg.pass, {
  host: cfg.host,
  port: cfg.port,
  dialect: "mysql",
  logging: isTest ? false : console.log,
});

export { sequelize };

export async function assertDatabaseConnected() {
  try {
    await sequelize.authenticate();
    console.log("DB connection established.");
    if (isTest) {
      await sequelize.sync({ force: true });
    } else if (isDev) {
      await sequelize.sync({ alter: true });
    } else if (isProd) {
      await sequelize.sync();
    }
    console.log("DB synced.");
    console.log("DB name: ", await sequelize.getDatabaseName());
  } catch (err) {
    console.error("Unable to connect to the database: ", err);
    process.exit(1);
  }
}

export async function closeDatabase() {
  await sequelize.close();
}

export default { sequelize, assertDatabaseConnected, closeDatabase };
