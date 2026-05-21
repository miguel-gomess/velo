import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const RelojContext = createContext(Date.now());

export function RelojProvider({
  children,
  intervalMs = 10_000,
}: {
  children: ReactNode;
  intervalMs?: number;
}) {
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setAhora(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);

  return <RelojContext.Provider value={ahora}>{children}</RelojContext.Provider>;
}

export function useAhoraReloj(): number {
  return useContext(RelojContext);
}
