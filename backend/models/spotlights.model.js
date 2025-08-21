import { Sequelize, DataTypes, BOOLEAN } from "sequelize";
import { sequelize } from "../config/db.config.js";
import spotLightTypes from "../../shared/spotlightTypes.json" with {type: 'json'};

const Spotlight = sequelize.define(
  "Spotlight",
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
    type: {
      type: DataTypes.STRING(40),
      allowNull: false,
      validate: {
        isIn: [spotLightTypes]
      },
    },
    references: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: true
    },
    equiped: {
      type: BOOLEAN, allowNull: false, defaultValue: true
    }
  },
  {
    tableName: "Spotlight",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
  }
);

export default Spotlight;
