import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import { incomingRequestsFormat } from "../validators/friend/incomingRequestsFormat.js";
import { outgoingRequestFormat } from "../validators/friend/outgoingRequestFormat.js";
import { friendStoreFormat } from "../validators/friend/friendStoreFormat.js";

const Friend = sequelize.define(
    "Friend",
    {
        id: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, primaryKey: true, autoIncrement: true
        },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, unique: true, references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        incomingRequests: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                incomingRequestsFormat
            },
            comment: "All incoming requests stored for end user"
        },
        outgoingRequests: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                outgoingRequestFormat
            },
            comment: "All outgoing requests stored for end user"
        },
        friends: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                friendStoreFormat
            },
            comment: "All friends for end user"
        },
    },
    {
        tableName: "Friends",
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id'] },
        ],
    }
)

//TODO have friends tables be initialized as a BST in code when loaded in, in serializable format

export default Friend;