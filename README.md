# Velo

Sistema web de **gestión de incidencias internas** (TFG DAM Dual).

## Estructura

```
velo/
├── backend/    # Next.js — API + Better Auth (puerto 3000)
├── frontend/   # Vite + React (puerto 5173)
└── package.json
```

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Instalación (importante)

Instala **cada parte por separado** para evitar errores de dependencias en Windows:

```powershell
cd c:\Users\migue\Downloads\velo

# 1. Raíz (solo herramientas de arranque)
npm install

# 2. Backend
cd backend
copy .env.example .env
# Edita .env: DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
npm install
npx @better-auth/cli@latest migrate -y
npm run db:incidencias   # incluye migración TFG (eventos, lecturas, cierre)
npm run seed:admin
npm run seed:demo        # opcional: usuarios e incidencias de ejemplo
cd ..

# 3. Frontend
cd frontend
npm install
cd ..
```

## Desarrollo

Abre **dos terminales**:

**Terminal 1 — Backend (obligatorio primero):**
```powershell
cd backend
npm run dev:clean
```
Espera a ver `Ready` en http://localhost:3000

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```

- Frontend: http://localhost:5173  
- Backend: http://localhost:3000  

El archivo `frontend/.env.development` apunta auth y API al puerto 3000 (necesario para las cookies de sesión).

**Login:** define `ADMIN_EMAIL` y `ADMIN_PASSWORD` en `backend/.env` antes de
ejecutar `npm run seed:admin`. Si no los defines, el script genera una contraseña
aleatoria y la imprime una sola vez por consola (anótala).

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Backend + frontend |
| `npm run build` | Build de producción |
| `npm run db:setup` | Tablas + usuario admin |
| `npm run db:tfg` | Solo extensiones TFG (historial, lecturas, cierre) |
| `npm run seed:demo` | Usuarios e incidencias de demostración |
| `npm test` (backend) | Tests de utilidades markdown/imágenes |

## Docker (PostgreSQL)

```powershell
docker compose up -d
# DATABASE_URL en backend/.env:
# postgresql://velo:velo@localhost:5432/velo
```

## Despliegue en Vercel

Frontend y backend en **una sola URL** (Neon para PostgreSQL): [docs/DEPLOY.md](docs/DEPLOY.md)

## Memoria TFG

Documentación ampliada: [docs/TFG.md](docs/TFG.md)

## Credenciales de prueba

Tras `npm run seed:admin` en `backend/` — ver `backend/scripts/seed-admin.ts`.

Tras `npm run seed:demo`: `ana@velo.com`, `carlos@velo.com`, `laura@velo.com` / `demo123`.

## Roles

- **Portal**: cualquier usuario en tabla `usuarios`.
- **Panel admin**: departamento `ADMIN` en `usuarios.departamento`.

## Imágenes en incidencias

Al abrir una tarea en el tablero Kanban puedes:

- **Adjuntos generales**: sección «Evidencias y adjuntos» (JPG, PNG, WEBP, GIF, máx. 5 MB).
- **Chat**: icono del clip para enviar una imagen con o sin texto.

Los archivos se guardan en `backend/uploads/incidencias/` (no se versionan en git). Tras actualizar el código, ejecuta `npm run db:incidencias` en `backend/` si aún no tienes las tablas nuevas.

## Si algo falla

```powershell
# Reinstalar dependencias limpias
cd backend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
cd ..\frontend
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
npm install
```

Cierra procesos `node` viejos (puertos 3000/5173) antes de `npm run dev`.
