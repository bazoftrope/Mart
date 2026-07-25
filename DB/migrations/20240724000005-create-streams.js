'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('streams', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      template_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'marathon_templates',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('open', 'running', 'finished'),
        allowNull: false,
        defaultValue: 'open',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('streams', ['template_id', 'status']);
    await queryInterface.addIndex('streams', ['start_date', 'status']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('streams');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_streams_status";');
  },
};
