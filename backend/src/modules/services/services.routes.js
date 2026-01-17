const express = require('express');
const router = express.Router();
const servicesController = require('./services.controller');
const authenticate = require('../../middleware/auth.middleware');

// Public
router.get('/', servicesController.getAll);

// Protected
router.post('/', authenticate, servicesController.create);
router.delete('/:id', authenticate, servicesController.remove);

module.exports = router;
