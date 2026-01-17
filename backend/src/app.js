const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const authRoutes = require('./modules/auth/auth.routes');
const servicesRoutes = require('./modules/services/services.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);

// Helper route
app.get('/', (req, res) => {
    res.json({ message: 'Cybercafe 24hs API Online' });
});

module.exports = app;
