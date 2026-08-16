'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stream_ratings', 'entry_weight', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('stream_ratings', 'current_weight', {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: null,
    });
    await queryInterface.addColumn('stream_ratings', 'weight_loss_percent', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.removeIndex('stream_ratings', ['stream_id', 'discipline_percent']);
    await queryInterface.addIndex('stream_ratings', ['stream_id', 'weight_loss_percent']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('stream_ratings', ['stream_id', 'weight_loss_percent']);
    await queryInterface.addIndex('stream_ratings', ['stream_id', 'discipline_percent']);
    await queryInterface.removeColumn('stream_ratings', 'weight_loss_percent');
    await queryInterface.removeColumn('stream_ratings', 'current_weight');
    await queryInterface.removeColumn('stream_ratings', 'entry_weight');
  },
};
