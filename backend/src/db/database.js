const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const { DB_PATH } = require('../config/env');

// Initialize DB
const db = new Database(DB_PATH, { verbose: console.log });

// Enable Foreign Keys
db.pragma('foreign_keys = ON');

// Load Schema
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Apply Schema
db.exec(schema);

module.exports = db;
