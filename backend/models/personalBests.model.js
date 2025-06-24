import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { personalBestValidator } from "../validators//personalBests/personalBestValidator.js";


const PersonalBest = sequelize.define(
    "PersonalBests",
    {
        id: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true, unique: true },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, references: {
                model: "Users",
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        chest: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for chest"
        },
        core: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for core"
        },
        back: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for back"
        },
        shoulders: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for shoulders"
        },
        triceps: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for triceps"
        },
        biceps: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for biceps"
        },
        legs: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                personalBestValidator
            },
            comment: "Array of all personal best exercises for legs"
        },
    },
    {
        tableName: "PersonalBests",
        underscored: true,
        timestamps: true
    }
);

export default PersonalBest;