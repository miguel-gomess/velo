# Desplegar Velo en Vercel (frontend + backend en una URL)

Un solo proyecto de Vercel sirve la SPA (Vite) y la API (Next.js) en el mismo dominio. La base de datos va aparte en [Neon](https://neon.tech) (gratis).

## 1. Base de datos (Neon)

1. Crea cuenta en [neon.tech](https://neon.tech).
2. Nuevo proyecto → copia la **connection string** (PostgreSQL).
3. Debe incluir SSL, por ejemplo:
   `postgresql://usuario:pass@ep-xxx.neon.tech/velo?sslmode=require`

## 2. Repositorio en GitHub

Sube el proyecto a un repo de GitHub (si aún no está).

## 3. Proyecto en Vercel

1. [vercel.com](https://vercel.com) → **Add New** → **Project** → importa el repo.
2. **Settings → General → Root Directory:** escribe **`backend`** y guarda (obligatorio).
3. **Settings → Build and Deployment:** deja **Install** y **Build** en *Default* (sin override manual). Usa `backend/vercel.json`.
4. **No** uses `rootDirectory` dentro de `vercel.json` (Vercel lo rechaza). Solo en **Settings → Root Directory** = `backend`.
5. El deploy debe usar el último commit de `main`.

## 4. Variables de entorno

En **Settings → Environment Variables** del proyecto, añade:

| Variable | Valor | Notas |
|----------|--------|--------|
| `DATABASE_URL` | Connection string de Neon | Obligatorio |
| `DATABASE_SSL` | `true` | Obligatorio con Neon |
| `BETTER_AUTH_SECRET` | Cadena aleatoria larga | `openssl rand -hex 32` |
| `BETTER_AUTH_URL` | **La URL exacta de la barra del navegador** (ej. `https://velo-xxx.vercel.app`) | Sin `/` final. Debe coincidir con donde abres la app (no uses un dominio que devuelva 404). |
| `ADMIN_EMAIL` | `admin@tuempresa.com` | Para el primer admin |
| `ADMIN_PASSWORD` | Contraseña fuerte | Solo para el seed inicial |

Opcional:

| Variable | Valor |
|----------|--------|
| `ALLOWED_ORIGINS` | Misma URL de Vercel si usas dominio custom además del `.vercel.app` |

**No** configures `VITE_AUTH_BASE_URL` en Vercel: en producción la app usa el mismo origen (`/api/...`).

## 5. Primer deploy

Pulsa **Deploy**. El build ejecuta:

1. `npm run build` en `frontend/` (sin URL externa de API).
2. Copia `frontend/dist` → `backend/public`.
3. `next build` en `backend/`.

## 6. Migraciones y admin (desde tu PC)

Con la misma `DATABASE_URL` de Neon en un `backend/.env` local:

```powershell
cd backend
# .env con DATABASE_URL de Neon y DATABASE_SSL=true
npx @better-auth/cli@latest migrate -y
npm run db:incidencias   # incluye usuarios, incidencias, equipos y extensiones TFG
npm run seed:admin
```

Opcional: `npm run seed:demo` para datos de prueba.

## 7. Comprobar

- Abre `https://tu-proyecto.vercel.app` → debe cargar el login de Velo.
- `https://tu-proyecto.vercel.app/api/health` → JSON con estado.

## Desarrollo local vs producción

| | Local | Vercel |
|---|--------|--------|
| Frontend | `:5173` (Vite) | Mismo dominio que API |
| Backend | `:3000` | Mismo dominio |
| API | Proxy `/api` → 3000 | `/api` directo |

Probar build unificado en local:

```powershell
npm run preview:unified
```

Abre http://localhost:3000

## Limitaciones en Vercel (plan gratis)

- **Adjuntos / imágenes:** se guardan en disco del servidor; en Vercel ese disco es **efímero** (pueden perderse al redeploy). Para un TFG suele bastar; para producción real usa Render con disco o almacenamiento S3/R2.
- **Cold start:** la primera petición tras inactividad puede tardar unos segundos.

## Dominio propio

En Vercel → **Domains**, añade tu dominio y actualiza `BETTER_AUTH_URL` (y `ALLOWED_ORIGINS` si aplica).

## Si el build falla

- Confirma **Root Directory** = raíz del repo.
- Revisa los logs: fallos habituales = `DATABASE_URL` incorrecta o dependencias (Node 20+).
- Build local: `npm run build:vercel` desde la raíz del repo.
