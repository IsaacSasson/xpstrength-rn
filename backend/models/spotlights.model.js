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
    goalId: { 
      type: DataTypes.INTEGER, 
      references: { 
        model: "Goals", 
        id: "id" 
      }, 
      onDelete: "CASCADE" 
    },
    workoutId: { 
      type: DataTypes.INTEGER, 
      references: { 
        model: "workoutLog", 
        id: "id" 
      }, 
      onDelete: "CASCADE" 
    },
    milestoneId: { 
      type: DataTypes.INTEGER, 
      references: { 
        model: "Milestones", 
        id: "id" 
      }, 
      onDelete: "CASCADE" 
    },
    payload: {
      type: DataTypes.JSON, allowNull: true
    },
    equipped: {
      type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true
    }
  },
  {
    tableName: "Spotlight",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["user_id"] }],
    validate: {
      exactlyOneTarget() {
        const n = [this.goalId, this.workoutId, this.postId].filter(Boolean).length;
        if (n !== 1) {
          throw new Error("Exactly one of goalId, workoutId, postId must be set")
        };
      }
},
  }
);

export default Spotlight;
