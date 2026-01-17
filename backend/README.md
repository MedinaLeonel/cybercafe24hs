# Cybercafé 24hs Backend

Backend ligero en Node.js + Express + SQLite.

## Instalación

1.  Entrar a la carpeta:
    ```bash
    cd backend
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

3.  Correr servidor:
    ```bash
    npm start
    ```
    (El servidor corre en http://localhost:3000)

## Endpoints

### Auth
- `POST /api/auth/register` { username, email, password }
- `POST /api/auth/login` { email, password } -> Devuelve JWT

### Servicios
- `GET /api/services` (Público) -> Lista todos los servicios
- `POST /api/services` (Auth) { titulo, descripcion, enlace, tipo, fecha } -> Crea servicio
- `DELETE /api/services/:id` (Auth) -> Borra servicio propio

## Variables de Entorno (.env)
Configurar en archivo `.env` en raíz de `backend/`.
