const db = require('../../db/database');

const createUser = (user) => {
    const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (@username, @email, @password_hash)
    `);

    try {
        const info = stmt.run(user);
        return { id: info.lastInsertRowid, ...user };
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            throw new Error('USERNAME_OR_EMAIL_EXISTS');
        }
        throw error;
    }
};

const findUserByEmail = (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
};

const findUserById = (id) => {
    const stmt = db.prepare('SELECT id, username, email, created_at FROM users WHERE id = ?');
    return stmt.get(id);
};

module.exports = { createUser, findUserByEmail, findUserById };
