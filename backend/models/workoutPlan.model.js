import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { workoutPlanValidator } from "../validators/workoutPlan/workoutPlanValidator.js";

const WorkoutPlan = sequelize.define(
    "workoutPlan",
    {
        id: { type: DataTypes.INTEGER, unique: true, autoIncrement: true, primaryKey: true, allowNull: false },
        userId: {
            type: DataTypes.INTEGER, unique: true, allowNull: false, references: {
                model: "Users",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        plan: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [-1, -1, -1, -1, -1, -1, -1], validate: {
                workoutPlanValidator
            },
            comment: "Custom user weekly plan of custom workout | Mon->Sun"
        },
    },
    {
        underscored: true,
        tableName: "workoutPlan",
        timestamps: true,
        indexes: [
            { fields: ['user_id'] },
        ],
    }
)

export default WorkoutPlan