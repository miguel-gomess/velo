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

Usa **un solo** proyecto conectado al repo `miguelgomes129/velo` (producción: **velo** → `https://velo-two-sable.vercel.app`). No despliegues un proyecto aparte llamado solo «backend» sin el monorepo completo.

### Opción A (recomendada): raíz del repo

1. Importa el repo desde GitHub.
2. **Settings → General → Root Directory:** déjalo **vacío** (raíz del repositorio).
3. **Settings → Build and Deployment:** Install y Build en *Default*; usa `vercel.json` de la raíz.
4. El deploy debe usar el último commit de `main`.

### Opción B: Root Directory = `backend`

1. **Settings → General → Root Directory:** `backend`.
2. **Settings → Build and Deployment:** activa **«Include files outside of the Root Directory in the Build Step»** (obligatorio). Sin esto, el build solo ve ~94 archivos y falla con `ENOENT .../frontend/package.json`.
3. Install/Build por defecto; usa `backend/vercel.json`.

**No** pongas `rootDirectory` dentro de `vercel.json` (Vercel lo rechaza). Solo en el dashboard.

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
npm run db:admin-auth    # columnas plugin Admin + rol Better Auth para superadmin
npm run seed:admin
```

Variable opcional en Vercel: `SUPERADMIN_EMAIL` (por defecto `miguel@velo.com`). Solo ese usuario ve en el directorio la opción «Entrar como otro usuario».

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

| Síntoma en el log | Causa | Solución |
|-------------------|--------|----------|
| `Downloading ~94 deployment files` | Solo se sube `backend/`, sin `frontend/` | Opción B: activar *Include files outside…*; o Opción A con Root Directory vacío |
| `ENOENT .../frontend/package.json` | Mismo problema | Igual que arriba; o usa el proyecto **velo**, no un proyecto suelto «backend» |
| Deploy en proyecto «backend» vacío | Proyecto mal vinculado o sin Git | Conecta `miguelgomes129/velo` o despliega desde la raíz: `npx vercel deploy --prod` |

- Revisa `DATABASE_URL`, `BETTER_AUTH_URL` y Node 20+.
- Build local: `npm run build:vercel` desde la raíz del repo.
