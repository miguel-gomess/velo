import { useEffect, useRef } from "react";

type Options = {
  /** Si false, no se agenda el siguiente tick (útil para condicionar). */
  enabled?: boolean;
  /** Ejecuta también una vez justo al volver visible la pestaña. */
  refetchOnVisible?: boolean;
};

/**
 * Llama a `tick` cada `intervalMs` mientras la pestaña esté visible.
 * Pausa cuando `document.visibilityState === "hidden"` para no quemar
 * batería ni cuotas de API innecesariamente.
 */
export function useVisibilityPolling(
  tick: () => void | Promise<void>,
  intervalMs: number,
  options: Options = {},
): void {
  const { enabled = true, refetchOnVisible = true } = options;
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const isHidden = () =>
      typeof document !== "undefined" && document.visibilityState === "hidden";

    const start = () => {
      if (timer || isHidden()) return;
      timer = setInterval(() => {
        if (isHidden()) return;
        try {
          void tickRef.current();
        } catch {
          /* swallow */
        }
      }, intervalMs);
    };

    const stop = () => {
      if (!timer) return;
      clearInterval(timer);
      timer = null;
    };

    const onVisibility = () => {
      if (isHidden()) {
        stop();
        return;
      }
      if (refetchOnVisible) {
        try {
          void tickRef.current();
        } catch {
          /* swallow */
        }
      }
      start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, refetchOnVisible]);
}
