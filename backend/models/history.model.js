import { Sequelize, DataTypes } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import { isTextClean } from '../validators/general/isTextClean.js';

const History = sequelize.define(
    "History",
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
                isTextClean
            },
            comment: "Text of the Loged Action Completed"
        },
    },
    {
        tableName: "History",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id', 'id'] },
        ],
    }
);

//Todo Write a Tester for History

export default History;