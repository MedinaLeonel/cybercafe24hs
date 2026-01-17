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
const RitualsModule = {
    config: {
        storageKey: 'rituals_data',
        currentQuestion: '¿Qué resuena contigo esta noche?',
        options: ['Silencio', 'Memoria', 'Sincronicidad']
    },

    state: {
        userVote: null,
        voteCounts: { 0: 0, 1: 0, 2: 0 },
        lastVoteDate: null
    },

    /**
     * Inicializar módulo de rituales
     */
    init: function () {
        // Cargar estado
        const saved = CyberUtils.storage(this.config.storageKey);
        if (saved) {
            this.state = { ...this.state, ...saved };
        }

        this.renderQuestion();
        this.setupEventListeners();
        this.updateResultsDisplay();
    },

    /**
     * Renderizar pregunta y opciones
     */
    renderQuestion: function () {
        const questionEl = document.getElementById('ritualQuestion');
        const optionsEl = document.getElementById('voteOptions');

        if (questionEl) {
            questionEl.textContent = this.config.currentQuestion;
        }

        if (optionsEl) {
            optionsEl.innerHTML = '';

            this.config.options.forEach((option, index) => {
                const button = document.createElement('button');
                button.className = 'vote-option';
                if (this.state.userVote === index) {
                    button.classList.add('selected');
                }

                button.dataset.optionIndex = index;
                button.textContent = option;

                optionsEl.appendChild(button);
            });
        }
    },

    /**
     * Configurar listeners
     */
    setupEventListeners: function () {
        const optionsEl = document.getElementById('voteOptions');
        if (optionsEl) {
            optionsEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('vote-option')) {
                    const index = parseInt(e.target.dataset.optionIndex);
                    this.castVote(index);
                }
            });
        }
    },

    /**
     * Emitir un voto
     * @param {number} optionIndex - Índice de la opción votada
     */
    castVote: function (optionIndex) {
        const today = new Date().toDateString();

        // Verificar si ya votó hoy
        if (this.state.lastVoteDate === today) {
            CyberUtils.showMessage(
                'Ya has participado en el ritual de hoy.',
                'info',
                document.querySelector('.rituals-container')
            );
            return;
        }

        // Actualizar estado
        if (this.state.userVote !== null) {
            // Restar voto anterior si existe
            this.state.voteCounts[this.state.userVote] =
                Math.max(0, this.state.voteCounts[this.state.userVote] - 1);
        }

        this.state.userVote = optionIndex;
        this.state.voteCounts[optionIndex] = (this.state.voteCounts[optionIndex] || 0) + 1;
        this.state.lastVoteDate = today;

        // Guardar
        CyberUtils.storage(this.config.storageKey, this.state);

        // Feedback
        CyberUtils.showMessage(
            `Voto registrado: "${this.config.options[optionIndex]}"`,
            'success',
            document.querySelector('.rituals-container')
        );

        // Actualizar UI
        this.renderQuestion();
        this.updateResultsDisplay();

        // HOOK PARA BACKEND FUTURO:
        // CyberUtils.syncWithBackend('rituals/vote', {
        //   option: optionIndex,
        //   timestamp: new Date().toISOString()
        // });
    },

    /**
     * Actualizar visualización de resultados
     */
    updateResultsDisplay: function () {
        const resultsEl = document.getElementById('voteResults');
        if (!resultsEl) return;

        // Calcular total simbólico (no es real, es atmosférico)
        const total = Object.values(this.state.voteCounts).reduce((a, b) => a + b, 0) || 1;

        let resultsHTML = '<h3 class="text-amber mt-2">Respiración colectiva:</h3>';

        this.config.options.forEach((option, index) => {
            const count = this.state.voteCounts[index] || 0;
            const percentage = Math.round((count / total) * 100);

            // Barras de progreso visual
            const barWidth = Math.max(10, percentage);

            resultsHTML += `
        <div class="mb-1">
          <div class="text-mono" style="font-size: 0.85rem;">
            ${option}: ${count}
          </div>
          <div style="background: #333; height: 4px; border-radius: 2px; margin-top: 2px;">
            <div style="width: ${barWidth}%; height: 100%; background: var(--color-accent-green); border-radius: 2px;"></div>
          </div>
        </div>
      `;
        });

        resultsEl.innerHTML = resultsHTML;
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
        RitualsModule.init();
        console.log('Módulo de rituales activado');
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