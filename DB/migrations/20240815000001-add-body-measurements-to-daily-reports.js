'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('daily_reports', 'chest_cm', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('daily_reports', 'waist_cm', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('daily_reports', 'hip_cm', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('daily_reports', 'leg_cm', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('daily_reports', 'chest_cm');
    await queryInterface.removeColumn('daily_reports', 'waist_cm');
    await queryInterface.removeColumn('daily_reports', 'hip_cm');
    await queryInterface.removeColumn('daily_reports', 'leg_cm');
  },
};
