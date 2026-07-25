'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('products', [
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Яйцо куриное', calories_per_100g: 157 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Курица грудка', calories_per_100g: 165 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Гречневая каша', calories_per_100g: 132 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Рис белый', calories_per_100g: 130 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Овсянка', calories_per_100g: 68 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Яблоко', calories_per_100g: 52 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Банан', calories_per_100g: 89 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Молоко 2,5%', calories_per_100g: 54 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Творог 5%', calories_per_100g: 120 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Огурец', calories_per_100g: 15 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Помидор', calories_per_100g: 18 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Масло подсолнечное', calories_per_100g: 884 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Хлеб белый', calories_per_100g: 265 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Говядина', calories_per_100g: 187 },
      { id: Sequelize.literal('gen_random_uuid()'), name: 'Картофель', calories_per_100g: 77 },
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
