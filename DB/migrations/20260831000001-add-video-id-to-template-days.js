'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn('template_days', 'video_url');
    await queryInterface.addColumn('template_days', 'video_id', {
      type: Sequelize.STRING(256),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('template_days', 'video_id');
    await queryInterface.addColumn('template_days', 'video_url', {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },
};
