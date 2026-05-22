import { useCallback, useEffect, useState } from "react";
import { apiGetNotificacionesResumen, type NotificacionesResumen } from "../lib/api";
import { useVisibilityPolling } from "./useVisibilityPolling";

const VACIO: NotificacionesResumen = {
  total: 0,
  por_incidencia: {},
  items: [],
};

export function useNotificaciones(pollMs = 15_000, activo = true) {
  const [data, setData] = useState<NotificacionesResumen>(VACIO);

  const refrescar = useCallback(async () => {
    if (!activo) {
      setData(VACIO);
      return;
    }
    try {
      const r = await apiGetNotificacionesResumen();
      setData({
        total: r.total,
        por_incidencia: r.por_incidencia ?? {},
        items: r.items ?? [],
      });
    } catch {
      /* silencioso: el siguiente tick reintentará */
    }
  }, [activo]);

  useEffect(() => {
    void refrescar();
  }, [refrescar]);

  useVisibilityPolling(refrescar, pollMs, { enabled: activo });

  return { ...data, refrescar };
}
