'use strict';

const bcrypt = require('bcrypt');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Hash the admin password securely
    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);  // Change password if needed

    await queryInterface.bulkInsert('Users', [{
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      profile_pic: null,
      authority: 'admin',
      level: 100,
      xp: 99999,
      total_friends: 0,
      total_workouts: 0,
      total_time_worked_out: 0,
      total_coins: 10000,
      shop_unlocks: JSON.stringify([1, 2, 3]),  // Example unlocks
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', { username: 'admin' }, {});
  }
};
