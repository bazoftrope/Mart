'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Яйцо куриное', calories: 157 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Курица грудка', calories: 165 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Гречневая каша', calories: 132 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Рис белый', calories: 130 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Овсянка', calories: 68 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Яблоко', calories: 52 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Банан', calories: 89 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Молоко 2,5%', calories: 54 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Творог 5%', calories: 120 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Огурец', calories: 15 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Помидор', calories: 18 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Масло подсолнечное', calories: 884 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Хлеб белый', calories: 265 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Говядина', calories: 187 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Картофель', calories: 77 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
