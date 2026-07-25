const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '..', '..', '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) return;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
}

const parseUrl = (url) => {
  if (!url) return {};
  try {
    const parsed = new URL(url);
    return {
      database: parsed.pathname.replace(/^\//, ''),
      username: parsed.username,
      password: parsed.password,
      host: parsed.hostname,
      port: parseInt(parsed.port || '5432', 10),
    };
  } catch {
    return {};
  }
};

const baseConfig = parseUrl(process.env.DATABASE_URL);

module.exports = {
  development: {
    ...baseConfig,
    dialect: 'postgres',
    logging: console.log,
  },
  test: {
    ...baseConfig,
    database: `${baseConfig.database || 'marathon_platform'}_test`,
    dialect: 'postgres',
    logging: false,
  },
  production: {
    ...baseConfig,
    dialect: 'postgres',
    logging: false,
  },
};
