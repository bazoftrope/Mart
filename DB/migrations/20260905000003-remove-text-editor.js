'use strict';

/**
 * Убирает устаревшую настройку формата текста marathon_templates.text_editor.
 *
 * На свежих БД колонка больше не создаётся (см. 20260905000001), поэтому миграция
 * ничего не делает. На БД, где миграция 20260905000001 уже была применена со
 * старой версией (колонка text_editor существует), миграция:
 *  1) переводит plain-тексты шаблонов и дней в простой HTML (текст всегда HTML);
 *  2) удаляет колонку и тип enum.
 */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function plainTextToHtml(value) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

module.exports = {
  async up(queryInterface) {
    const [columns] = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name = 'marathon_templates' AND column_name = 'text_editor'`
    );

    if (columns.length === 0) {
      return;
    }

    const [templates] = await queryInterface.sequelize.query(
      `SELECT id, text_editor, intro_text
       FROM marathon_templates
       WHERE text_editor = 'plain'`
    );

    for (const template of templates) {
      if (template.intro_text) {
        await queryInterface.sequelize.query(
          'UPDATE marathon_templates SET intro_text = :html WHERE id = :id',
          {
            replacements: {
              id: template.id,
              html: plainTextToHtml(template.intro_text),
            },
          }
        );
      }
    }

    if (templates.length > 0) {
      const templateIds = templates.map((template) => template.id);
      const [days] = await queryInterface.sequelize.query(
        `SELECT id, text_content
         FROM template_days
         WHERE template_id IN (:templateIds) AND text_content IS NOT NULL`,
        { replacements: { templateIds } }
      );

      for (const day of days) {
        if (day.text_content) {
          await queryInterface.sequelize.query(
            'UPDATE template_days SET text_content = :html WHERE id = :id',
            {
              replacements: {
                id: day.id,
                html: plainTextToHtml(day.text_content),
              },
            }
          );
        }
      }
    }

    await queryInterface.removeColumn('marathon_templates', 'text_editor');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_marathon_templates_text_editor";'
    );
  },

  async down() {
    // Колонка была временной настройкой и больше не нужна; откат не требуется.
  },
};
