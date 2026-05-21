# Subir Velo a GitHub

## Ya preparado en tu PC

El proyecto ya tiene Git inicializado. Solo falta crear el repo en GitHub y hacer `push`.

## Paso 1 — Crear el repositorio en GitHub

1. Entra en [github.com/new](https://github.com/new).
2. **Repository name:** `velo` (o el nombre que quieras).
3. **Description:** opcional, p. ej. «Gestión de incidencias internas — TFG».
4. Elige **Private** (recomendado: hay configuración de despliegue).
5. **No** marques «Add a README», «Add .gitignore» ni «Choose a license» (ya existen en el proyecto).
6. Pulsa **Create repository**.

## Paso 2 — Conectar y subir el código

En PowerShell, sustituye `TU_USUARIO` por tu usuario de GitHub:

```powershell
cd c:\Users\migue\Downloads\velo

git remote add origin https://github.com/TU_USUARIO/velo.git
git branch -M main
git push -u origin main
```

Te pedirá iniciar sesión en GitHub (navegador o token).

### Si el repo tiene otro nombre

```powershell
git remote add origin https://github.com/TU_USUARIO/NOMBRE-DEL-REPO.git
```

## Paso 3 — Comprobar

En GitHub deberías ver carpetas `backend/`, `frontend/`, `docs/`, `vercel.json`, etc.

**No** debe aparecer:

- `backend/.env` (contraseñas)
- `node_modules/`
- `backend/uploads/`

## Paso 4 — Conectar Vercel

1. [vercel.com](https://vercel.com) → **Add Project** → **Import** tu repo `velo`.
2. Root Directory: **.** (raíz).
3. Variables de entorno → ver [DEPLOY.md](./DEPLOY.md).
4. Deploy.

## Comandos útiles después

```powershell
git status
git add .
git commit -m "Descripción del cambio"
git push
```

## Alternativa: GitHub CLI

Si instalas [GitHub CLI](https://cli.github.com/):

```powershell
winget install GitHub.cli
gh auth login
cd c:\Users\migue\Downloads\velo
gh repo create velo --private --source=. --remote=origin --push
```

## Problemas frecuentes

| Error | Solución |
|--------|----------|
| `remote origin already exists` | `git remote remove origin` y vuelve a añadir |
| `failed to push` / permisos | Comprueba que el repo existe y que tienes acceso |
| Archivos enormes | No subas `node_modules`; revisa `.gitignore` |
