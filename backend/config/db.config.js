import { Sequelize } from "sequelize";
import { GenericContainer } from 'testcontainers';
import mysql from 'mysql2/promise';
import dotenv from "dotenv"
dotenv.config()

const env = process.env.NODE_ENV ?? 'development';
const isDev = env === 'development';
const isTest = env === 'test';

const cfg = isTest
    ? {
        name: 'xpstrength_test',
        user: 'root',
        pass: '',
        host: null,
        port: 3306,
    }
    : {
        name: process.env.DB_NAME,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
    };

let stopContainer = async () => { };

async function bootstrapTestDatabase() {
    if (!isTest) return;

    if (!cfg.host) {
        console.log('🔧  Spawning MySQL test container …');
        const container = await new GenericContainer('mysql', '8')
            .withEnvironment('MYSQL_ROOT_PASSWORD', cfg.pass)
            .withEnvironment('MYSQL_DATABASE', cfg.name)
            .withExposedPorts(3306)
            .start();

        cfg.host = container.getHost();
        cfg.port = container.getMappedPort(3306);

        stopContainer = () => container.stop();
    } else {
        const conn = await mysql.createConnection({
            host: cfg.host,
            port: cfg.port,
            user: cfg.user,
            password: cfg.pass,
        });
        await conn.query(`CREATE DATABASE IF NOT EXISTS \`${cfg.name}\``);
        await conn.end();
    }
}

await bootstrapTestDatabase();

const sequelize = new Sequelize(cfg.name, cfg.user, cfg.pass, {
    host: cfg.host,
    port: cfg.port,
    dialect: 'mysql',
    logging: isTest ? false : console.log,
});

export { sequelize };

export async function assertDatabaseConnected() {
    try {

        await sequelize.authenticate();
        console.log("DB connection established.")
        if (isDev) {
            await sequelize.sync();
        }
        console.log("DB synced.")
        console.log('DB name: ', await sequelize.getDatabaseName());

    } catch (err) {
        console.error("Unable to connect to the database: ", err);
        process.exit(1);
    }
}

export async function closeDatabase() {
    await sequelize.close();
    await stopContainer();
}

export default { sequelize, assertDatabaseConnected, closeDatabase };