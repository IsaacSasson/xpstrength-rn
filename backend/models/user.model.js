import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config";
import sharp from sharp
import forbiddenWords from "../validations/forbiddenWords";
import bcrypt from "bcrypt"
import dotenv from 'dotenv'
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
            type: DataTypes.STRING, allowNull: false, unique: true, validate: {
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
                    auth = ["basic", "pro", "admin"];
                    if (value && !(auth.some(word => value === word))) {
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
            type: DataTypes.ARRAY(DataTypes.INTEGER), allowNull: false, defaultValue: [], validate: {
                isNumber(value) {
                    if (!Array.isArray(value)) {
                        throw new Error("Shop unlocks must be an array");
                    }
                    value.forEach((id) => {
                        if (typeof (id) != "number" || !Number.isInteger(id)) {
                            throw new Error("Shop item ID is not a number");
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
        user.password = await bcrypt.hash(user.password, process.env.SALT_ROUNDS);
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
            throw new Error('Invalid image uploaded: ' + err.message);
        }
    }
})

await User.sync();