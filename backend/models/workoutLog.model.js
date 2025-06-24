import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import exercises from "../../shared/exercises.json" with { type: "json"};

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
            }
        },
        exercises: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                checkFormat(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("Value stored is not an array");
                    }
                    const REQUIRED = {
                        exercise: 'number',
                        reps: 'number',
                        sets: 'number',
                        cooldown: 'number'
                    };

                    value.forEach((obj, idx) => {
                        for (const [key, type] of Object.entries(REQUIRED)) {
                            if (!(key in obj))
                                throw new Error(`Item ${idx}: missing “${key}” key`);

                            if (typeof obj[key] !== type || !Number.isFinite(obj[key]))
                                throw new Error(`Item ${idx}: “${key}” must be a finite ${type}`);
                        }
                        if (obj.exercise < 0 || obj.exercise > exercises.length) {
                            throw new Error('Unknown Exercise ID');
                        }
                    })
                }
            }
        }
    },
    {
        tableName: "workoutLog",
        timestamps: true,
        underscored: true
    }
)

export default WorkoutLog;