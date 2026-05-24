# Memoria técnica — Velo (TFG DAM Dual)

## 1. Objetivo

Sistema web de gestión de incidencias internas que conecta el **portal del empleado** (alta y seguimiento de solicitudes) con el **workspace Kanban** del equipo de soporte y un **panel de análisis** para administración.

## 2. Arquitectura

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Frontend | Vite + React 19 | UI portal, tablero, dashboard |
| Backend | Next.js 15 (App Router) | API REST, auth, ficheros |
| BD | PostgreSQL | Persistencia relacional |
| Auth | Better Auth | Sesiones email/password |

El frontend consume la API en `localhost:3000` con cookies de sesión (`credentials: include`).

## 3. Modelo de datos (extensiones TFG)

- **incidencia_eventos**: historial auditable (creación, cambios de estado, comentarios, adjuntos).
- **incidencia_lecturas**: último mensaje leído por usuario → badges de mensajes sin leer.
- **incidencias.motivo_cierre**: obligatorio al cerrar (`resuelta`, `rechazada`, `duplicada`) con texto de resolución (mín. 10 caracteres).
- **incidencia_adjuntos.tipo**: `evidencia` (panel adjuntos) vs imágenes inline en `/medios` (descripción/chat).

Migración: `npm run db:tfg` o incluida en `npm run db:incidencias`.

## 4. Funcionalidades destacadas

### Descripción y chat estilo Jira

- Editor por bloques (texto + imágenes redimensionables).
- Markdown con ancho embebido: `![alt|width=N](url)`.
- Pegado de capturas sin duplicar; varias imágenes por mensaje de chat.
- Imágenes del chat **no** aparecen en “Archivos adjuntos” (endpoint dedicado).

### Cierre formal

Modal al mover a columna cerrada o al cambiar estado a `cerrada`: motivo + resolución.

### Notificaciones

`GET /api/notificaciones/resumen` — contador global y por incidencia; polling 30s en Kanban y portal.

### Comentarios internos

Los agentes (admin, equipo Kanban o asignado) pueden marcar un mensaje como **interno** (`es_interno` en `incidencia_mensajes`). El solicitante en el portal **no los ve** ni recibe notificación por ellos. En el historial de eventos aparecen prefijados `[Interno]`.

### Análisis

KPIs: total, tiempo medio de cierre (horas), carga por agente, filtros por rango de fechas.

## 5. Seguridad y permisos

- Rutas protegidas por sesión Better Auth + tabla `usuarios` (roles, departamento, equipos).
- Acceso a incidencias filtrado por solicitante, asignado, equipo o admin.
- Eliminación de incidencia en transacción (mensajes, adjuntos, eventos, archivos en disco).

## 6. Despliegue local

```powershell
docker compose up -d
cd backend
copy .env.example .env
# DATABASE_URL=postgresql://velo:velo@localhost:5432/velo
npm install
npm run db:setup
npm run seed:demo
npm run dev:clean
```

Frontend en otra terminal: `cd frontend && npm run dev`.

## 7. Pruebas y CI

- Tests unitarios de utilidades de imágenes: `cd backend && npm test`
- GitHub Actions: TypeScript del frontend + tests del backend.

## 8. Mejoras implementadas (paquete ampliado)

- Seguridad API: `scope=all` y CRUD `/api/users` solo admin; CORS vía `ALLOWED_ORIGINS`.
- Validación Zod en alta de incidencias y usuarios.
- SLA: columna `fecha_limite`, KPI `% en plazo` en análisis.
- Filtros en tablero admin (búsqueda, estado, prioridad, épica, fuera de SLA).
- Portal: pestañas Actividad/Histórico, copiar enlace, orden por última actualización.
- Accesibilidad: `lang="es"`, menú «Mover a…» en tarjetas Kanban.
- Healthcheck `GET /api/health`, panel Configuración de equipos, export CSV en análisis.

## 9. Paquete TFG — roadmap, épicas y planificación

### Épicas

- Tabla `epicas` (clave, nombre, color, activa) y `incidencias.epica_id`.
- Catálogo inicial: INFRA, PORTAL, SEGURIDAD, PROCESOS, SOPORTE.
- API: `GET /api/epicas`, `POST` y `PATCH /api/epicas/:id` (admin).
- CRUD en **Dashboard → Configuración → Épicas de roadmap**.

### Vistas de planificación (tablero de incidencias)

| Vista | Función |
|-------|---------|
| **Roadmap** | Tarjetas por épica: % cerradas, SLA, próximo límite, filtro y salto a cronograma/calendario |
| **Cronograma** | Gantt por épica (creación → límite); arrastre del borde derecho para cambiar `fecha_limite` |
| **Calendario** | Incidencias por día de `fecha_limite` con colores SLA |

### Análisis

- `GET /api/incidencias/stats` incluye `porEpica` (total, en/fuera de plazo, % SLA).
- Gráfico apilado **SLA por épica** y desglose en tarjetas.

### Flujo portal → equipo → cierre (para memoria y capturas)

1. **Portal del empleado** (`/portal`): el solicitante crea la incidencia (título, descripción, prioridad, equipo). Recibe plazo SLA automático y puede seguir el hilo y adjuntos.
2. **Workspace / tablero** (`/workspace` o `/dashboard/incidencias`): el agente ve la tarjeta en Kanban, asigna épica, agente y fecha límite; mueve columnas; comentarios internos opcionales.
3. **Planificación**: roadmap y cronograma muestran el trabajo agrupado por épica y plazos; el arrastre en el Gantt actualiza el límite con evento de historial tipo `plazo`.
4. **Cierre**: al pasar a cerrada, modal con motivo (`resuelta` / `rechazada` / `duplicada`) y texto de resolución; queda en historial auditable.
5. **Análisis** (`/dashboard/analisis`): administración revisa KPIs globales y por épica para la memoria del TFG.

Sugerencia de capturas: portal (alta + detalle), tablero con filtros por épica, roadmap, cronograma con arrastre de plazo, panel SLA por épica, modal de cierre.

## 10. Trabajo futuro (fuera de alcance mínimo)

- WebSockets para notificaciones en tiempo real.
- Export PDF de incidencia cerrada.
- Integración LDAP/SSO empresarial.
