import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

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
                isNumberArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("incomingRequests must be an array Obj.");
                    }
                    const duplicates = new Set();
                    value.forEach((id) => {
                        if (typeof (id) != "number" || !Number.isInteger(id)) {
                            throw new Error("incomingRequests ID must be a valid Integer.");
                        }
                        if (duplicates.has(id)) {
                            throw new Error("incomingRequests ID is duplicated in array");
                        } else {
                            duplicates.add(id);
                        }
                    })
                }
            },
            comment: "All incoming requests stored for end user"
        },
        outgoingRequests: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                isNumberArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("outgoingRequests must be an array Obj.");
                    }
                    const duplicates = new Set();
                    value.forEach((id) => {
                        if (typeof (id) != "number" || !Number.isInteger(id)) {
                            throw new Error("outgoingRequests ID must be a valid Integer.");
                        }
                        if (duplicates.has(id)) {
                            throw new Error("outgoing ID is duplicated in array");
                        } else {
                            duplicates.add(id);
                        }
                    })
                }
            },
            comment: "All outgoing requests stored for end user"
        },
        friends: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                isNumberArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("friends must be an array Obj.");
                    }
                    const duplicates = new Set();
                    value.forEach((id) => {
                        if (typeof (id) != "number" || !Number.isInteger(id)) {
                            throw new Error("friends ID must be a valid Integer.");
                        }
                        if (duplicates.has(id)) {
                            throw new Error("friends ID is duplicated in array");
                        } else {
                            duplicates.add(id);
                        }
                    })
                }
            },
            comment: "All friends for end user"
        },
    },
    {
        tableName: "Friends",
        timestamps: true,
        underscored: true,
    }


)

export default Friend;