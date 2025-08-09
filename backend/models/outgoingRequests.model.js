import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

const OutgoingRequests = sequelize.define(
  "outgoingRequests",
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
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    outgoingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "outgoingRequests",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

//TODO have friends tables be initialized as a BST in code when loaded in, in serializable format

export default OutgoingRequests;
