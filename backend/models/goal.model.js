import { Sequelize, DataTypes } from "sequelize";
import forbiddenWords from "../validations/forbiddenWords.js";
import { sequelize } from "../config/db.config.js";
import mapId from '../config/global-reference.json' with { type: "json" };

const goalTypes = mapId.goals.types;

const Goal = sequelize.define(
    "Goals",
    {
        id: {
            type: DataTypes.INTEGER, unique: true, primaryKey: true, allowNull: false, autoIncrement: true
        },
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
        type: {
            type: DataTypes.STRING, allowNull: false, defaultValue: "checkbox", validate: {
                isType(value) {
                    if (value && !goalTypes.some(word => value === word)) {
                        throw new Error("Unknown goal type");
                    }
                }
            }
        },
        details: {
            type: DataTypes.STRING, allowNull: false, defaultValue: "", validate: {
                max: 400,
            }
        },
        total: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: {
                min: 1,
                max: 1_000_000,
            }
        },
        current: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                min: 0,

            }
        }
    },
    {
        tableName: "Goals",
        timestamps: true,
        underscored: true,

        validate: {
            currentNotExceedTotal() {
                if (this.current > this.total) {
                    throw new Error("Current value can't be greater than total.");
                }
            }
        }
    }
)

export default Goal;