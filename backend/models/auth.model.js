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

Auth.authorize = async (userId, t = null) => {
    return Auth.update({
        authorized: true
    }, {
        where: {
            userId: userId
        },
        transaction: t,
    });
}

Auth.unauthorize = async (userId, t = null) => {
    return Auth.update({
        authorized: false
    }, {
        where: {
            userId: userId
        },
        transaction: t,
    });
}

Auth.unauthorize

export default Auth
