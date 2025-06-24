import { Sequelize, DataTypes } from "sequelize";
import forbiddenWords from "../validations/forbiddenWords.js";
import { sequelize } from "../config/db.config.js";
import exercises from "../../shared/exercises.json" with { type: "json" };

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
                isClean(value) {
                    if (value && forbiddenWords.some(word => value.toLowerCase().includes(word))) {
                        throw new Error("Username contains inappropriate language");
                    }
                }
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
        tableName: "customWorkouts",
        timestamps: true,
        underscored: true
    }
)

export default CustomWorkout