import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";

export type ListboxAnchor = {
  top: number;
  left: number;
  width: number;
};

export function useAnchoredListbox() {
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [anchor, setAnchor] = useState<ListboxAnchor | null>(null);

  useEffect(() => {
    if (!abierto || !rootRef.current) {
      setAnchor(null);
      return;
    }
    const sync = () => {
      const r = rootRef.current!.getBoundingClientRect();
      setAnchor({ top: r.bottom + 4, left: r.left, width: r.width });
    };
    sync();
    window.addEventListener("scroll", sync, true);
    window.addEventListener("resize", sync);
    return () => {
      window.removeEventListener("scroll", sync, true);
      window.removeEventListener("resize", sync);
    };
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setAbierto(false);
    };
    document.addEventListener("mousedown", cerrar);
    return () => document.removeEventListener("mousedown", cerrar);
  }, [abierto]);

  function toggle() {
    setAbierto((v) => !v);
  }

  function close() {
    setAbierto(false);
  }

  return { rootRef, panelRef, abierto, setAbierto, anchor, toggle, close };
}

type ListboxPanelProps = {
  abierto: boolean;
  anchor: ListboxAnchor | null;
  panelRef: RefObject<HTMLDivElement | null>;
  className: string;
  listClassName?: string;
  children: ReactNode;
  minWidth?: number;
  header?: ReactNode;
};

export function AnchoredListboxPanel({
  abierto,
  anchor,
  panelRef,
  className,
  listClassName = "",
  children,
  minWidth,
  header,
}: ListboxPanelProps) {
  if (!abierto || !anchor) return null;

  return createPortal(
    <div
      ref={panelRef}
      className={className}
      style={{
        position: "fixed",
        top: anchor.top,
        left: anchor.left,
        width: Math.max(anchor.width, minWidth ?? 0),
        zIndex: 10050,
      }}
    >
      {header}
      <ul role="listbox" className={listClassName}>
        {children}
      </ul>
    </div>,
    document.body,
  );
}
