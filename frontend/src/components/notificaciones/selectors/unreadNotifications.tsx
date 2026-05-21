/** Compatibilidad: reexporta el hook real de notificaciones. */
export {
  useNotificaciones,
  useNotificaciones as useUnreadNotifications,
} from "../../../hooks/useNotificaciones";

export type { NotificacionesResumen, NotificacionItem } from "../../../lib/api";
