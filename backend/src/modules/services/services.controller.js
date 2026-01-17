const servicesService = require('./services.service');

const getAll = (req, res) => {
    try {
        const services = servicesService.getAllServices();
        res.json(services);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const create = (req, res) => {
    try {
        const { titulo, descripcion, enlace, tipo, fecha } = req.body;
        if (!titulo || !descripcion) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newService = servicesService.createService(req.user.id, { titulo, descripcion, enlace, tipo, fecha });
        res.status(201).json(newService);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

const remove = (req, res) => {
    try {
        const { id } = req.params;
        servicesService.deleteService(id, req.user.id);
        res.status(204).send();
    } catch (error) {
        if (error.message === 'NOT_FOUND') return res.status(404).json({ error: 'Service not found' });
        if (error.message === 'FORBIDDEN') return res.status(403).json({ error: 'Not authorized' });
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { getAll, create, remove };
