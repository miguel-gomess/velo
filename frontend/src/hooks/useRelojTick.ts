import { useEffect, useState } from "react";
import { intervaloRelojPara } from "../lib/fechas";

/**
 * Devuelve un timestamp que cambia periódicamente para recomputar textos relativos.
 * Con `isoReferencia`, el intervalo es más corto si el evento es reciente.
 */
export function useRelojTick(isoReferencia?: string | null, baseMs = 15_000): number {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const ms = isoReferencia ? intervaloRelojPara(isoReferencia) : baseMs;
    const id = window.setInterval(() => setAhora(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [isoReferencia, baseMs]);

  return ahora;
}
