// ============================================
// CYBERCAFÉ 24HS - Lógica de Estado y Rituales
// Arquitectura: Cliente API (Supabase) + Fallback Offline
// ============================================

/* 
  ESTRUCTURA DEL ARCHIVO:
  1. Módulo de Estado Global (UI Indicators)
  2. Módulo de Presencia (presencia.html)
  3. Módulo de Rituales/Servicios (rituales.html)
  4. Módulo de Archivo (archivo.html)
  5. Módulo de Torneos (torneos.html)
  6. Inicialización Condicional por Página
*/

// ====================
// 1. MÓDULO DE ESTADO GLOBAL
// ====================
// ====================
// 1. MÓDULO DE ESTADO GLOBAL (SystemStatusUI)
// ====================
// La lógica de UI se maneja en la clase SystemStatusUI definida abajo
// y se inicializa desde el script de index.html o al final de este archivo si se prefiere.

class SystemStatusUI {
    constructor() {
        this.els = {
            container: document.getElementById('system-status'),
            connection: document.getElementById('connection-status'),
            sync: document.getElementById('sync-status'),
            pending: document.getElementById('pending-count'),
            forceBtn: document.getElementById('force-sync')
        };

        if (!this.els.container) return; // Si no existe el UI, no hacer nada
        this.els.container.classList.remove('hidden');

        this.initListeners();
        this.updateConnectionStatus(navigator.onLine);
        this.updatePendingCount(); // Check inicial
    }

    initListeners() {
        // Red
        window.addEventListener('online', () => this.updateConnectionStatus(true));
        window.addEventListener('offline', () => this.updateConnectionStatus(false));

        // Sync Queue Events
        window.addEventListener('cyber:queue-update', (e) => {
            this.updatePendingCount(e.detail.count);
        });

        window.addEventListener('cyber:sync-state', (e) => {
            this.updateSyncStatus(e.detail.syncing);
        });

        // Botón forzar
        if (this.els.forceBtn) {
            this.els.forceBtn.addEventListener('click', () => {
                const originalText = this.els.forceBtn.textContent;
                this.els.forceBtn.textContent = 'Enviando...';

                if (window.apiClient) {
                    window.apiClient.forceSync().then(() => {
                        this.els.forceBtn.textContent = originalText;
                    }).catch(() => {
                        this.els.forceBtn.textContent = 'Error';
                        setTimeout(() => this.els.forceBtn.textContent = originalText, 2000);
                    });
                }
            });
        }
    }

    updateConnectionStatus(isOnline) {
        if (!this.els.connection) return;
        if (isOnline) {
            this.els.connection.textContent = '✓ En línea';
            this.els.connection.className = 'status online';
            // Trigger sync checks when back online handled by syncQueue listeners usually
        } else {
            this.els.connection.textContent = '⚠ Sin conexión';
            this.els.connection.className = 'status offline';
        }
    }

    updateSyncStatus(isSyncing) {
        if (!this.els.sync) return;
        if (isSyncing) {
            this.els.sync.classList.remove('hidden');
            this.els.sync.className = 'status syncing';
            this.els.sync.innerHTML = '<span class="blink">↻</span> Sincronizando...';
        } else {
            this.els.sync.textContent = '✓ Sincronizado';
            this.els.sync.className = 'status online';
            setTimeout(() => {
                this.els.sync.classList.add('hidden');
            }, 2000);
        }
    }

    async updatePendingCount(count) {
        if (count === undefined && window.syncQueue) {
            count = await window.syncQueue.getPendingCount();
        }

        if (!this.els.pending) return;

        if (count > 0) {
            this.els.pending.textContent = `${count} pendientes`;
            this.els.pending.classList.remove('hidden');
            this.els.forceBtn.classList.remove('hidden');
        } else {
            this.els.pending.classList.add('hidden');
            this.els.forceBtn.classList.add('hidden');
        }
    }
}

// Exponer globalmente para que index.html lo use
window.SystemStatusUI = SystemStatusUI;

// ====================
// 2. MÓDULO DE PRESENCIA
// ====================
const PresenceModule = {
    // Configuración del módulo
    config: {
        storageKey: 'presence_data',
        cooldownHours: 24, // Una "marca" por día
        maxCounter: 9999
    },

    // Estado actual del módulo
    state: {
        count: 0,
        lastMark: null,
        todayMessage: ''
    },

    /**
     * Inicializar módulo de presencia
     */
    init: async function () {
        CyberLogger.info('Inicializando Módulo de Presencia/Log...');

        // Optimistic UI
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved) {
            this.state = { ...this.state, ...saved };
        }
        this.updateDisplay();

        // Sync remoto con manejo de errores
        try {
            window.triggerSyncStatus && window.triggerSyncStatus(true);
            constlogs = await window.apiClient.getPresenceLogs();
            if (logs && Array.isArray(logs)) {
                this.state.count = logs.length;

                // Sync log del día
                if (logs.length > 0) {
                    const lastLog = logs[0];
                    const today = new Date().toISOString().split('T')[0];
                    if (lastLog.fecha === today) {
                        this.state.lastMark = new Date().toDateString();
                    }
                }
                this.updateDisplay();
                CyberLogger.debug('Logs de presencia sincronizados', { count: this.state.count });
            }
        } catch (e) {
            CyberLogger.warn('Offline/Error obteniendo logs de presencia', e);
        } finally {
            window.triggerSyncStatus && window.triggerSyncStatus(false);
        }

        this.setupEventListeners();
    },

    /**
     * Configurar listeners de eventos
     */
    setupEventListeners: function () {
        const markBtn = document.getElementById('markPresenceBtn');
        const messageInput = document.getElementById('presenceMessage');

        if (markBtn) {
            markBtn.addEventListener('click', () => this.markPresence());
        }

        if (messageInput) {
            // DEBOUNCE APLICADO AQUÍ
            const debouncedInput = CyberUtils.debounce((val) => {
                this.state.todayMessage = val.substring(0, 100);
                CyberLogger.debug('Mensaje de presencia actualizado (local)');
            }, 300);

            messageInput.addEventListener('input', (e) => debouncedInput(e.target.value));
        }
    },

    /**
     * Marcar presencia para hoy
     */
    markPresence: async function () {
        const now = new Date();
        const today = now.toDateString();
        const todayISO = now.toISOString().split('T')[0];
        const timeISO = now.toLocaleTimeString();

        // 1. Verificar autenticación (NUEVO)
        const user = await window.apiClient.getCurrentUser();
        if (!user) {
            CyberUtils.showMessage('Debes INICIAR SESIÓN para marcar presencia.', 'warning');
            if (window.sessionManager) window.sessionManager.openModal('login');
            return;
        }

        // Verificar si ya marcó hoy (cooldown local)
        if (this.state.lastMark === today) {
            CyberUtils.showMessage('Ya marcaste tu presencia hoy. Vuelve mañana.', 'info');
            return;
        }

        window.triggerSyncStatus && window.triggerSyncStatus(true);
        try {
            // Intentar guardar en API
            await window.apiClient.addPresenceLog({
                fecha: todayISO,
                hora: timeISO,
                actividad: this.state.todayMessage || 'Visita regular'
            });

            // Si éxito, actualizar estado local
            this.state.count = this.state.count + 1;
            this.state.lastMark = today;
            CyberUtils.storage(this.config.storageKey, this.state);

            CyberUtils.showMessage('Presencia confirmada en la red.', 'success');
            this.updateDisplay();

        } catch (error) {
            // Manejo de errores específico
            if (error.message.includes('401') || error.message.includes('autenticado')) {
                CyberUtils.showMessage('Login requerido para marcar presencia.', 'warning');
            } else {
                CyberUtils.showMessage('Error de conexión. Intenta más tarde.', 'error');
            }
            CyberLogger.error('Error marcando presencia', error);
        } finally {
            window.triggerSyncStatus && window.triggerSyncStatus(false);
        }
    },

    /**
     * Actualizar elementos en la interfaz
     */
    updateDisplay: function () {
        const counterEl = document.getElementById('presenceCounter');
        if (counterEl) {
            counterEl.textContent = this.state.count.toString().padStart(4, '0');
        }

        const statusEl = document.getElementById('presenceStatus');
        if (statusEl) {
            if (this.state.lastMark === new Date().toDateString()) {
                statusEl.textContent = '✓ Ya estás presente hoy';
                statusEl.className = 'text-green';
            } else {
                statusEl.textContent = 'Aún no marcas presencia hoy';
                statusEl.className = 'text-amber';
            }
        }

        const messageInput = document.getElementById('presenceMessage');
        if (messageInput && this.state.todayMessage && messageInput.value !== this.state.todayMessage) {
            messageInput.value = this.state.todayMessage;
        }
    }
};

// ====================
// 3. MÓDULO DE SERVICIOS
// ====================
const ServiciosModule = {
    // Configuración
    config: {
        containerId: 'servicios-grid',
        formId: 'createServiceForm',
        toggleBtnId: 'btnShowCreateService',
        cancelBtnId: 'btnCancelCreateService',
        formContainerId: 'createServiceSection',
        storageKey: 'services_data_v2'
    },

    state: {
        servicios: []
    },

    init: async function () {
        CyberLogger.info('Inicializando Módulo de Servicios...');
        this.loadServiciosLocal();
        this.renderServicios();
        this.setupEventListeners();

        // Cargar remoto (Lazy/Async)
        try {
            window.triggerSyncStatus && window.triggerSyncStatus(true);
            const servicios = await window.apiClient.getServicios();
            if (servicios) {
                this.state.servicios = servicios.map(s => ({
                    id: s.id,
                    titulo: s.nombre,
                    fecha: s.fecha_programada,
                    descripcion: s.notas,
                    tipo: 'evento',
                    enlace: '#'
                }));
                this.renderServicios();
                CyberUtils.storage(this.config.storageKey, this.state.servicios);
            }
        } catch (e) {
            CyberLogger.info('Offline: Mostrando servicios cacheados');
        } finally {
            window.triggerSyncStatus && window.triggerSyncStatus(false);
        }
    },

    loadServiciosLocal: function () {
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved && Array.isArray(saved)) {
            this.state.servicios = saved;
        }
    },

    createServicio: async function (data) {
        // 1. Verificar auth
        const user = await window.apiClient.getCurrentUser();
        if (!user) {
            CyberUtils.showMessage('Debes estar autorizado para crear servicios.', 'warning');
            if (window.sessionManager) window.sessionManager.openModal('login');
            return;
        }

        if (!data.titulo || !data.descripcion) {
            CyberUtils.showMessage('Faltan campos obligatorios', 'warning');
            return;
        }

        window.triggerSyncStatus && window.triggerSyncStatus(true);
        try {
            await window.apiClient.createServicio(data);

            const servicios = await window.apiClient.getServicios();
            this.state.servicios = servicios.map(s => ({
                id: s.id,
                titulo: s.nombre,
                fecha: s.fecha_programada,
                descripcion: s.notas,
                tipo: 'evento',
                enlace: '#'
            }));

            this.renderServicios();
            document.getElementById(this.config.formId).reset();
            this.toggleForm(false);
            CyberUtils.showMessage('Servicio publicado en la red.', 'success');

        } catch (error) {
            CyberUtils.showMessage('Error creando servicio', 'error');
            CyberLogger.error(error);
        } finally {
            window.triggerSyncStatus && window.triggerSyncStatus(false);
        }
    },

    renderServicios: function () {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        container.innerHTML = '';
        const lista = this.state.servicios;

        if (lista.length === 0) {
            container.innerHTML = '<div class="text-center text-dim text-mono">// SIN SERVICIOS ACTIVOS //</div>';
            return;
        }

        lista.forEach(servicio => {
            let typeColor = 'var(--text-dim)';
            if (servicio.tipo === 'pelicula') typeColor = 'var(--neon-info)';
            if (servicio.tipo === 'evento') typeColor = 'var(--neon-brand)';
            if (servicio.tipo === 'promo') typeColor = 'var(--neon-success)';

            const card = document.createElement('article');
            card.className = 'servicio-card panel-terminal';
            card.style.marginBottom = '1.5rem';

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; border-bottom: 1px dashed #333; padding-bottom: 0.5rem;">
                    <div>
                        <h3 class="text-main" style="margin: 0; font-size: 1.1rem;">${servicio.titulo}</h3>
                        <span class="text-mono" style="color: ${typeColor}; font-size: 0.75rem;">[ ${servicio.tipo ? servicio.tipo.toUpperCase() : 'GENERAL'} ]</span>
                    </div>
                    <div class="text-right">
                        <div class="text-mono text-success" style="font-size: 0.7rem;">● ACTIVO</div>
                        <div class="text-mono text-dim" style="font-size: 0.75rem;">${servicio.fecha}</div>
                    </div>
                </div>
                
                <p class="text-dim text-mono" style="font-size: 0.9rem; margin-bottom: 1rem;">${servicio.descripcion}</p>
                
                <div class="text-right">
                    <a href="${servicio.enlace || '#'}" target="_blank" class="btn btn-small" style="text-decoration: none; display: inline-block;">
                        > ACCEDER
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    },

    toggleForm: function (show) {
        const formContainer = document.getElementById(this.config.formContainerId);
        if (formContainer) {
            if (show) formContainer.classList.remove('hidden');
            else formContainer.classList.add('hidden');
        }
    },

    setupEventListeners: function () {
        const btnShow = document.getElementById(this.config.toggleBtnId);
        const btnCancel = document.getElementById(this.config.cancelBtnId);

        if (btnShow) btnShow.addEventListener('click', () => this.toggleForm(true));
        if (btnCancel) btnCancel.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleForm(false);
        });

        const form = document.getElementById(this.config.formId);
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const data = {
                    titulo: formData.get('titulo'),
                    tipo: formData.get('tipo'),
                    descripcion: formData.get('descripcion'),
                    fecha: formData.get('fecha'),
                    enlace: formData.get('enlace')
                };
                this.createServicio(data);
            });
        }
    }
};

// ====================
// 4. MÓDULO DE ARCHIVO
// ====================
const ArchiveModule = {
    config: {
        storageKey: 'archive_phrases',
        maxPhrases: 50
    },

    state: {
        phrases: []
    },

    init: function () {
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved && Array.isArray(saved.phrases)) {
            this.state.phrases = saved.phrases;
        }

        this.renderArchive();
        this.setupEventListeners();
    },

    setupEventListeners: function () {
        const form = document.getElementById('archiveForm');
        const input = document.getElementById('phraseInput');

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                if (input && input.value.trim()) {
                    this.addPhrase(input.value.trim());
                    input.value = '';
                }
            });
        }
    },

    addPhrase: function (text) {
        const phrase = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            text: text.substring(0, 200),
            date: CyberUtils.formatDate(),
            timestamp: new Date().toISOString()
        };

        this.state.phrases.unshift(phrase);

        if (this.state.phrases.length > this.config.maxPhrases) {
            this.state.phrases = this.state.phrases.slice(0, this.config.maxPhrases);
        }

        CyberUtils.storage(this.config.storageKey, this.state);
        CyberUtils.showMessage('Frase guardada en memoria.', 'success', document.querySelector('.archive-container'));
        this.renderArchive();
    },

    renderArchive: function () {
        const listEl = document.getElementById('archiveList');
        const emptyEl = document.getElementById('emptyArchive');

        if (!listEl || !emptyEl) return;

        if (this.state.phrases.length === 0) {
            emptyEl.style.display = 'block';
            listEl.innerHTML = '';
            return;
        }

        emptyEl.style.display = 'none';

        let phrasesHTML = '';
        this.state.phrases.forEach(phrase => {
            phrasesHTML += `
        <li class="archive-item">
          <div class="text-mono">${phrase.text}</div>
          <div class="text-mono text-dim" style="font-size: 0.7rem; margin-top: 0.25rem;">
            ${phrase.date}
          </div>
        </li>
      `;
        });
        listEl.innerHTML = phrasesHTML;
    }
};

// ====================
// 5. MÓDULO DE TORNEOS
// ====================
const TorneosModule = {
    init: async function () {
        CyberLogger.info('Inicializando Módulo de Torneos...');

        const container = document.getElementById('torneos-list');
        if (!container) return; // Si no hay contenedor, salir

        try {
            window.triggerSyncStatus && window.triggerSyncStatus(true);
            const torneos = await window.apiClient.getTorneos();

            if (torneos && torneos.length > 0) {
                container.innerHTML = ''; // Limpiar placeholder
                torneos.forEach(t => {
                    const row = document.createElement('div');
                    row.className = 'log-entry';
                    row.innerHTML = `
                        <div class="log-status">
                            <span class="text-success">● OPEN</span>
                        </div>
                        <div class="log-info">
                            <span class="log-title">${t.juego}</span>
                            <span class="log-meta">JUGADORES: ${(t.participantes || []).length} | FECHA: ${t.fecha}</span>
                        </div>
                        <div class="text-right">
                            <button class="btn btn-small" onclick="TorneosModule.joinTorneo('${t.id}')">UNIRSE</button>
                        </div>
                    `;
                    container.appendChild(row);
                });
            } else {
                container.innerHTML = '<div class="text-center text-dim text-mono">// NO HAY TORNEOS ACTIVOS //</div>';
            }

        } catch (e) {
            CyberLogger.warn('Error cargando torneos', e);
            container.innerHTML = '<div class="text-center text-dim text-mono">// ERROR DE CONEXIÓN //</div>';
        } finally {
            window.triggerSyncStatus && window.triggerSyncStatus(false);
        }
    },

    joinTorneo: async function (id) {
        const user = await window.apiClient.getCurrentUser();
        if (!user) {
            CyberUtils.showMessage('Login requerido para inscribirse.', 'warning');
            if (window.sessionManager) window.sessionManager.openModal('login');
            return;
        }
        CyberUtils.showMessage('Inscripción registrada (Simulado)', 'success');
        // Implementar lógica real de update
    }
};


// ====================
// 6. INICIALIZACIÓN GLOBAL
// ====================
document.addEventListener('DOMContentLoaded', function () {
    // CyberLogger.init(); // Logger now initializes itself or via window
    // StatusModule.init(); // DEPRECATED in favor of SystemStatusUI in index.html

    // Identificar ruta
    const path = window.location.pathname;
    // Soporte para detección básica en file:// o servidor
    const isPage = (name) => path.includes(name) || document.body.id === name.replace('.html', '-page');

    if (isPage('presencia.html')) PresenceModule.init();
    if (isPage('rituales.html')) ServiciosModule.init();
    if (isPage('torneos.html')) TorneosModule.init();
    if (isPage('archivo.html')) ArchiveModule.init();

    initNavigation();
});

function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}