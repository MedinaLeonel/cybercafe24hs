// ============================================
// MÓDULO DE TORNEOS
// Gestión de competencias y participantes
// ============================================

const TournamentsModule = {
    config: {
        storageKey: 'torneos',
        userKey: 'user_identity',
        estados: {
            PLANIFICADO: 'planificado',
            EN_CURSO: 'en_curso',
            FINALIZADO: 'finalizado'
        }
    },

    state: {
        torneos: [],
        usuarioActual: null,
        filtroActual: 'all'
    },

    /**
     * Inicialización del módulo
     */
    init: function () {
        console.log('Inicializando Módulo de Torneos...');

        // 1. Identificar o crear usuario local
        this.identificarUsuario();

        // 2. Cargar datos
        this.cargarTorneos();

        // 3. Renderizar vista inicial
        this.renderList();

        // 4. Configurar eventos
        this.setupEventListeners();

        // 5. Verificar parámetros de URL (para enlaces directos en futuro)
        // const urlParams = new URLSearchParams(window.location.search);
        // ...
    },

    /**
     * Gestión de Identidad (Básica Local)
     */
    identificarUsuario: function () {
        let userId = CyberUtils.storage(this.config.userKey);
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            CyberUtils.storage(this.config.userKey, userId);
        }
        this.state.usuarioActual = userId;
        console.log('Usuario identificado:', this.state.usuarioActual);
    },

    /**
     * Carga de datos desde LocalStorage
     */
    cargarTorneos: function () {
        const data = CyberUtils.storage(this.config.storageKey);
        this.state.torneos = Array.isArray(data) ? data : [];

        // Ordenar: En curso > Planificados > Finalizados
        this.state.torneos.sort((a, b) => {
            const peso = { 'en_curso': 2, 'planificado': 1, 'finalizado': 0 };
            return peso[b.estado] - peso[a.estado] || new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
        });
    },

    /**
     * Guardar datos en LocalStorage
     */
    guardarTorneos: function () {
        CyberUtils.storage(this.config.storageKey, this.state.torneos);

        // HOOK PARA BACKEND FUTURO:
        // this.syncWithBackend();
    },

    /**
     * Configuración de Event Listeners
     */
    setupEventListeners: function () {
        // Toggle Botón Crear
        const btnShowCreate = document.getElementById('btnShowCreate');
        const createSection = document.getElementById('createTournamentSection');
        const btnCancel = document.getElementById('btnCancelCreate');

        if (btnShowCreate) {
            btnShowCreate.addEventListener('click', () => {
                createSection.style.display = 'block';
                btnShowCreate.style.display = 'none';
            });
        }

        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                createSection.style.display = 'none';
                btnShowCreate.style.display = 'inline-block';
            });
        }

        // Formulario Crear
        const form = document.getElementById('createTournamentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCreateTournament(new FormData(form));
            });
        }

        // Filtros
        const filters = document.querySelectorAll('.filter-btn');
        filters.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class
                filters.forEach(b => b.classList.remove('active'));
                // Add active class
                e.target.classList.add('active');
                // Filter
                this.state.filtroActual = e.target.dataset.filter;
                this.renderList();
            });
        });

        // Modal Close
        const closeModal = document.querySelector('.close-modal');
        const modal = document.getElementById('tournamentDetailModal');
        if (closeModal && modal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.style.display = 'none';
            });
        }
    },

    /**
     * Manejador de Creación de Torneo
     */
    handleCreateTournament: function (formData) {
        const nuevoTorneo = {
            id: 'torneo_' + Date.now().toString(36),
            nombre: formData.get('nombre'),
            juego: formData.get('juego'),
            formato: formData.get('formato'),
            max_participantes: parseInt(formData.get('max_participantes')),
            fecha_inicio: formData.get('fecha_inicio'),
            reglas: formData.get('reglas'),
            estado: this.config.estados.PLANIFICADO,
            fecha_creacion: new Date().toISOString(),
            participantes: [],
            creador: this.state.usuarioActual
        };

        // Guardar
        this.state.torneos.unshift(nuevoTorneo);
        this.guardarTorneos();

        // UI Feedback
        CyberUtils.showMessage('Torneo creado exitosamente.', 'success');

        // Reset UI
        document.getElementById('createTournamentForm').reset();
        document.getElementById('createTournamentSection').style.display = 'none';
        document.getElementById('btnShowCreate').style.display = 'inline-block';

        this.renderList();

        // HOOK BACKEND
        // api.post('/torneos', nuevoTorneo);
    },

    /**
     * Renderizar lista de torneos
     */
    renderList: function () {
        const grid = document.getElementById('tournamentsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        // Filtrar
        const torneosFiltrados = this.state.torneos.filter(t => {
            if (this.state.filtroActual === 'all') return true;
            return t.estado === this.state.filtroActual;
        });

        if (torneosFiltrados.length === 0) {
            grid.innerHTML = '<div class="text-center text-dim mt-2">No se encontraron torneos en este sector.</div>';
            return;
        }

        torneosFiltrados.forEach(torneo => {
            const card = document.createElement('div');
            card.className = 'tournament-card section-card';
            card.onclick = () => this.openDetail(torneo.id); // Click para ver detalle

            // Determinar color de estado
            let statusColor = 'var(--text-dim)';
            let statusLabel = 'DESCONOCIDO';

            if (torneo.estado === 'planificado') {
                statusColor = 'var(--neon-blue)';
                statusLabel = 'PLANIFICADO';
            } else if (torneo.estado === 'en_curso') {
                statusColor = 'var(--neon-green)';
                statusLabel = 'EN CURSO';
            } else if (torneo.estado === 'finalizado') {
                statusColor = 'var(--text-dim)';
                statusLabel = 'FINALIZADO';
            }

            // Calcular plazas
            const plazasOcupadas = torneo.participantes.length;
            const plazasTotales = torneo.max_participantes;
            const progressPercent = (plazasOcupadas / plazasTotales) * 100;

            card.innerHTML = `
                <div class="tournament-header">
                    <span class="badge" style="color: ${statusColor}; border-color: ${statusColor}">${statusLabel}</span>
                    <span class="text-dim text-mono text-small">${new Date(torneo.fecha_inicio).toLocaleDateString()}</span>
                </div>
                <h3 class="mt-1 mb-1 neon-text-subtle">${torneo.nombre}</h3>
                <div class="tournament-meta text-mono text-small text-dim mb-1">
                    <div>🎮 ${torneo.juego}</div>
                    <div>🏆 ${torneo.formato.replace('_', ' ')}</div>
                </div>
                <div class="tournament-progress">
                    <div class="progress-label flex justify-between text-mono text-small mb-05">
                        <span>Participantes</span>
                        <span>${plazasOcupadas}/${plazasTotales}</span>
                    </div>
                    <div class="progress-track">
                        <div class="progress-fill" style="width: ${progressPercent}%; background-color: ${statusColor}"></div>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    },

    /**
     * Abrir detalle de torneo
     */
    openDetail: function (torneoId) {
        const torneo = this.state.torneos.find(t => t.id === torneoId);
        if (!torneo) return;

        const modal = document.getElementById('tournamentDetailModal');
        const body = document.getElementById('modalBody');

        // Generar lista participantes
        let participantesHTML = '';
        if (torneo.participantes.length > 0) {
            participantesHTML = `<ul class="participant-list mt-1">`;
            torneo.participantes.forEach(p => {
                const isMe = p.id_usuario === this.state.usuarioActual ? '(TÚ)' : '';
                participantesHTML += `<li class="participant-item text-mono text-small">
                    👤 ${p.nombre || 'Anónimo'} ${isMe}
                </li>`;
            });
            participantesHTML += `</ul>`;
        } else {
            participantesHTML = '<p class="text-dim text-small italic mt-1">Aún no hay inscripciones.</p>';
        }

        // Acciones disponibles
        let actionButtons = '';
        const yaInscrito = torneo.participantes.some(p => p.id_usuario === this.state.usuarioActual);
        const lleno = torneo.participantes.length >= torneo.max_participantes;

        if (torneo.estado === 'planificado') {
            if (yaInscrito) {
                actionButtons = `<button class="btn btn-disabled" disabled>Ya estás inscrito</button>`;
            } else if (lleno) {
                actionButtons = `<button class="btn btn-disabled" disabled>CUPO COMPLETO</button>`;
            } else {
                actionButtons = `<button onclick="TournamentsModule.unirseTorneo('${torneo.id}')" class="btn btn-primary">INSCRIBIRSE AL TORNEO</button>`;
            }

            // Admin Actions (Para DEMO, cualquiera puede cambiar estado si es creador o por simplicidad)
            // En prod real esto iría con auth.
            actionButtons += `
                <div class="admin-actions mt-2 pt-1 border-top-dim">
                    <p class="text-dim text-small mb-1">Administración del Torneo:</p>
                    <button onclick="TournamentsModule.cambiarEstado('${torneo.id}', 'en_curso')" class="btn text-green border-green text-small">INICIAR TORNEO</button>
                    <button onclick="TournamentsModule.cambiarEstado('${torneo.id}', 'finalizado')" class="btn text-dim border-dim text-small">FINALIZAR (CANCELAR)</button>
                </div>
            `;
        } else if (torneo.estado === 'en_curso') {
            actionButtons += `
                <div class="admin-actions mt-2 pt-1 border-top-dim">
                    <p class="text-green text-mono mb-1">>> TORNEO EN PROGRESO</p>
                    <button onclick="TournamentsModule.cambiarEstado('${torneo.id}', 'finalizado')" class="btn btn-primary text-small">FINALIZAR TORNEO</button>
                </div>
            `;
        }

        body.innerHTML = `
            <h2 class="neon-title-red mb-1">${torneo.nombre}</h2>
            <div class="grid-2-col gap-2 mb-2">
                <div>
                    <p class="text-dim text-mono text-small">JUEGO</p>
                    <p class="text-large">${torneo.juego}</p>
                </div>
                <div>
                    <p class="text-dim text-mono text-small">ESTADO</p>
                    <p class="${torneo.estado === 'en_curso' ? 'text-green' : 'text-blue'} uppercase">${torneo.estado.replace('_', ' ')}</p>
                </div>
            </div>
            
            <div class="mb-2">
                <p class="text-dim text-mono text-small">REGLAS / INFO</p>
                <div class="rules-box p-1 border-dim bg-darker text-small text-mono">
                    ${torneo.reglas || 'Sin reglas específicas.'}
                </div>
            </div>

            <div class="mb-2">
                <p class="text-dim text-mono text-small flex justify-between">
                    <span>PARTICIPANTES</span>
                    <span>${torneo.participantes.length} / ${torneo.max_participantes}</span>
                </p>
                ${participantesHTML}
            </div>

            <div class="text-center mt-2">
                ${actionButtons}
            </div>
        `;

        modal.style.display = 'flex';
    },

    /**
     * Unirse a un torneo
     */
    unirseTorneo: function (torneoId) {
        const torneo = this.state.torneos.find(t => t.id === torneoId);
        if (!torneo) return;

        // Validaciones
        if (torneo.participantes.length >= torneo.max_participantes) {
            CyberUtils.showMessage('El torneo está lleno.', 'info');
            return;
        }

        const nuevoParticipante = {
            id_usuario: this.state.usuarioActual,
            nombre: 'Jugador ' + this.state.usuarioActual.substr(-4), // Simulación de nombre
            fecha_inscripcion: new Date().toISOString()
        };

        torneo.participantes.push(nuevoParticipante);
        this.guardarTorneos(); // Persistir

        CyberUtils.showMessage('¡Te has inscrito correctamente!', 'success');

        // Refrescar vistas
        this.renderList();
        this.openDetail(torneoId); // Recargar modal

        // HOOK BACKEND
        // api.post(`/torneos/${torneoId}/join`, { userId: ... });
    },

    /**
     * Cambiar estado del torneo
     */
    cambiarEstado: function (torneoId, nuevoEstado) {
        const torneo = this.state.torneos.find(t => t.id === torneoId);
        if (!torneo) return;

        torneo.estado = nuevoEstado;
        this.guardarTorneos();

        CyberUtils.showMessage(`Estado actualizado a: ${nuevoEstado}`, 'info');

        this.renderList();
        this.openDetail(torneoId);
    },

    /**
     * Hook para futura implementación de API
     */
    syncWithBackend: async function () {
        // console.log('Sincronizando con backend...');
        // const response = await fetch('/api/sync', { method: 'POST', body: JSON.stringify(this.state.torneos) });
    }
};

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    TournamentsModule.init();
});
