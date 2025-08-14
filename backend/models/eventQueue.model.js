import { DataTypes, Op } from 'sequelize';
import { sequelize } from '../config/db.config.js';
import eventsTypes from '../../shared/events.json' with {type: 'json'};

const Event = sequelize.define(
    'Event',
    {
        id: {
            type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false, unique: true
        },
        userId: {
            type: DataTypes.INTEGER, allowNull: false, references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'CASCADE',
        },
        type: {
            type: DataTypes.STRING(40), allowNull: false, validate: {
                isIn: [eventsTypes]
            }
        },
        actorId: {
            type: DataTypes.INTEGER, allowNull: true, references: {
                model: 'Users',
                key: 'id'
            },
            onDelete: 'SET NULL',
        },
        resourceId: {
            type: DataTypes.INTEGER, allowNull: true,
            comment: "What resource is the event referenceing?"
        },
        payload: {
            type: DataTypes.JSON, allowNull: true,
        },
        seenAt: {
            type: DataTypes.DATE, allowNull: true, defaultValue: null,
        },
    },
    {
        tableName: 'Events',
        underscored: true,
        timestamps: true,
        indexes: [
            { fields: ['user_id', 'id'] },
        ],
    }
);

Event.markSeen = async (userId, upToId, t = null) => {
    return Event.update(
        { seenAt: new Date() },
        {
            where: {
                userId,
                id: { [Op.lte]: upToId },
                seenAt: null,
            },
            transaction: t,
        }
    );
};

//Todo Write a tester for Event

export default Event;
