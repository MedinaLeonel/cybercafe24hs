/**
 * Módulo de Autenticación
 * Botón Login/Logout
 * Modal Login/Registro
 * Manejo de JWT en LocalStorage
 */

const AUTH_API = "http://localhost:3000/api/auth";

const LoginState = {
    modal: null,
    overlay: null,
    btnOpen: null,
    init: function () {
        this.createUserInterface();
        this.checkAuthStatus();
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
                        <input name="username" class="input-terminal" type="text" placeholder="USUARIO" required />
                        <input name="email" class="input-terminal" type="email" placeholder="EMAIL" required />
                        <input name="password" class="input-terminal" type="password" placeholder="PASSWORD" required />
                        <button type="submit" class="btn btn-primary" style="width: 100%">REGISTRARSE</button>
                    </form>

                    <div id="auth-msg" class="text-center text-mono mt-2" style="font-size: 0.8rem; min-height: 1.2em;"></div>
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
     * Verificar si hay token y actualizar UI
     */
    checkAuthStatus: function () {
        const token = localStorage.getItem('token');
        const username = localStorage.getItem('username');
        const btn = document.getElementById('auth-btn');
        const display = document.getElementById('user-display');

        if (token && username) {
            // Logueado
            btn.textContent = 'LOGOUT';
            // btn.classList.add('text-brand'); 
            display.textContent = `HOLA, ${username.toUpperCase()}`;
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
    handleAuthClick: function () {
        const token = localStorage.getItem('token');
        if (token) {
            // Logout
            localStorage.removeItem('token');
            localStorage.removeItem('username');
            alert('Sesión cerrada correctamente.');
            window.location.reload();
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

    /**
     * Helper para peticiones Auth
     */
    authRequest: async function (endpoint, data) {
        const msg = document.getElementById('auth-msg');
        msg.textContent = 'Procesando...';
        msg.style.color = 'var(--text-dim)';

        try {
            const res = await fetch(`${AUTH_API}/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || 'Error en autenticación');
            }

            return json;

        } catch (error) {
            msg.textContent = error.message;
            msg.style.color = 'var(--neon-brand)';
            throw error;
        }
    },

    handleLogin: async function (e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));

        try {
            const res = await this.authRequest('login', data);
            this.postAuthSuccess(res);
        } catch (err) {
            // Error handled in authRequest
        }
    },

    handleRegister: async function (e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));

        try {
            const res = await this.authRequest('register', data);
            this.postAuthSuccess(res);
        } catch (err) {
            // Error handled in authRequest
        }
    },

    postAuthSuccess: function (response) {
        // Guardar datos
        localStorage.setItem('token', response.token);
        localStorage.setItem('username', response.user.username);

        // Feedback
        const msg = document.getElementById('auth-msg');
        msg.textContent = '¡BIEVENIDO!';
        msg.style.color = 'var(--neon-success)';

        setTimeout(() => {
            this.toggleModal(false);
            this.checkAuthStatus();
            // Recargar para actualizar UI de servicios si es necesario
            window.location.reload();
        }, 1000);
    }
};

// Inicializar al cargar
document.addEventListener('DOMContentLoaded', () => {
    LoginState.init();
});
