'use strict';

const bcrypt = require('bcrypt');
const UserModule = require('../models/user.model.js');
const User = UserModule.default

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);

    await User.create({
      username: 'admin3',
      password: "admin123ABC!",
      email: 'admin3@example.com',
      profilePic: null,
      authority: 'admin',
      level: 100,
      xp: 99999,
      totalFriends: 0,
      totalWorkouts: 0,
      totalTimeWorkedOut: 0,
      totalCoins: 10000,
      shopUnlocks: [1, 2, 3],
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { username: 'admin3' }, {});
  }
};
