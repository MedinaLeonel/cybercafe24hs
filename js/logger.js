/**
 * Logger System for CyberCafé 24hs
 * Handles debug logging across modules.
 * Only logs to console if in development mode (or forced).
 */

const CyberLogger = {
    levels: {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    },

    // Determine environment (rudimentary check)
    isDev: (function () {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    })(),

    currentLevel: 0, // DEBUG by default in dev

    init: function () {
        if (!this.isDev) {
            this.currentLevel = this.levels.WARN; // Production: mainly warnings/errors
        }
        this.log(this.levels.INFO, 'Logger initialized. Mode:', this.isDev ? 'DEV' : 'PROD');
    },

    log: function (level, message, ...args) {
        if (level < this.currentLevel) return;

        const timestamp = new Date().toISOString();
        const prefix = `[CYBER-LOG][${timestamp}]`;

        switch (level) {
            case this.levels.DEBUG:
                console.log(`%c${prefix} [DEBUG] ${message}`, 'color: gray', ...args);
                break;
            case this.levels.INFO:
                console.log(`%c${prefix} [INFO] ${message}`, 'color: #05d9e8', ...args);
                break;
            case this.levels.WARN:
                console.warn(`${prefix} [WARN] ${message}`, ...args);
                break;
            case this.levels.ERROR:
                console.error(`${prefix} [ERROR] ${message}`, ...args);
                break;
        }
    },

    debug: function (msg, ...args) { this.log(this.levels.DEBUG, msg, ...args); },
    info: function (msg, ...args) { this.log(this.levels.INFO, msg, ...args); },
    warn: function (msg, ...args) { this.log(this.levels.WARN, msg, ...args); },
    error: function (msg, ...args) { this.log(this.levels.ERROR, msg, ...args); },

    /**
     * Log sync operations specifically
     */
    logSync: function (action, success, details) {
        const style = success ? 'color: #39ff14' : 'color: #ff2a6d';
        const status = success ? 'SUCCESS' : 'FAILED';
        console.log(`%c[SYNC] ${action} :: ${status}`, style, details);
    }
};

CyberLogger.init();
window.CyberLogger = CyberLogger;
