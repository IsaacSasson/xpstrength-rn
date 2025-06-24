import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { isValidExerciseHistory } from "../validators/exerciseLog/isValidExerciseHistory.js";

const ExerciseLog = sequelize.define(
    "exerciseLog",
    {
        id: { type: DataTypes.INTEGER, unique: true, primaryKey: true, autoIncrement: true, allowNull: false },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, references: {
                model: "Users",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        exerciseHistory: {
            type: DataTypes.JSON, allowNull: false, defaultValue: {}, validate: {
                isValidExerciseHistory
            },
            comment: "Exercise history of most recent completed exercises."
        }
    },
    {
        tableName: "exerciseLog",
        underscored: true,
        timestamps: true
    }
)

export default ExerciseLog;