import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

const Auth = sequelize.define(
    'Auth',
    {
        id: {
            type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true
        },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE',
        },
        authorized: {
            type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false
        },
    },
    {
        tableName: "Auth",
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ["user_id"] }
        ]
    }
);

// Add Unit Tests for Auth

export default Auth
