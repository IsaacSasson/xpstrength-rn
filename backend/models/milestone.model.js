import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import {
  checkMilestoneFormat,
  validateProfilePic,
} from "../validators/milestone/checkMilestoneFormat.js";

const Milestone = sequelize.define(
  "Milestones",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      unique: true,
      primaryKey: true,
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
    milestone: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        notNull: true,
        checkMilestoneFormat,
      },
      comment: "Milestone completed assigned to user",
    },
    image: {
      type: DataTypes.BLOB,
      allowNull: true,
      defaultValue: null,
      validate: {
        validateProfilePic,
      },
      comment:
        "Image validation on backend so no malicious code input. PFP in blob format.",
    },
  },
  {
    tableName: "Milestones",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

export default Milestone;
