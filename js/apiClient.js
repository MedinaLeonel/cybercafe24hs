class CyberApiClient {
    constructor() {
        this.config = window.CyberConfig ? window.CyberConfig.getSupabaseConfig() : null;

        if (!this.config || !this.config.url || !this.config.anonKey) {
            CyberLogger.error('Falta configuración de Supabase');
            return;
        }

        try {
            this.supabase = supabase.createClient(this.config.url, this.config.anonKey);
            CyberLogger.info('Supabase Client inicializado correctamente');

            // Iniciar procesador de cola si existe
            this.initQueueProcessor();
        } catch (e) {
            CyberLogger.error('Error inicializando Supabase', e);
        }

        // Cache simple en memoria
        this.cache = new Map();
    }

    initQueueProcessor() {
        if (!window.syncQueue) return;

        // Escuchar online para procesar cola
        window.addEventListener('online', () => {
            CyberLogger.info('Conexión detectada. Procesando cola...');
            window.syncQueue.processQueue(this.supabase);
        });

        // Procesar al inicio si hay conexión
        if (navigator.onLine) {
            setTimeout(() => window.syncQueue.processQueue(this.supabase), 1000);
        }

        // Listener de auth para reintentar pendientes al tener usuario
        if (this.supabase) {
            this.supabase.auth.onAuthStateChange((event, session) => {
                if (session && navigator.onLine) {
                    window.syncQueue.processQueue(this.supabase);
                }
            });
        }
    }

    /**
     * Forzar sincronización manual
     */
    async forceSync() {
        if (!window.syncQueue) return;
        return window.syncQueue.processQueue(this.supabase);
    }

    async handleRequest(operationName, operationFn) {
        // Wrapper simple para lecturas directas
        // Las escrituras ahora usarán la cola preferentemente
        try {
            const result = await operationFn();
            return result;
        } catch (error) {
            CyberLogger.warn(`Error en lectura ${operationName}`, error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (!this.supabase) return null;
        const { data: { user } } = await this.supabase.auth.getUser();
        return user;
    }

    // ===========================
    // PRESENCIA
    // ===========================

    async getPresenceLogs() {
        // Lectura directa (first strategy: network, fallback: cache local handled in logic, but here pure network)
        const { data, error } = await this.supabase
            .from('presence_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    }

    async addPresenceLog(logData) {
        const user = await this.getCurrentUser();
        // Si no hay user, la cola guardará la op y fallará al procesar si requiere auth, 
        // pero permitimos encolar para cuando se loguee.
        const userId = user ? user.id : 'anonymous';

        // Usar cola de sincronización para escritura resiliente
        if (window.syncQueue) {
            const opData = {
                user_id: userId,
                fecha: logData.fecha,
                hora: logData.hora,
                actividad: logData.actividad
            };

            await window.syncQueue.addOperation('presence_logs', 'INSERT', opData, userId);
            CyberLogger.info('Log de presencia encolado para sincronización');

            // Intentar enviar inmediatamente si hay red
            if (navigator.onLine) {
                window.syncQueue.processQueue(this.supabase);
            }

            return opData; // Devolver optimistic data
        }

        // Fallback sin cola (no debería ocurrir si se carga syncQueue)
        throw new Error('SyncQueue no inicializada');
    }

    // ===========================
    // SERVICIOS
    // ===========================

    async getServicios() {
        const cacheKey = 'servicios_list';
        const cached = this.cache.get(cacheKey);
        // Cache 1 min
        if (cached && (Date.now() - cached.timestamp < 60000)) {
            return cached.data;
        }

        const { data, error } = await this.supabase
            .from('servicios')
            .select('*')
            .order('fecha_programada', { ascending: true });

        if (error) throw error;
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        return data;
    }

    async createServicio(servicioData) {
        const user = await this.getCurrentUser();
        const userId = user ? user.id : null;

        if (window.syncQueue) {
            const opData = {
                user_id: userId,
                nombre: servicioData.titulo,
                fecha_programada: servicioData.fecha,
                notas: servicioData.descripcion,
                completado: false
            };

            await window.syncQueue.addOperation('servicios', 'INSERT', opData, userId);

            if (navigator.onLine) window.syncQueue.processQueue(this.supabase);

            // Invalidar caché
            this.cache.delete('servicios_list');
            return opData;
        }
        throw new Error('SyncQueue no disponible');
    }


    // ===========================
    // TORNEOS
    // ===========================

    async getTorneos() {
        const { data, error } = await this.supabase
            .from('torneos')
            .select('*')
            .order('fecha', { ascending: true });

        if (error) throw error;
        return data;
    }

    async createTorneo(torneoData) {
        const user = await this.getCurrentUser();
        const userId = user ? user.id : null;

        if (window.syncQueue) {
            const opData = {
                user_id: userId,
                juego: torneoData.juego,
                fecha: torneoData.fecha,
                participantes: torneoData.participantes || []
            };

            await window.syncQueue.addOperation('torneos', 'INSERT', opData, userId);

            if (navigator.onLine) window.syncQueue.processQueue(this.supabase);
            return opData;
        }
    }
}

// Exportar instancia global
window.apiClient = new CyberApiClient();
