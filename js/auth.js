/**
 * Módulo de Autenticación con Supabase
 * Botón Login/Logout
 * Modal Login/Registro
 * Manejo de Sesión
 */

// NOTA: Estas constantes deberían venir de variables de entorno o ser inyectadas.
// Al no tener un bundler configurado para leer .env en runtime en el navegador sin proceso de build explícito,
// usamos las globales o fallbacks (el usuario deberá configurar esto).
// NOTA: Configuración obtenida de CyberConfig
const sbConfig = window.CyberConfig ? window.CyberConfig.getSupabaseConfig() : { url: '', anonKey: '' };
const SUPABASE_URL = sbConfig.url;
const SUPABASE_KEY = sbConfig.anonKey;

// Inicializamos el cliente aquí si no existe
const supabaseAuth = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const LoginState = {
    modal: null,
    overlay: null,
    btnOpen: null,
    user: null,

    init: async function () {
        this.createUserInterface();

        try {
            // Verificar sesión actual
            const user = await window.apiClient.getCurrentUser();
            if (user) {
                this.updateAuthStatus(user);
            }

            // Suscribirse a cambios de auth
            if (window.apiClient && window.apiClient.supabase) {
                window.apiClient.supabase.auth.onAuthStateChange((event, session) => {
                    if (session) {
                        this.updateAuthStatus(session.user);
                    } else {
                        this.updateAuthStatus(null);
                    }
                });
            }
        } catch (error) {
            CyberLogger.error('Error inicializando AuthState', error);
        }
    },

    /**
     * Crear Elementos UI en el DOM (Modal y Botón Header)
     */
    createUserInterface: function () {
        // 1. Insertar botón en header si no existe
        const headerNav = document.querySelector('.site-header');
        if (headerNav && !document.getElementById('auth-container')) {
            const authContainer = document.createElement('div');
            authContainer.id = 'auth-container';
            authContainer.style.position = 'absolute';
            authContainer.style.top = '1rem';
            authContainer.style.right = '1rem';
            authContainer.innerHTML = `
                <span id="user-display" class="text-mono text-dim hidden" style="margin-right: 1rem; font-size: 0.8rem;"></span>
                <button id="auth-btn" class="btn btn-small" style="border: 1px dashed var(--text-dim);">LOGIN</button>
            `;
            headerNav.style.position = 'relative';
            headerNav.appendChild(authContainer);

            this.btnOpen = document.getElementById('auth-btn');
            this.btnOpen.addEventListener('click', () => this.handleAuthClick());
        }

        // 2. Insertar Modal en Body
        if (!document.getElementById('authModal')) {
            const modalHTML = `
            <div id="authModal" class="modal-overlay hidden">
                <div class="modal-content panel-terminal" style="max-width: 400px;">
                    <button id="closeAuthModal" class="text-dim" style="position: absolute; top:1rem; right:1rem; background:none; border:none; cursor:pointer; font-size:1.2rem;">✕</button>
                    
                    <div class="tabs text-center mb-2" style="border-bottom: 1px solid #333; padding-bottom: 1rem;">
                        <button class="btn btn-small active" id="tab-login" style="margin-right:0.5rem">LOGIN</button>
                        <button class="btn btn-small" id="tab-register">REGISTRO</button>
                    </div>

                    <!-- LOGIN FORM -->
                    <form id="loginForm">
                        <input name="email" class="input-terminal" type="email" placeholder="EMAIL" required />
                        <input name="password" class="input-terminal" type="password" placeholder="PASSWORD" required />
                        <button type="submit" class="btn btn-primary" style="width: 100%">ENTRAR</button>
                    </form>

                    <!-- REGISTER FORM -->
                    <form id="registerForm" class="hidden">
                        <input name="email" class="input-terminal" type="email" placeholder="EMAIL" required />
                        <input name="password" class="input-terminal" type="password" placeholder="PASSWORD" required />
                        <button type="submit" class="btn btn-primary" style="width: 100%">REGISTRARSE</button>
                    </form>

                    <div id="auth-msg" class="text-center text-mono mt-2" style="min-height: 1.2em;"></div>
                </div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);

            this.modal = document.getElementById('authModal');

            // Listeners del modal
            document.getElementById('closeAuthModal').addEventListener('click', () => this.toggleModal(false));
            document.getElementById('tab-login').addEventListener('click', () => this.switchTab('login'));
            document.getElementById('tab-register').addEventListener('click', () => this.switchTab('register'));

            document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
            document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        }
    },

    /**
     * Actualizar UI basado en estado de auth
     */
    updateAuthStatus: function (user) {
        this.user = user;
        const btn = document.getElementById('auth-btn');
        const display = document.getElementById('user-display');

        if (user) {
            // Logueado
            btn.textContent = 'LOGOUT';
            // Extract username from email simply
            const username = user.email ? user.email.split('@')[0].toUpperCase() : 'USER';
            display.textContent = `HOLA, ${username}`;
            display.classList.remove('hidden');
        } else {
            // No logueado
            btn.textContent = 'LOGIN';
            btn.classList.remove('text-brand');
            display.textContent = '';
            display.classList.add('hidden');
        }
    },

    /**
     * Click en botón header (Login o Logout)
     */
    handleAuthClick: async function () {
        if (this.user) {
            // Logout
            try {
                const { error } = await window.apiClient.supabase.auth.signOut();
                if (error) throw error;

                CyberUtils.showMessage('Sesión cerrada correctamente.', 'info');
                setTimeout(() => window.location.reload(), 500);
            } catch (error) {
                CyberLogger.error('Error cerrando sesión', error);
                alert('Error cerrando sesión: ' + error.message);
            }
        } else {
            // Abrir modal
            this.toggleModal(true);
        }
    },

    toggleModal: function (show) {
        if (show) {
            this.modal.classList.remove('hidden');
            this.switchTab('login'); // Reset a login
            document.getElementById('auth-msg').textContent = '';
        } else {
            this.modal.classList.add('hidden');
        }
    },

    switchTab: function (tab) {
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        const tabLogin = document.getElementById('tab-login');
        const tabRegister = document.getElementById('tab-register');

        if (tab === 'login') {
            loginForm.classList.remove('hidden');
            registerForm.classList.add('hidden');
            tabLogin.classList.add('active');
            tabLogin.style.borderColor = 'var(--neon-info)';
            tabRegister.classList.remove('active');
            tabRegister.style.borderColor = '#333';
        } else {
            loginForm.classList.add('hidden');
            registerForm.classList.remove('hidden');
            tabRegister.classList.add('active');
            tabRegister.style.borderColor = 'var(--neon-info)';
            tabLogin.classList.remove('active');
            tabLogin.style.borderColor = '#333';
        }
        document.getElementById('auth-msg').textContent = '';
    },

    handleLogin: async function (e) {
        e.preventDefault();
        const msg = document.getElementById('auth-msg');
        msg.textContent = 'Procesando...';
        msg.style.color = 'var(--text-dim)';

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { data, error } = await window.apiClient.supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            msg.textContent = '¡BIEVENIDO!';
            msg.style.color = 'var(--neon-success)';

            // Éxito
            setTimeout(() => this.toggleModal(false), 1000);

        } catch (error) {
            let errorText = error.message;
            if (error.message === 'Invalid login credentials') errorText = 'Credenciales inválidas';

            msg.textContent = errorText;
            msg.style.color = 'var(--neon-brand)';
            CyberLogger.warn('Login fallido', error);
        }
    },

    handleRegister: async function (e) {
        e.preventDefault();
        const msg = document.getElementById('auth-msg');
        msg.textContent = 'Creando cuenta...';
        msg.style.color = 'var(--text-dim)';

        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const { data, error } = await window.apiClient.supabase.auth.signUp({
                email,
                password
            });

            if (error) throw error;

            msg.textContent = '¡Cuenta creada! Verifica tu email.';
            msg.style.color = 'var(--neon-success)';

            setTimeout(() => this.toggleModal(false), 2000);

        } catch (error) {
            msg.textContent = error.message;
            msg.style.color = 'var(--neon-brand)';
            CyberLogger.warn('Registro fallido', error);
        }
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    // Wait for apiClient to be ready
    if (window.apiClient) {
        LoginState.init();
    } else {
        setTimeout(() => LoginState.init(), 500);
    }
});
