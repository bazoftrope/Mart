'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stream_enrollments', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      stream_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'streams',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      participant_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      goal: {
        type: Sequelize.ENUM('lose', 'maintain', 'gain'),
        allowNull: false,
        defaultValue: 'maintain',
      },
      target_calories: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      enrolled_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('stream_enrollments', ['stream_id', 'participant_id'], {
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('stream_enrollments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_stream_enrollments_goal";');
  },
};
