"use strict";

const path = require("path");

/**
 * We want the same Sequelize instance your app uses, so
 * require it from wherever you export it. Adjust the path
 * if your file layout differs.
 */
const { sequelize } = require(path.resolve(
  __dirname,
  "..",
  "config",
  "db.config.js"
));

const { models } = require(path.resolve(__dirname, "..", "models", "index.js"));
module.exports = {
  /**
   * `up` is the only lifecycle we need: it drops *and* recreates
   * every table, then runs all model definitions’ `sync` logic.
   */
  up: async () => {
    // Safety guard: bail unless we’re really in dev
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        `Refusing to force-sync because NODE_ENV=${process.env.NODE_ENV}. ` +
          "This seed is meant for development only!"
      );
    }

    console.log("⚠️  Dev reset seed: dropping & recreating all tables…");
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
    console.log("✅  Development database has been reset.");
  },

  /**
   * `down` is intentionally a no-op. There’s nothing to “undo”
   * because the entire schema has just been recreated.
   */
  down: async () => {
    // No rollback action required
  },
};

/*
Run this for fresh dev schema

NODE_ENV=development npx sequelize db:seed \
  --seed 20250804171500-reset-dev-db.js

*/
