'use strict';

const bcrypt = require('bcrypt');

const DEMO_PASSWORD_HASH = bcrypt.hashSync('demo1234', 10);

const UUID = {
  mentor: '10000000-0000-0000-0000-000000000001',
  demoParticipant: '10000000-0000-0000-0000-000000000002',
  participant2: '10000000-0000-0000-0000-000000000003',
  participant3: '10000000-0000-0000-0000-000000000004',
  participant4: '10000000-0000-0000-0000-000000000005',
  template: '20000000-0000-0000-0000-000000000001',
  stream: '30000000-0000-0000-0000-000000000001',
  enrollDemo: '40000000-0000-0000-0000-000000000001',
  enrollP2: '40000000-0000-0000-0000-000000000002',
  enrollP3: '40000000-0000-0000-0000-000000000003',
  enrollP4: '40000000-0000-0000-0000-000000000004',
};

const DURATION = 14;

function isoDaysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function startDate(stream) {
  return isoDaysAgo(DURATION);
}

function dayContent(day) {
  const texts = [
    'Добро пожаловать! Сегодня ставим цель и план на марафон.',
    'Осваиваем дробное питание и воду.',
    'Лёгкая тренировка и баланс белков.',
    'Учимся читать состав продуктов.',
    'Здоровый завтрак: рецепты на неделю.',
    'Контроль порций и медленное питание.',
    'Полезные перекусы вместо фастфуда.',
    'Неделю подытоживаем: первые результаты.',
    'Добавляем овощи в каждый приём пищи.',
    'Физическая активность: от простого к сложному.',
    'Управление стрессом и сном.',
    'Правильные ужины: лёгкие и сытные.',
    'Закрепляем привычки и планируем меню.',
    'Финал: итоги, поздравления и следующий шаг.',
  ];
  return `<p>${texts[day - 1]}</p>`;
}

// Демо-участник: 12 из 14 дней, вес 90 -> 84.2
const demoCalendar = {};
for (let d = 1; d <= 14; d++) {
  demoCalendar[d] = d === 13 || d === 12 ? null : true;
}
const demoWeights = { 1: 90, 2: 89, 3: 89, 4: 88, 5: 88, 6: 88, 7: 87, 8: 87, 9: 86, 10: 86, 11: 85, 14: 84 };
const demoCalories = {
  1: 1620, 2: 1580, 3: 1505, 4: 1490, 5: 1550, 6: 1610, 7: 1480, 8: 1520, 9: 1445, 10: 1510, 11: 1560, 14: 1400,
};

// Фоновые участники: 14/14, 9/14, 4/14
const p2Filled = [1,2,3,4,5,6,7,8,9,10,11,12,13,14];
const p3Filled = [1,3,5,6,8,9,11,13,14];
const p4Filled = [2,4,6,8];

function makeReports(enrollmentId, days, weights, calories) {
  const rows = [];
  days.forEach((day) => {
    rows.push({
      id: require('crypto').randomUUID(),
      enrollment_id: enrollmentId,
      day_number: day,
      total_calories: (calories && calories[day]) || 1500,
      water_liters: 2,
      steps: 9000,
      sleep_hours: 8,
      activity_minutes: 40,
      weight_kg: weights ? weights[day] ?? null : null,
      chest_cm: null,
      waist_cm: weights ? (weights[day] ? 88 - (88 - 84) * (day / 14) : null) : null,
      hip_cm: null,
      leg_cm: null,
      filled_at: new Date(),
      updated_at: new Date(),
    });
  });
  return rows;
}

module.exports = {
  async up(queryInterface, Sequelize) {
    const existing = await queryInterface.rawSelect(
      'streams',
      { where: { id: UUID.stream } },
      ['id']
    );
    if (existing) {
      console.log('[seed] demo stream already exists, skipping');
      return;
    }

    const createdAt = new Date();

    // Users
    await queryInterface.bulkInsert('users', [
      {
        id: UUID.mentor, email: 'mentor@demo.ru', password_hash: DEMO_PASSWORD_HASH,
        role: 'mentor', name: 'Марина Воспитатель', timezone: 'Europe/Moscow',
        sex: 'female', height_cm: 168, weight_kg: 58, age: 34, created_at: createdAt, updated_at: createdAt,
      },
      {
        id: UUID.demoParticipant, email: 'demo@demo.ru', password_hash: DEMO_PASSWORD_HASH,
        role: 'participant', name: 'Демо Участник', timezone: 'Europe/Moscow',
        sex: 'male', height_cm: 178, weight_kg: 84, age: 29, created_at: createdAt, updated_at: createdAt,
      },
      {
        id: UUID.participant2, email: 'p2@demo.ru', password_hash: DEMO_PASSWORD_HASH,
        role: 'participant', name: 'Анна Смирнова', timezone: 'Europe/Moscow',
        sex: 'female', height_cm: 165, weight_kg: 72, age: 31, created_at: createdAt, updated_at: createdAt,
      },
      {
        id: UUID.participant3, email: 'p3@demo.ru', password_hash: DEMO_PASSWORD_HASH,
        role: 'participant', name: 'Игорь Петров', timezone: 'Europe/Moscow',
        sex: 'male', height_cm: 180, weight_kg: 95, age: 40, created_at: createdAt, updated_at: createdAt,
      },
      {
        id: UUID.participant4, email: 'p4@demo.ru', password_hash: DEMO_PASSWORD_HASH,
        role: 'participant', name: 'Ольга Козлова', timezone: 'Europe/Moscow',
        sex: 'female', height_cm: 160, weight_kg: 66, age: 26, created_at: createdAt, updated_at: createdAt,
      },
    ]);

    // Template + days
    await queryInterface.bulkInsert('marathon_templates', [
      {
        id: UUID.template, mentor_id: UUID.mentor, title: 'Демо марафон здорового питания',
        description: 'Демонстрационный марафон на 14 дней для просмотра результатов.',
        duration_days: DURATION, status: 'approved',
        intro_text: '<p>Добро пожаловать в демо-марафон! Это предстартовый текст.</p>',
        created_at: createdAt, updated_at: createdAt,
      },
    ]);

    const templateDays = [];
    for (let d = 1; d <= DURATION; d++) {
      templateDays.push({
        id: require('crypto').randomUUID(),
        template_id: UUID.template,
        day_number: d,
        text_content: dayContent(d),
        is_measurement_day: d === 1 || d === 8 || d === 14,
      });
    }
    await queryInterface.bulkInsert('template_days', templateDays);

    // Stream (finished)
    await queryInterface.bulkInsert('streams', [
      {
        id: UUID.stream, template_id: UUID.template,
        start_date: startDate(), status: 'finished', created_at: createdAt, updated_at: createdAt,
      },
    ]);

    // Enrollments
    await queryInterface.bulkInsert('stream_enrollments', [
      { id: UUID.enrollDemo, stream_id: UUID.stream, participant_id: UUID.demoParticipant, goal: 'lose', target_calories: 1600, entry_weight_kg: 90, enrolled_at: createdAt, updated_at: createdAt },
      { id: UUID.enrollP2, stream_id: UUID.stream, participant_id: UUID.participant2, goal: 'lose', target_calories: 1500, entry_weight_kg: 72, enrolled_at: createdAt, updated_at: createdAt },
      { id: UUID.enrollP3, stream_id: UUID.stream, participant_id: UUID.participant3, goal: 'lose', target_calories: 1800, entry_weight_kg: 95, enrolled_at: createdAt, updated_at: createdAt },
      { id: UUID.enrollP4, stream_id: UUID.stream, participant_id: UUID.participant4, goal: 'maintain', target_calories: 1600, entry_weight_kg: 66, enrolled_at: createdAt, updated_at: createdAt },
    ]);

    // Reports
    const demoFilled = Object.keys(demoCalendar).filter((d) => demoCalendar[d]).map(Number);
    await queryInterface.bulkInsert('daily_reports', makeReports(UUID.enrollDemo, demoFilled, demoWeights, demoCalories));
    await queryInterface.bulkInsert('daily_reports', makeReports(UUID.enrollP2, p2Filled, { 1: 72, 4: 71, 7: 71, 10: 70, 14: 70 }, { 2: 1450, 5: 1500, 7: 1420, 10: 1470, 12: 1510, 14: 1400 }));
    await queryInterface.bulkInsert('daily_reports', makeReports(UUID.enrollP3, p3Filled, { 1: 95, 8: 94, 14: 93 }, { 1: 1700, 3: 1750, 5: 1680, 6: 1720, 8: 1650, 9: 1700, 11: 1690, 13: 1660, 14: 1620 }));
    await queryInterface.bulkInsert('daily_reports', makeReports(UUID.enrollP4, p4Filled, null, { 2: 1500, 4: 1480, 6: 1550, 8: 1520 }));

    // Ratings (manually computed, mirroring ratingCalculator logic)
    const ratings = [
      { participantId: UUID.participant2, filledDays: 14, entryWeight: 72, currentWeight: 70, weightLossPercent: 2.78 },
      { participantId: UUID.participant3, filledDays: 9, entryWeight: 95, currentWeight: 93, weightLossPercent: 2.11 },
      { participantId: UUID.demoParticipant, filledDays: 12, entryWeight: 90, currentWeight: 84, weightLossPercent: 6.67 },
      { participantId: UUID.participant4, filledDays: 4, entryWeight: 66, currentWeight: 66, weightLossPercent: 0 },
    ];
    ratings.sort((a, b) => b.weightLossPercent - a.weightLossPercent);
    const streamRatingRows = ratings.map((r, i) => ({
      id: require('crypto').randomUUID(),
      stream_id: UUID.stream,
      participant_id: r.participantId,
      filled_days: r.filledDays,
      discipline_percent: Number(((r.filledDays / DURATION) * 100).toFixed(2)),
      entry_weight: r.entryWeight,
      current_weight: r.currentWeight,
      weight_loss_percent: r.weightLossPercent,
      rank: i + 1,
      calculated_at: new Date(),
    }));
    await queryInterface.bulkInsert('stream_ratings', streamRatingRows);

    console.log('[seed] demo finished stream created');
  },

  async down(queryInterface, Sequelize) {
    const enrollmentIds = [UUID.enrollDemo, UUID.enrollP2, UUID.enrollP3, UUID.enrollP4];
    await queryInterface.bulkDelete('stream_ratings', { stream_id: UUID.stream }, {});
    await queryInterface.bulkDelete('daily_reports', { enrollment_id: { [Sequelize.Op.in]: enrollmentIds } }, {});
    await queryInterface.bulkDelete('stream_enrollments', { stream_id: UUID.stream }, {});
    await queryInterface.bulkDelete('streams', { id: UUID.stream }, {});
    await queryInterface.bulkDelete('template_days', { template_id: UUID.template }, {});
    await queryInterface.bulkDelete('marathon_templates', { id: UUID.template }, {});
    await queryInterface.bulkDelete(
      'users',
      { id: { [Sequelize.Op.in]: [UUID.mentor, UUID.demoParticipant, UUID.participant2, UUID.participant3, UUID.participant4] } },
      {}
    );
  },
};
