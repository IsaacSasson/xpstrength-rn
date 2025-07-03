import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { checkLogWorkoutFormat } from "../validators/logWorkout/checkLogWorkoutFormat.js";

const WorkoutLog = sequelize.define(
    "workoutLog",
    {
        id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, references: {
                model: "Users",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        length: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true
            },
            comment: "Length in seconds of the total workout"
        },
        exercises: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                checkLogWorkoutFormat
            },
            comment: "List of exercises completed in the workout"
        },
    },
    {
        tableName: "workoutLog",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id', 'id'] },
        ],
    }
)

export default WorkoutLog;