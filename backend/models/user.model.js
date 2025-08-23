import { Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../config/db.config.js";
import sharp from "sharp";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

//Models and Config
import Friend from "./friends.model.js";
import IncomingRequests from "./incomingRequests.model.js";
import OutgoingRequests from "./outgoingRequests.model.js";
import Blocked from "./blocked.model.js";
import Reports from "./reports.model.js";
import Milestone from "./milestone.model.js";
import Goal from "./goal.model.js";
import CustomWorkout from "./customWorkout.model.js";
import WorkoutLog from "./workoutLog.model.js";
import PersonalBest from "./personalBests.model.js";
import ExerciseLog from "./exerciseLog.model.js";
import WorkoutPlan from "./workoutPlan.model.js";
import Stats from "./stats.model.js";
import History from "./history.model.js";
import Event from "./eventQueue.model.js";
import Auth from "./auth.model.js";
import Spotlight from "./spotlights.model.js";

import { checkShopProductFormat } from "../validators/user/checkShopProductFormat.js";
import { isTextClean } from "../validators/general/isTextClean.js";
import { checkAuthType } from "../validators/user/checkAuthType.js";
import { validateProfilePic } from "../validators/user/validateProfilePic.js";

dotenv.config();

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    /*
    publicId: {     
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    unique: true,
    allowNull: false,
  },
  */
    username: {
      type: DataTypes.STRING(30),
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [3, 30],
        is: ["^[A-Za-z0-9_]+$", "i"],
        isTextClean,
      },
      comment:
        "Username must be between 3 and 16 characters, alphanumeric, and cannot contain bad words.",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        isStrongPlaintext(value) {
          const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{8,}$/;
          if (!re.test(value)) {
            throw new Error(
              "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol."
            );
          }
        },
      },
      comment:
        "Password must be hashed before entry, and must be validated before stored/updated.",
    },
    email: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        max: 50,
        min: 3,
      },
      comment: "Users email, must be unique.",
    },
    fitnessGoal: {
      type: DataTypes.STRING(60),
      allowNull: true,
      unique: false,
      validate: {
        isTextClean,
      },
      comment: "fitnessGoal user writes for themselves",
    },
    profilePic: {
      type: DataTypes.BLOB,
      allowNull: true,
      defaultValue: null,
      validate: {
        validateProfilePic,
      },
      comment:
        "Image validation on backend so no malicious code input. PFP in blob format.",
    },
    authority: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "basic",
      validate: {
        checkAuthType,
      },
      comment: "Users scope access must be one of three types",
    },
    level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        max: 100,
        min: 0,
      },
      comment: "Users level",
    },
    xp: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        min: 0,
      },
      comment: "Users total xp",
    },
    totalFriends: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        min: 0,
      },
      comment: "Users total friends",
    },
    totalWorkouts: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        min: 0,
      },
      comment: "Users total workouts",
    },
    totalTimeWorkedOut: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        min: 0,
      },
      comment: "Total time user worked out in seconds",
    },
    totalCoins: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        isNumeric: true,
        notNull: true,
        notEmpty: true,
        min: 0,
      },
      comment: "Total coins user owns",
    },
    shopUnlocks: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      validate: {
        checkShopProductFormat,
      },
      comment: "Array of shop unlock by product ID",
    },
  },
  {
    tableName: "Users",
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ["id"] }],
  }
);

User.beforeUpdate("Hash Password", async (user, options) => {
  if (user.changed("password")) {
    const password = await bcrypt.hash(
      user.password,
      parseInt(process.env.SALT_ROUNDS, 10)
    );
    await User.update(
      { password: password },
      {
        where: {
          id: user.id,
        },
        transaction: options.transaction,
        validate: false,
        hooks: false,
      }
    );
  }
});

User.beforeCreate("Hash Password", async (user, options) => {
  if (user.changed("password")) {
    user.password = await bcrypt.hash(
      user.password,
      parseInt(process.env.SALT_ROUNDS, 10)
    );
  }
});

User.beforeSave("Validate Images", async (user, options) => {
  if (user.changed("profilePic") && user.profilePic) {
    try {
      if (user.profilePic === null) {
        return;
      }
      const image = sharp(user.profilePic);
      const metadata = await image.metadata();

      const safeBuffer = await image
        .resize({ width: 400, height: 400, fit: "inside" }) // Max Size 400 x 400
        .toFormat(metadata.format)
        .toBuffer();

      user.profilePic = safeBuffer;
    } catch (err) {
      throw new Error("Invalid image uploaded");
    }
  }
});

User.afterCreate(
  "Create Associating Personal Bests Row",
  async (user, options) => {
    await PersonalBest.create(
      {
        userId: user.id,
      },
      { transaction: options.transaction }
    );
  }
);

User.afterCreate(
  "Create Associating ExerciseHistory Row",
  async (user, options) => {
    await ExerciseLog.create(
      {
        userId: user.id,
      },
      { transaction: options.transaction }
    );
  }
);

User.afterCreate("Create Associating Plan Row", async (user, options) => {
  await WorkoutPlan.create(
    {
      userId: user.id,
    },
    { transaction: options.transaction }
  );
});

User.afterCreate("Create Associating Stats Row", async (user, options) => {
  await Stats.create(
    {
      userId: user.id,
    },
    { transaction: options.transaction }
  );
});

User.afterCreate("Create Associating Auth Row", async (user, options) => {
  await Auth.create(
    {
      userId: user.id,
    },
    { transaction: options.transaction }
  );
});

// User-Milestone Relationships
User.hasMany(Milestone, { foreignKey: "userId" });
Milestone.belongsTo(User, { foreignKey: "userId" });

//User-Goal Relationships
User.hasMany(Goal, { foreignKey: "userId" });
Goal.belongsTo(User, { foreignKey: "userId" });

//User-CustomWorkout Relationships
User.hasMany(CustomWorkout, { foreignKey: "userId" });
CustomWorkout.belongsTo(User, { foreignKey: "userId" });

//User-workoutLog Relationships
User.hasMany(WorkoutLog, { foreignKey: "userId" });
WorkoutLog.belongsTo(User, { foreignKey: "userId" });

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

//User-History Relationships
User.hasMany(History, { foreignKey: "userId" });
History.belongsTo(User, { foreignKey: "userId" });

//User-Event Relationships
User.hasMany(Event, { foreignKey: "userId" });
Event.belongsTo(User, { foreignKey: "userId" });
Event.belongsTo(User, { foreignKey: "actorId" }); //Only one User has many Events tied to their name, but an Event can partially belong to the actor so if the actor is gone, the event is also gone.

// User-Friend Relationships
User.hasMany(Friend, { foreignKey: "userId" });
Friend.belongsTo(User, { foreignKey: "userId" });
Friend.belongsTo(User, { foreignKey: "friendId" });

// User-OutgoingRequests Relationships
User.hasMany(OutgoingRequests, { foreignKey: "userId" });
OutgoingRequests.belongsTo(User, { foreignKey: "userId" });
OutgoingRequests.belongsTo(User, { foreignKey: "outgoingId" });

// User-IncomingRequests Relationships
User.hasMany(IncomingRequests, { foreignKey: "userId" });
IncomingRequests.belongsTo(User, { foreignKey: "userId" });
IncomingRequests.belongsTo(User, { foreignKey: "incomingId" });

// User-Blocked Relationships
User.hasMany(Blocked, { foreignKey: "userId" });
Blocked.belongsTo(User, { foreignKey: "userId" });
Blocked.belongsTo(User, { foreignKey: "blockedId" });

// User-Reports Relationships
User.hasMany(Reports, { foreignKey: "userId" });
Reports.belongsTo(User, { foreignKey: "userId" });
Reports.belongsTo(User, { foreignKey: "offenderId" });

// User-Spotlight Relationships
User.hasMany(Spotlight, { foreignKey: "userId" });
Spotlight.belongsTo(User, { foreignKey: "userId" });

//Spotlight-Miletone relationships
Milestone.hasMany(Spotlight, { foreignKey: "milestoneId" });
Spotlight.belongsTo(Milestone, { foreignKey: "milestoneId" });

//Spotlight-WorkoutLog relationships
WorkoutLog.hasMany(Spotlight, { foreignKey: "workoutId" });
Spotlight.belongsTo(WorkoutLog, { foreignKey: "workoutIf" });

//Spotlight-Goal relationships
Goal.hasMany(Spotlight, { foreignKey: "goalId" });
Spotlight.belongsTo(Goal, { foreignKey: "goalId" });

//User-Auth Relationships
User.hasOne(Auth, { foreignKey: "userId" });
Auth.belongsTo(User, { foreignKey: "userId" });

export default User;
