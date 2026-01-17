const app = require('./app');
const { PORT } = require('./config/env');

app.listen(PORT, () => {
    console.log(`
    ========================================
    🚀 CYBERCAFE 24HS BACKEND
    ----------------------------------------
    PORT: ${PORT}
    ENV:  ${process.env.NODE_ENV || 'development'}
    DB:   SQLite3
    ========================================
    `);
});
