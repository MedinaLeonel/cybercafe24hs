class CyberConfig {
    static get(key) {
        // 1. Vite/import.meta.env (desarrollo con build)
        try {
            if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
                return import.meta.env[key];
            }
        } catch (e) {
            // Ignorar error si import.meta no existe
        }

        // 2. Netlify/Window ENV (producción sin build o inyectado)
        if (window.ENV && window.ENV[key]) {
            return window.ENV[key];
        }

        // 3. Configuración local para desarrollo (config.local.js)
        if (window.CYBER_CONFIG && window.CYBER_CONFIG[key]) {
            console.warn('⚠️ Usando configuración local - SOLO DESARROLLO');
            return window.CYBER_CONFIG[key];
        }

        // 4. Fallbacks para desarrollo (NUNCA producción)
        const fallbacks = {
            VITE_SUPABASE_URL: 'https://placeholder.supabase.co',
            VITE_SUPABASE_ANON_KEY: 'eyJplaceholder...',
            MODE: 'development'
        };

        const value = fallbacks[key];
        if (value) {
            const mode = this.getMode();
            if (mode === 'development') {
                console.warn(`⚠️ Usando fallback para ${key} - Verifica configuración`);
                return value;
            }
        }

        // Si es opcional o estamos testeando, devolver undefined o lanzar error
        // throw new Error(`❌ Variable de entorno ${key} no configurada`);
        return null;
    }

    static getMode() {
        // Intentar determinar modo
        if (window.CYBER_CONFIG && window.CYBER_CONFIG.MODE) return window.CYBER_CONFIG.MODE;
        if (window.ENV && window.ENV.MODE) return window.ENV.MODE;
        try {
            if (import.meta && import.meta.env && import.meta.env.MODE) return import.meta.env.MODE;
        } catch (e) { }
        return 'development'; // Default
    }

    static isProduction() {
        return this.getMode() === 'production';
    }

    static getSupabaseConfig() {
        return {
            url: this.get('VITE_SUPABASE_URL'),
            anonKey: this.get('VITE_SUPABASE_ANON_KEY')
        };
    }
}

// Export para módulos
window.CyberConfig = CyberConfig;
