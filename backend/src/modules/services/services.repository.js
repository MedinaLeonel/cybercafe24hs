const db = require('../../db/database');

const createService = (service) => {
    const stmt = db.prepare(`
        INSERT INTO services (user_id, titulo, descripcion, enlace, tipo, fecha)
        VALUES (@user_id, @titulo, @descripcion, @enlace, @tipo, @fecha)
    `);
    const info = stmt.run(service);
    return { id: info.lastInsertRowid, ...service };
};

const getAllServices = () => {
    const stmt = db.prepare(`
        SELECT s.*, u.username as creator 
        FROM services s 
        LEFT JOIN users u ON s.user_id = u.id 
        ORDER BY s.created_at DESC
    `);
    return stmt.all();
};

const getServiceById = (id) => {
    const stmt = db.prepare('SELECT * FROM services WHERE id = ?');
    return stmt.get(id);
};

const deleteService = (id) => {
    const stmt = db.prepare('DELETE FROM services WHERE id = ?');
    const info = stmt.run(id);
    return info.changes > 0;
};

module.exports = { createService, getAllServices, getServiceById, deleteService };
