/**
 * Módulo de Servicios Conectado a Backend
 * API: http://localhost:3000/api/services
 */

const API_SERVICES = "http://localhost:3000/api/services";

/**
 * Cargar y renderizar servicios
 */
async function loadServices() {
    const container = document.getElementById("services-list");
    if (!container) return;

    // Mostrar estado de carga
    container.innerHTML = '<div class="text-center text-mono text-dim blink">>> SINCRONIZANDO BASE DE DATOS...</div>';

    try {
        const res = await fetch(API_SERVICES);
        if (!res.ok) throw new Error('Error al conectar con servidor');

        const services = await res.json();
        renderServices(services);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="text-center text-mono text-dim" style="color: var(--neon-brand)">Error de conexión con el servidor.</div>';
    }
}

/**
 * Renderizar tarjetas de servicio
 */
function renderServices(services) {
    const container = document.getElementById("services-list");
    container.innerHTML = "";

    if (services.length === 0) {
        container.innerHTML = '<div class="text-center text-mono text-dim">// SIN SERVICIOS ACTIVOS //</div>';
        return;
    }

    services.forEach(s => {
        // Determinar colores según tipo
        let typeColor = 'var(--text-dim)';
        const tipo = (s.tipo || '').toLowerCase();

        if (tipo.includes('pelicula') || tipo.includes('cine')) typeColor = 'var(--neon-info)';
        if (tipo.includes('evento')) typeColor = 'var(--neon-brand)';
        if (tipo.includes('promo')) typeColor = 'var(--neon-success)';

        const card = document.createElement("article");
        card.className = "panel-terminal"; // Reutilizamos panel-terminal del CSS global
        card.style.marginBottom = "1.5rem";

        card.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem; border-bottom: 1px dashed #333; padding-bottom: 0.5rem;">
            <div>
                <h3 class="text-main" style="margin: 0; font-size: 1.1rem;">${s.titulo}</h3>
                <span class="text-mono" style="color: ${typeColor}; font-size: 0.75rem;">[ ${(s.tipo || 'GENERAL').toUpperCase()} ]</span>
            </div>
            <div class="text-right">
                <div class="text-mono text-success" style="font-size: 0.7rem;">● ONLINE</div>
                <div class="text-mono text-dim" style="font-size: 0.75rem;">${s.fecha || ''}</div>
            </div>
        </div>
        
        <p class="text-dim text-mono" style="font-size: 0.9rem; margin-bottom: 1rem;">${s.descripcion || ''}</p>
        
        <div class="text-right">
            <a href="${s.enlace || '#'}" target="_blank" class="btn btn-small" style="text-decoration: none; display: inline-block;">
                > ACCEDER
            </a>
            ${s.creator ? `<div class="text-mono text-dim" style="font-size: 0.6rem; margin-top: 0.5rem;">BY: ${s.creator}</div>` : ''}
        </div>
        `;

        container.appendChild(card);
    });
}

/**
 * Manejar creación de servicio
 */
const form = document.getElementById("newServiceForm");
if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ ACCESO DENEGADO: Debes iniciar sesión para publicar.");
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            const res = await fetch(API_SERVICES, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                form.reset();
                // Ocultar formulario si está en un contenedor colapsable (opcional según UI actual)
                const container = document.getElementById("createServiceSection");
                if (container) container.classList.add("hidden");

                loadServices();
            } else {
                const err = await res.json();
                alert("Error: " + (err.error || "No se pudo crear el servicio"));
            }

        } catch (error) {
            console.error(error);
            alert("Error de conexión al intentar publicar.");
        }
    });
}

/**
 * Lógica de UI para mostrar/ocultar formulario
 * Reutiliza los IDs del HTML existente
 */
document.addEventListener("DOMContentLoaded", () => {
    loadServices();

    const btnShow = document.getElementById("btnShowCreateService");
    const section = document.getElementById("createServiceSection");
    const btnCancel = document.getElementById("btnCancelCreateService");

    if (btnShow && section) {
        btnShow.addEventListener("click", () => {
            // Verificar token antes de mostrar
            if (!localStorage.getItem("token")) {
                alert(">> SISTEMA: REQUIERE AUTENTICACIÓN (JWT TOKEN MISSING)");
                return;
            }
            section.classList.remove("hidden");
        });
    }

    if (btnCancel && section) {
        btnCancel.addEventListener("click", () => {
            section.classList.add("hidden");
        });
    }
});
