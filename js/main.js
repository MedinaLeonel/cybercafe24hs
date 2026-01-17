// ============================================
// CYBERCAFÉ 24HS - Lógica de Estado y Rituales
// Arquitectura: Separación por feature con localStorage
// ============================================

/* 
  ESTRUCTURA DEL ARCHIVO:
  1. Módulo de Utilidades Comunes
  2. Módulo de Presencia (presencia.html)
  3. Módulo de Rituales (rituales.html)
  4. Módulo de Archivo (archivo.html)
  5. Inicialización Condicional por Página
*/

// ====================
// 1. MÓDULO DE UTILIDADES
// ====================
const CyberUtils = {
    /**
     * Obtiene o establece datos en localStorage con namespace
     * @param {string} key - Clave del dato
     * @param {any} value - Valor a guardar (opcional)
     * @returns {any} Valor recuperado o null
     */
    storage: function (key, value = undefined) {
        const fullKey = `cybercafe24hs_${key}`;

        if (value === undefined) {
            // GET: Recuperar dato
            const item = localStorage.getItem(fullKey);
            try {
                return item ? JSON.parse(item) : null;
            } catch (e) {
                return item;
            }
        } else if (value === null) {
            // DELETE: Eliminar dato
            localStorage.removeItem(fullKey);
            return null;
        } else {
            // SET: Guardar dato
            const toStore = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(fullKey, toStore);
            return value;
        }
    },

    /**
     * Muestra un mensaje de estado temporal (feedback visual)
     * @param {string} message - Texto a mostrar
     * @param {string} type - 'success' o 'info'
     * @param {HTMLElement} container - Contenedor donde mostrar
     */
    showMessage: function (message, type = 'info', container = document.body) {
        // Crear elemento de mensaje
        const messageEl = document.createElement('div');
        messageEl.className = `state-message state-${type}`;
        messageEl.textContent = message;

        // Insertar al inicio del contenedor
        container.insertBefore(messageEl, container.firstChild);

        // Auto-eliminar después de 4 segundos
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.style.opacity = '0';
                messageEl.style.transition = 'opacity 0.5s ease';

                setTimeout(() => {
                    if (messageEl.parentNode) {
                        messageEl.parentNode.removeChild(messageEl);
                    }
                }, 500);
            }
        }, 4000);
    },

    /**
     * Formatea fecha para mostrar en el archivo
     * @param {Date} date - Fecha a formatear
     * @returns {string} Fecha formateada
     */
    formatDate: function (date = new Date()) {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });
    },

    /**
     * HOOK PARA BACKEND FUTURO (comentado pero listo)
     * Reemplazar localStorage con llamadas API cuando exista backend
     */
    // async syncWithBackend(key, data) {
    //   try {
    //     const response = await fetch(`/api/${key}`, {
    //       method: 'POST',
    //       headers: { 'Content-Type': 'application/json' },
    //       body: JSON.stringify(data)
    //     });
    //     return await response.json();
    //   } catch (error) {
    //     console.error('Error sincronizando con backend:', error);
    //     // Fallback a localStorage
    //     return this.storage(key, data);
    //   }
    // }
};

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
    init: function () {
        // Cargar estado desde localStorage
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved) {
            this.state = { ...this.state, ...saved };
        }

        this.updateDisplay();
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
            messageInput.addEventListener('input', (e) => {
                this.state.todayMessage = e.target.value.substring(0, 100); // Limitar longitud
            });
        }
    },

    /**
     * Marcar presencia para hoy
     */
    markPresence: function () {
        const now = new Date();
        const today = now.toDateString();

        // Verificar si ya marcó hoy (cooldown)
        if (this.state.lastMark === today) {
            CyberUtils.showMessage(
                'Ya marcaste tu presencia hoy. Vuelve mañana.',
                'info',
                document.querySelector('.presence-container')
            );
            return;
        }

        // Actualizar estado
        this.state.count = Math.min(this.state.count + 1, this.config.maxCounter);
        this.state.lastMark = today;

        // Guardar en localStorage
        CyberUtils.storage(this.config.storageKey, this.state);

        // Mostrar feedback
        CyberUtils.showMessage(
            `Presencia confirmada. Estuviste presente. Esta noche somos ${this.state.count}.`,
            'success',
            document.querySelector('.presence-container')
        );

        // Actualizar visualización
        this.updateDisplay();

        // HOOK PARA BACKEND FUTURO:
        // CyberUtils.syncWithBackend('presence', this.state);
    },

    /**
     * Actualizar elementos en la interfaz
     */
    updateDisplay: function () {
        // Actualizar contador
        const counterEl = document.getElementById('presenceCounter');
        if (counterEl) {
            counterEl.textContent = this.state.count.toString().padStart(4, '0');
        }

        // Actualizar mensaje de estado
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

        // Restaurar mensaje si existe
        const messageInput = document.getElementById('presenceMessage');
        if (messageInput && this.state.todayMessage) {
            messageInput.value = this.state.todayMessage;
        }
    }
};

// ====================
// 3. MÓDULO DE RITUALES
// ====================
// ====================
// 3. MÓDULO DE SERVICIOS (CARTELERA)
// ====================
// ====================
// 3. MÓDULO DE SERVICIOS (CARTELERA)
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

    // Estado inicial
    state: {
        servicios: []
    },

    /**
     * Inicializar módulo
     */
    init: function () {
        console.log('Inicializando Módulo de Servicios...');
        this.loadServicios();
        this.renderServicios();
        this.setupEventListeners();
    },

    /**
     * Cargar servicios desde LocalStorage
     */
    loadServicios: function () {
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved && Array.isArray(saved)) {
            this.state.servicios = saved;
        } else {
            // Inicializar vacío para que solo aparezcan los creados por el usuario
            this.state.servicios = [];
            this.saveServicios(this.state.servicios);
        }
    },

    /**
     * Obtener lista de servicios (Hook para fetch futuro)
     */
    getServicios: function () {
        return this.state.servicios;
    },

    /**
     * Guardar servicios (Local -> Futuro API)
     */
    saveServicios: function (servicios) {
        this.state.servicios = servicios;
        CyberUtils.storage(this.config.storageKey, servicios);
    },

    /**
     * Crear un nuevo servicio
     */
    createServicio: function (data) {
        // Validaciones básicas
        if (!data.titulo || !data.descripcion) {
            alert('Faltan campos obligatorios');
            return;
        }

        const newService = {
            id: 'srv_' + Date.now().toString(36),
            titulo: data.titulo,
            descripcion: data.descripcion,
            enlace: data.enlace || '#',
            tipo: data.tipo || 'evento',
            fecha: data.fecha || new Date().toISOString().split('T')[0],
            estado: 'activo'
        };

        const updatedList = [newService, ...this.state.servicios];
        this.saveServicios(updatedList);
        this.renderServicios();

        // Limpiar y ocultar formulario después de crear
        document.getElementById(this.config.formId).reset();
        this.toggleForm(false);

        CyberUtils.showMessage('Servicio publicado correctamente.', 'success', document.querySelector('.main-content'));
    },

    /**
     * Renderizar lista de servicios
     */
    renderServicios: function () {
        const container = document.getElementById(this.config.containerId);
        if (!container) return;

        container.innerHTML = '';
        const lista = this.getServicios();

        if (lista.length === 0) {
            container.innerHTML = '<div class="text-center text-dim text-mono">// SIN SERVICIOS ACTIVOS //</div>';
            return;
        }

        lista.forEach(servicio => {
            // Determinar estilos según tipo
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
                        <span class="text-mono" style="color: ${typeColor}; font-size: 0.75rem;">[ ${servicio.tipo.toUpperCase()} ]</span>
                    </div>
                    <div class="text-right">
                        <div class="text-mono text-success" style="font-size: 0.7rem;">● ACTIVO</div>
                        <div class="text-mono text-dim" style="font-size: 0.75rem;">${servicio.fecha}</div>
                    </div>
                </div>
                
                <p class="text-dim text-mono" style="font-size: 0.9rem; margin-bottom: 1rem;">${servicio.descripcion}</p>
                
                <div class="text-right">
                    <a href="${servicio.enlace}" target="_blank" class="btn btn-small" style="text-decoration: none; display: inline-block;">
                        > ACCEDER
                    </a>
                </div>
            `;
            container.appendChild(card);
        });
    },

    /**
     * Mostrar/Ocultar formulario
     */
    toggleForm: function (show) {
        const formContainer = document.getElementById(this.config.formContainerId);
        if (formContainer) {
            if (show) {
                formContainer.classList.remove('hidden');
            } else {
                formContainer.classList.add('hidden');
            }
        }
    },

    /**
     * Configurar Listeners
     */
    setupEventListeners: function () {
        // Toggle Form
        const btnShow = document.getElementById(this.config.toggleBtnId);
        const btnCancel = document.getElementById(this.config.cancelBtnId);

        if (btnShow) {
            btnShow.addEventListener('click', () => this.toggleForm(true));
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', (e) => {
                e.preventDefault(); // Evita submits accidentales
                this.toggleForm(false);
            });
        }

        // Handle Submit
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

    /**
     * Inicializar módulo de archivo
     */
    init: function () {
        // Cargar frases
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved && Array.isArray(saved.phrases)) {
            this.state.phrases = saved.phrases;
        }

        this.renderArchive();
        this.setupEventListeners();
    },

    /**
     * Configurar listeners
     */
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

    /**
     * Agregar frase al archivo
     * @param {string} text - Texto de la frase
     */
    addPhrase: function (text) {
        // Crear objeto de frase
        const phrase = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            text: text.substring(0, 200), // Limitar longitud
            date: CyberUtils.formatDate(),
            timestamp: new Date().toISOString()
        };

        // Agregar al inicio del array
        this.state.phrases.unshift(phrase);

        // Limitar cantidad máxima
        if (this.state.phrases.length > this.config.maxPhrases) {
            this.state.phrases = this.state.phrases.slice(0, this.config.maxPhrases);
        }

        // Guardar
        CyberUtils.storage(this.config.storageKey, this.state);

        // Feedback
        CyberUtils.showMessage(
            'Frase añadida al archivo local.',
            'success',
            document.querySelector('.archive-container')
        );

        // Actualizar visualización
        this.renderArchive();

        // HOOK PARA BACKEND FUTURO:
        // CyberUtils.syncWithBackend('archive/phrases', phrase);
    },

    /**
     * Renderizar lista de frases
     */
    renderArchive: function () {
        const listEl = document.getElementById('archiveList');
        const emptyEl = document.getElementById('emptyArchive');

        if (!listEl || !emptyEl) return;

        // Mostrar/ocultar mensaje de vacío
        if (this.state.phrases.length === 0) {
            emptyEl.style.display = 'block';
            listEl.innerHTML = '';
            return;
        }

        emptyEl.style.display = 'none';

        // Generar HTML de frases
        let phrasesHTML = '';

        this.state.phrases.forEach(phrase => {
            phrasesHTML += `
        <li class="archive-item">
          <div class="text-mono">${phrase.text}</div>
          <div class="text-mono" style="font-size: 0.7rem; color: var(--color-text-secondary); margin-top: 0.25rem;">
            ${phrase.date}
          </div>
        </li>
      `;
        });

        listEl.innerHTML = phrasesHTML;
    }
};

// ====================
// 5. INICIALIZACIÓN GLOBAL
// ====================
document.addEventListener('DOMContentLoaded', function () {
    console.log('Cybercafé 24hs - Estado cargado');

    // Identificar página actual por URL o body class
    const path = window.location.pathname;
    const bodyId = document.body.id;

    // Inicializar módulos según la página
    if (path.includes('presencia.html') || bodyId === 'presencia-page') {
        PresenceModule.init();
        console.log('Módulo de presencia activado');
    }

    if (path.includes('rituales.html') || bodyId === 'rituales-page') {
        ServiciosModule.init();
        console.log('Módulo de servicios activado');
    }

    if (path.includes('archivo.html') || bodyId === 'archivo-page') {
        ArchiveModule.init();
        console.log('Módulo de archivo activado');
    }

    // Inicializar navegación activa
    initNavigation();
});

/**
 * Manejar navegación activa
 */
function initNavigation() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage ||
            (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}