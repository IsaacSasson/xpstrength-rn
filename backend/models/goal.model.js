import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { isTextClean } from "../validators/general/isTextClean.js";
import { typeGoalCheck } from "../validators/goal/typeGoalCheck.js";

const Goal = sequelize.define(
  "Goals",
  {
    id: {
      type: DataTypes.INTEGER,
      unique: true,
      primaryKey: true,
      allowNull: false,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: false,
      validate: {
        min: 3,
        max: 80,
        isTextClean,
      },
      comment: "Name of goal the user made.",
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "checkbox",
      validate: {
        typeGoalCheck,
      },
      comment: "the type of goal the user sets",
    },
    details: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "",
      validate: {
        max: 400,
      },
      comment: "description of goal that the user set",
    },
    total: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1,
        max: 1_000_000,
      },
      comment: "maximum amount of accumulation for the goal",
    },
    current: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
      },
      comment: "current accumalted value of goal",
    },
  },
  {
    tableName: "Goals",
    timestamps: true,
    underscored: true,

    indexes: [{ fields: ["user_id"] }],

    validate: {
      currentNotExceedTotal() {
        if (this.current > this.total) {
          throw new Error("Current value can't be greater than total.");
        }
      },
    },
  }
);

export default Goal;
