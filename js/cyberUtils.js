const CyberUtils = {
    /**
     * Obtiene o establece datos en localStorage con namespace
     * @param {string} key - Clave del dato
     * @param {any} value - Valor a guardar (opcional)
     * @returns {any} Valor recuperado o null
     */
    storage: function (key, value = undefined) {
        // Simple compression/optimization prefix check could go here
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
     * Muestra un mensaje de estado temporal(feedback visual / Toast)
     * @param { string } message - Texto a mostrar
     * @param { string } type - 'success', 'info', 'warning', 'error'
     * @param { HTMLElement } container - Opcional.Si no se da, usa un Toast global
     */
    showMessage: function (message, type = 'info', container = null) {
        if (!container) {
            // Usar sistema genérico de Toasts
            this.showToast(message, type);
            return;
        }

        // ... lógica existente para contenedores específicos ...
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
     * Toast Global
     */
    showToast: function (message, type = 'info') {
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.style.position = 'fixed';
            toastContainer.style.bottom = '2rem';
            toastContainer.style.right = '2rem';
            toastContainer.style.zIndex = '9999';
            toastContainer.style.display = 'flex';
            toastContainer.style.flexDirection = 'column';
            toastContainer.style.gap = '1rem';
            document.body.appendChild(toastContainer);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type} panel-terminal`;
        toast.style.minWidth = '250px';
        toast.style.padding = '1rem';
        toast.style.borderLeft = `4px solid var(--neon-${type === 'error' ? 'brand' : (type === 'success' ? 'success' : 'info')})`;
        toast.style.background = '#000';
        toast.style.color = '#fff';
        toast.style.boxShadow = '0 0 10px rgba(0,0,0,0.8)';
        toast.style.opacity = '0';
        toast.style.transition = 'all 0.3s ease';
        toast.style.transform = 'translateY(20px)';

        // Icono simple
        let icon = 'ℹ️';
        if (type === 'success') icon = '✅';
        if (type === 'error') icon = '⚠️';

        toast.innerHTML = `<div style="display:flex; align-items:center; gap:0.5rem"><span style="font-size:1.2rem">${icon}</span> <span class="text-mono">${message}</span></div>`;

        toastContainer.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateY(0)';
        });

        // Auto remove
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 5000);
    },

    /**
     * Debounce function for optimizations
     */
    debounce: function (func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * Delay helper for async retry logic
     */
    delay: function (ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
     * Detectar estado de conexión
     */
    checkConnection: function () {
        return navigator.onLine;
    }
};

// Monitor de conexión
window.addEventListener('online', () => {
    CyberUtils.showMessage('CONEXIÓN REESTABLECIDA', 'success');
});
window.addEventListener('offline', () => {
    CyberUtils.showMessage('MODO OFFLINE ACTIVO', 'info');
});
