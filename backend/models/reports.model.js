import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

const Reports = sequelize.define(
  "reports",
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
    offenderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Users",
        key: "id",
      },
      onDelete: `CASCADE`,
    },
    report: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "reports",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);
export default Reports;
