const servicesRepository = require('./services.repository');

const createService = (userId, data) => {
    const service = {
        user_id: userId,
        titulo: data.titulo,
        descripcion: data.descripcion,
        enlace: data.enlace,
        tipo: data.tipo,
        fecha: data.fecha || new Date().toISOString()
    };
    return servicesRepository.createService(service);
};

const getAllServices = () => {
    return servicesRepository.getAllServices();
};

const deleteService = (id, userId) => {
    const service = servicesRepository.getServiceById(id);
    if (!service) {
        throw new Error('NOT_FOUND');
    }

    // Check ownership
    // Note: In a real app we might have roles. Here strict ownership.
    if (service.user_id !== userId) {
        throw new Error('FORBIDDEN');
    }

    return servicesRepository.deleteService(id);
};

module.exports = { createService, getAllServices, deleteService };
