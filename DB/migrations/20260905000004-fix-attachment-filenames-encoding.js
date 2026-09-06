'use strict';

function isLikelyMojibake(fileName) {
  if (typeof fileName !== 'string' || fileName.length === 0) {
    return false;
  }

  // Битые имена из multipart-парсера содержат только символы Latin-1 (0x00–0xFF),
  // потому что UTF-8 байты были прочитаны как Latin-1.
  let onlyLatin1Range = true;
  for (const char of fileName) {
    const codePoint = char.codePointAt(0);
    if (codePoint > 0xff) {
      onlyLatin1Range = false;
      break;
    }
  }
  if (!onlyLatin1Range) {
    return false;
  }

  const decoded = Buffer.from(fileName, 'latin1').toString('utf8');
  return decoded !== fileName && !decoded.includes('\uFFFD');
}

module.exports = {
  async up(queryInterface) {
    const sequelize = queryInterface.sequelize;
    const [rows] = await sequelize.query(
      `SELECT id, file_name
       FROM template_attachments
       WHERE file_name IS NOT NULL AND file_name <> ''`
    );

    for (const row of rows) {
      if (!isLikelyMojibake(row.file_name)) {
        continue;
      }

      const decoded = Buffer.from(row.file_name, 'latin1').toString('utf8');
      await sequelize.query(
        'UPDATE template_attachments SET file_name = ? WHERE id = ?',
        { replacements: [decoded, row.id] }
      );
    }
  },

  async down() {
    // Это data-repair миграция: обратное преобразование нельзя выполнить надёжно,
    // поэтому откат намеренно ничего не делает.
  },
};
