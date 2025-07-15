import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { statsValidator } from "../validators/stats/statsValidator.js";
import { totalStatsValidator } from "../validators/stats/totalStatsValidator.js";

const Stats = sequelize.define(
  "Stats",
  {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    total: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0 },
      validate: {
        totalStatsValidator,
      },
    },
    chest: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    core: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    back: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    shoulders: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    triceps: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    biceps: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
    legs: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: { sets: 0, reps: 0, volume: 0, xp: 0, level: 0 },
      validate: {
        statsValidator,
      },
    },
  },
  {
    tableName: "Stats",
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

//TODO have the stats total always be intact with the minor categorys

export default Stats;
