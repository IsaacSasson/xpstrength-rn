import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { checkMilestoneFormat } from "../validators/milestone/checkMilestoneFormat.js";

const Milestone = sequelize.define(
    "Milestones",
    {
        id: {
            type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, unique: true, primaryKey: true
        },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, references: {
                model: 'Users',
                key: "id"
            },
            onDelete: 'CASCADE'
        },
        milestones: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                notNull: true,
                checkMilestoneFormat
            },
            comment: "Array of milestones user accomplished"
        },
    },
    {
        tableName: "Milestones",
        timestamps: true,
        underscored: true
    }
)

export default Milestone;
