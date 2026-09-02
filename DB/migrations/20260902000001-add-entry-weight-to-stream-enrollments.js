'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stream_enrollments', 'entry_weight_kg', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('stream_enrollments', 'entry_weight_kg');
  },
};
