import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import sharp from "sharp";
import forbiddenWords from "../validations/forbiddenWords.js";
import bcrypt from "bcrypt"
import dotenv from 'dotenv'

//Models and Config
import Friend from "./friend.model.js";
import Milestone from "./milestone.model.js";
import Goal from "./goal.model.js";
import customWorkout from "./customWorkout.model.js";
import workoutLog from "./workoutLog.model.js";
import shopUnlocks from "../../shared/shop_products.json" with { type: "json"};
import authorityTypes from "../../shared/role_types.json" with { type: "json" };

dotenv.config()

const User = sequelize.define(
    'User',
    {
        id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
        username: {
            type: DataTypes.STRING(16), allowNull: false, unique: true, validate:
            {
                notEmpty: true,
                len: [3, 16],
                is: ["^[A-Za-z0-9_]+$", 'i'],
                isClean(value) {
                    if (value && forbiddenWords.some(word => value.toLowerCase().includes(word))) {
                        throw new Error("Username contains inappropriate language");
                    }

                }
            },
            comment: "Username must be between 3 and 16 characters, alphanumeric, and cannot contain bad words."
        },
        password: {
            type: DataTypes.STRING, allowNull: false, validate:
            {
                notEmpty: true,
                len: [8, 100],
                is: {
                    args: ["^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$"],
                    msg: 'Password must be at least 8 characters and include uppercase, lowercase, number, and symbol.',
                }
            },
            comment: "Password must be hashed before entry, and must be validated before stored/updated."
        },
        email: {
            type: DataTypes.STRING(50), allowNull: false, unique: true, validate: {
                isEmail: true,
                max: 50,
                min: 3,
            },
            comment: "Users email, must be unique."
        },
        profilePic: {
            type: DataTypes.BLOB, allowNull: true, defaultValue: null,
            comment: "Image validation on backend so no malicious code input. PFP in blob format."
        },
        authority: {
            type: DataTypes.STRING, allowNull: false, defaultValue: "basic", validate: {
                checkType(value) {
                    if (value && !(authorityTypes.some(role => value === role.access))) {
                        throw new Error("Authority type unknown");
                    }
                }
            },
            comment: "Users scope access must be one of three types"
        },
        level: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                max: 100,
                min: 0,
            },
            comment: "Users level"
        },
        xp: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                min: 0,
            },
            comment: "Users total xp"
        },
        totalFriends: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                min: 0,
            },
            comment: "Users total friends"
        },
        totalWorkouts: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                min: 0,
            },
            comment: "Users total workouts"
        },
        totalTimeWorkedOut: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                min: 0,
            },
            comment: "Total time user worked out in seconds"
        },
        totalCoins: {
            type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: {
                isNumeric: true,
                notNull: true,
                notEmpty: true,
                min: 0,
            },
            comment: "Total coins user owns"
        },
        shopUnlocks: {
            type: DataTypes.JSON, allowNull: false, defaultValue: [], validate: {
                isNumberArray(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("Shop unlocks must be an array");
                    }

                    const duplicates = new Set()

                    value.forEach((id) => {
                        //DataType is a number
                        if (typeof (id) != "number" || !Number.isInteger(id)) {
                            throw new Error("Shop item ID is not a number");
                        }
                        //Must be a Valid ID
                        if (id < 0 || id > shopUnlocks.length) {
                            throw new Error("Shop item ID not found in global reference")
                        }
                        //No Duplicate Data
                        if (duplicates.has(id)) {
                            throw new Error("Shop ID is duplicated in array");
                        } else {
                            duplicates.add(id);
                        }
                    })
                }
            },
            comment: "Array of shop unlock by product ID"
        }
    },
    {
        tableName: 'Users',
        timestamps: true,
        underscored: true,
    }
)

User.beforeSave("Hash Password", async (user, options) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.SALT_ROUNDS, 10));
    }
})

User.beforeSave("Validate Images", async (user, options) => {
    if (user.changed('profilePic') && user.profilePic) {
        try {
            const image = sharp(user.profilePic);
            const metadata = await image.metadata();

            if (metadata.format !== 'jpeg' && metadata.format !== 'png') {
                throw new Error('Unsupported image type');
            }

            const safeBuffer = await image
                .resize({ width: 400, height: 400, fit: 'inside' }) // Max Size 400 x 400
                .toFormat(metadata.format)
                .toBuffer();

            user.profilePic = safeBuffer;
        } catch (err) {
            throw new Error('Invalid image uploaded');
        }
    }
})

User.afterCreate("Create Associating Friends Row", async (user, options) => {
    await Friend.create({
        userId: user.id,
        incomingRequests: [],
        outgoingRequests: [],
        friends: [],
    }, { transaction: options.transaction });
})

User.afterCreate("Create Associating Milestones Row", async (user, options) => {
    await Milestone.create({
        userId: user.id,
        milestones: []
    }, { transaction: options.transaction });
})

// User-Friend Relationships
User.hasOne(Friend, { foreignKey: 'userId' });
Friend.belongsTo(User, { foreignKey: 'userId' });

// User-Milestone Relationships
User.hasOne(Milestone, { foreignKey: 'userId' });
Milestone.belongsTo(User, { foreignKey: 'userId' });

//User-Goal Relationships
User.hasMany(Goal, { foreignKey: 'userId' });
Goal.belongsTo(User, { foreignKey: 'userId' });

//User-CustomWorkout Relationships
User.hasMany(customWorkout, { foreignKey: 'userId' });
customWorkout.belongsTo(User, { foreignKey: 'userId' });

//User-workoutLog Relationships
User.hasMany(workoutLog, { foreignKey: "userId" });
workoutLog.belongsTo(User, { foreignKey: 'userId' });

export default User;