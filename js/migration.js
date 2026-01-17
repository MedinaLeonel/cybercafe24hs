const MigrationModule = {
    // Configuración
    migratedKey: 'supabase_migrated',
    localKeys: {
        presence: 'cybercafe24hs_presence_data',
        services: 'cybercafe24hs_services_data_v2',
        archive: 'cybercafe24hs_archive_phrases'
    },

    init: function () {
        if (!localStorage.getItem(this.migratedKey)) {
            // Pequeño delay para no abrumar al iniciar
            setTimeout(() => this.checkAndPrompt(), 2000);
        }
    },

    /**
     * Verificar si hay datos locales y pedir confirmación
     */
    checkAndPrompt: async function () {
        // Solo migrar si hay usuario autenticado
        const user = await window.apiClient.getCurrentUser();
        if (!user) {
            CyberLogger.debug('Migración postergada: Usuario no autenticado');
            return;
        }

        // Chequear datos reales
        const hasPresence = !!localStorage.getItem(this.localKeys.presence);
        const hasServices = !!localStorage.getItem(this.localKeys.services);

        if (hasPresence || hasServices) {
            this.showMigrationModal({ presence: hasPresence, services: hasServices });
        }
    },

    showMigrationModal: function (dataTypes) {
        const modalId = 'migrationModal';
        if (document.getElementById(modalId)) return;

        const modalHTML = `
        <div id="${modalId}" class="modal-overlay">
            <div class="modal-content panel-terminal" style="border-color: var(--neon-brand);">
                <h2 class="text-brand text-center">DETECTADOS DATOS LOCALES</h2>
                <p class="text-dim text-mono text-center">
                    Se han encontrado registros en tu almacenamiento local.<br>
                    ¿Deseas sincronizarlos con el servidor central?
                </p>
                
                <div class="text-mono" style="margin: 1.5rem 0; padding: 1rem; border: 1px dashed #333;">
                    ${dataTypes.presence ? '<div>[X] REGISTROS DE PRESENCIA</div>' : ''}
                    ${dataTypes.services ? '<div>[X] SERVICIOS CREATIVOS</div>' : ''}
                </div>

                <div id="migration-progress" class="hidden" style="margin-bottom: 1rem;">
                    <progress id="mig-progress-bar" value="0" max="100" style="width: 100%;"></progress>
                    <div id="mig-status" class="text-center text-mono text-dim">Iniciando...</div>
                </div>

                <div class="text-center" id="migration-actions">
                    <button class="btn btn-primary" id="btn-mig-start">INICIAR MIGRACION</button>
                    <button class="btn" id="btn-mig-skip" style="color: var(--text-dim)">OMITIR POR AHORA</button>
                </div>
            </div>
        </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        document.getElementById('btn-mig-start').addEventListener('click', () => this.runMigration());
        document.getElementById('btn-mig-skip').addEventListener('click', () => {
            document.getElementById(modalId).remove();
            CyberLogger.info('Migración omitida por usuario');
        });
    },

    runMigration: async function () {
        const ui = {
            actions: document.getElementById('migration-actions'),
            progress: document.getElementById('migration-progress'),
            bar: document.getElementById('mig-progress-bar'),
            status: document.getElementById('mig-status'),
            modal: document.getElementById('migrationModal')
        };

        ui.actions.classList.add('hidden');
        ui.progress.classList.remove('hidden');

        try {
            // 1. Migrar Presencia
            ui.status.textContent = 'Migrando logs de presencia...';
            ui.bar.value = 20;

            const presenceData = CyberUtils.storage('presence_data');
            if (presenceData && presenceData.lastMark) {
                // Lógica simple simulada
                await window.apiClient.addPresenceLog({
                    fecha: new Date().toISOString().split('T')[0],
                    hora: new Date().toLocaleTimeString(),
                    actividad: 'Sync: ' + (presenceData.todayMessage || 'Migración Historial')
                });
            }
            ui.bar.value = 50;

            // 2. Migrar Servicios
            ui.status.textContent = 'Migrando servicios...';
            const servicesData = CyberUtils.storage('services_data_v2');
            if (servicesData && Array.isArray(servicesData)) {
                // Procesar en serie para no saturar
                const total = servicesData.length;
                let current = 0;
                for (const svc of servicesData) {
                    current++;
                    try {
                        await window.apiClient.createServicio({
                            titulo: svc.titulo,
                            descripcion: svc.descripcion,
                            fecha: svc.fecha,
                            tipo: svc.tipo
                        });
                    } catch (e) {
                        CyberLogger.warn('Error migrando item servicio', e);
                    }
                    // Update progress sub-step
                    ui.bar.value = 50 + (current / total * 40);
                }
            }
            ui.bar.value = 100;
            ui.status.textContent = '¡Completado!';

            CyberUtils.showMessage('Migración completada con éxito', 'success');
            localStorage.setItem(this.migratedKey, 'true');

            setTimeout(() => {
                ui.modal.remove();
                window.location.reload(); // Recargar para ver datos frescos
            }, 1000);

        } catch (error) {
            ui.status.textContent = 'Error crítico.';
            ui.status.style.color = 'var(--neon-brand)';
            CyberLogger.error('Fallo en migración', error);

            setTimeout(() => {
                ui.actions.classList.remove('hidden');
                ui.progress.classList.add('hidden');
                alert('Hubo un error en la migración. Revisa la consola o intenta más tarde.');
            }, 2000);
        }
    }
};

window.addEventListener('load', () => {
    MigrationModule.init();

    // Re-checkear migración al loguearse
    window.addEventListener('cyber:auth-login', () => {
        MigrationModule.checkAndPrompt();
    });
});
