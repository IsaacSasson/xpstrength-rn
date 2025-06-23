import milestones from "../../shared/milestones.json" with { type: "json"};
import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";

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
                validateArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("Value to be stored is not of type array");
                    }

                    const duplicates = new Set()

                    value.forEach((val, idx) => {
                        if (typeof (val) != "number") {
                            throw new Error("ID attempted to be stored is not a number")
                        }

                        if (val < 0 || val > milestones.length) {
                            throw new Error("Milestone ID not found");
                        }

                        if (duplicates.has(val)) {
                            throw new Error("Milestone ID already in array");
                        } else {
                            duplicates.add(val);
                        }

                    })
                }
            }
        }
    },
    {
        tableName: "Milestones",
        timestamps: true,
        underscored: true
    }
)

export default Milestone;
