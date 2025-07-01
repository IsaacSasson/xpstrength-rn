import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import sharp from "sharp";
import bcrypt from "bcrypt"
import dotenv from 'dotenv'

//Models and Config
import Friend from "./friend.model.js";
import Milestone from "./milestone.model.js";
import Goal from "./goal.model.js";
import CustomWorkout from "./customWorkout.model.js";
import WorkoutLog from "./workoutLog.model.js";
import PersonalBest from "./personalBests.model.js";
import ExerciseLog from "./exerciseLog.model.js";
import WorkoutPlan from "./workoutPlan.model.js";
import Stats from "./stats.model.js";

import { checkShopProductFormat } from "../validators/user/checkShopProductFormat.js";
import { isTextClean } from "../validators/general/isTextClean.js";
import { checkAuthType } from "../validators/user/checkAuthType.js";

dotenv.config()

const User = sequelize.define(
    'User',
    {
        id: { type: DataTypes.INTEGER, allowNull: false, autoIncrement: true, primaryKey: true },
        username: {
            type: DataTypes.STRING(30), allowNull: false, unique: true, validate:
            {
                notEmpty: true,
                len: [3, 30],
                is: ["^[A-Za-z0-9_]+$", 'i'],
                isTextClean
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
                checkAuthType
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
                checkShopProductFormat
            },
            comment: "Array of shop unlock by product ID"
        }
    },
    {
        tableName: 'Users',
        timestamps: true,
        underscored: true,
    }
);

User.beforeSave("Hash Password", async (user, options) => {
    if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, parseInt(process.env.SALT_ROUNDS, 10));
    }
});

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
});

User.afterCreate("Create Associating Friends Row", async (user, options) => {
    await Friend.create({
        userId: user.id,
        incomingRequests: [],
        outgoingRequests: [],
        friends: [],
    }, { transaction: options.transaction });
});

User.afterCreate("Create Associating Milestones Row", async (user, options) => {
    await Milestone.create({
        userId: user.id,
        milestones: []
    }, { transaction: options.transaction });
});

User.afterCreate("Create Associating Personal Bests Row", async (user, options) => {
    await PersonalBest.create({
        userId: user.id
    }, { transaction: options.transaction });
});

User.afterCreate("Create Associating ExerciseLog Row", async (user, options) => {
    await ExerciseLog.create({
        userId: user.id
    }, { transaction: options.transaction });
});

User.afterCreate("Create Associating Plan Row", async (user, options) => {
    await WorkoutPlan.create({
        userId: user.id
    }, { transaction: options.transaction });
});

User.afterCreate("Create Associating Stats Row", async (user, options) => {
    await Stats.create({
        userId: user.id
    }, { transaction: options.transaction });
});

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
User.hasMany(CustomWorkout, { foreignKey: 'userId' });
CustomWorkout.belongsTo(User, { foreignKey: 'userId' });

//User-workoutLog Relationships
User.hasMany(WorkoutLog, { foreignKey: "userId" });
WorkoutLog.belongsTo(User, { foreignKey: 'userId' });

//User-personalBests Relationships
User.hasOne(PersonalBest, { foreignKey: "userId" });
PersonalBest.belongsTo(User, { foreignKey: "userId" });

//User-exerciseLog Relationships
User.hasOne(ExerciseLog, { foreignKey: "userId" });
ExerciseLog.belongsTo(User, { foreignKey: "userId" });

//User-plannedWorkout RelationShips
User.hasOne(WorkoutPlan, { foreignKey: "userId" });
WorkoutPlan.belongsTo(User, { foreignKey: "userId" });

//User-Stats Relationships
User.hasOne(Stats, { foreignKey: "userId" });
Stats.belongsTo(User, { foreignKey: "userId" });

export default User;