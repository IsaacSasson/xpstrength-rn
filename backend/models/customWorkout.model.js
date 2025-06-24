import { Sequelize, DataTypes } from "sequelize";
import { isTextClean } from "../validators/general/isTextClean.js";
import { checkCustomWorkoutFormat } from "../validators/customWorkout/checkCustomWorkoutFormat.js";
import { sequelize } from "../config/db.config.js";

const CustomWorkout = sequelize.define(
    "customWorkouts",
    {
        id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, references: {
                model: "Users",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        name: {
            type: DataTypes.STRING, allowNull: false, unique: false, validate: {
                min: 3,
                max: 80,
                isTextClean,
            },
            comment: "The name of the created custom workout."
        },
        exercises: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                checkCustomWorkoutFormat
            },
            comment: "Array of inOrder exercise objects to perform for workout."
        },
    },
    {
        tableName: "customWorkouts",
        timestamps: true,
        underscored: true
    }
)

export default CustomWorkout