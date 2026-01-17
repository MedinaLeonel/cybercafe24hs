require('dotenv').config();

module.exports = {
    PORT: process.env.PORT || 3000,
    DB_PATH: process.env.DB_PATH || './cybercafe.db',
    JWT_SECRET: process.env.JWT_SECRET || 'secret_dev_key_change_in_prod',
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    SALT_ROUNDS: parseInt(process.env.SALT_ROUNDS) || 10
};
