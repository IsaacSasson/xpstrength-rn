import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

const Streak = sequelize.define(
  "streak",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    currentStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
    highestStreak: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "Streak",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

export default Streak;
