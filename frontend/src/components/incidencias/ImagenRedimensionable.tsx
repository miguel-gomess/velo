import { useRef, useState } from "react";

export const ANCHO_MIN = 80;
export const ANCHO_MAX = 1600;

type Props = {
  preview: string;
  width: number | null;
  disabled?: boolean;
  selected: boolean;
  label?: string;
  onSelect: () => void;
  onAbrirLightbox: () => void;
  onQuitar?: () => void;
  onCambiarAncho: (w: number | null) => void;
};

/**
 * Imagen al estilo "media single" de Jira: barra superior con etiqueta y acciones,
 * la imagen es seleccionable y, al estar seleccionada, muestra manijas para redimensionar.
 */
export function ImagenRedimensionable({
  preview,
  width,
  disabled,
  selected,
  label = "Captura",
  onSelect,
  onAbrirLightbox,
  onQuitar,
  onCambiarAncho,
}: Props) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [anchoVivo, setAnchoVivo] = useState<number | null>(null);
  const [arrastrando, setArrastrando] = useState(false);

  function iniciarResize(
    e: React.PointerEvent<HTMLSpanElement>,
    direccion: "right" | "left" | "corner",
  ) {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();
    const wrapper = wrapperRef.current;
    const img = imgRef.current;
    if (!wrapper || !img) return;

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    const rect = wrapper.getBoundingClientRect();
    const xInicio = e.clientX;
    const anchoInicio = rect.width;
    const maxDisponible = wrapper.parentElement
      ? wrapper.parentElement.clientWidth
      : ANCHO_MAX;
    setArrastrando(true);

    const onMove = (ev: PointerEvent) => {
      const delta = ev.clientX - xInicio;
      const factor = direccion === "left" ? -1 : 1;
      let nuevo = anchoInicio + delta * factor;
      nuevo = Math.max(ANCHO_MIN, Math.min(maxDisponible, ANCHO_MAX, nuevo));
      setAnchoVivo(nuevo);
    };

    const onUp = (ev: PointerEvent) => {
      const delta = ev.clientX - xInicio;
      const factor = direccion === "left" ? -1 : 1;
      let nuevo = anchoInicio + delta * factor;
      nuevo = Math.max(ANCHO_MIN, Math.min(maxDisponible, ANCHO_MAX, nuevo));
      setArrastrando(false);
      setAnchoVivo(null);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      onCambiarAncho(Math.round(nuevo));
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  }

  const widthPersistido = width && width > 0 ? width : null;
  const anchoMostrado = anchoVivo ?? widthPersistido;
  const figureStyle = anchoMostrado
    ? { width: `${anchoMostrado}px`, maxWidth: "100%" as const }
    : undefined;

  return (
    <figure
      ref={wrapperRef}
      className={`jira-description-media is-editable ${
        selected ? "is-selected" : ""
      } ${arrastrando ? "is-resizing" : ""}`}
      style={figureStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <div className="jira-description-media__bar">
        <span className="jira-description-media__label">
          {label}
          {anchoMostrado ? (
            <span className="jira-description-media__size"> · {Math.round(anchoMostrado)}px</span>
          ) : null}
        </span>
        <div className="jira-description-media__actions">
          {widthPersistido && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCambiarAncho(null);
              }}
              className="jira-description-media__reset"
              title="Restablecer tamaño original"
            >
              Original
            </button>
          )}
          {!disabled && onQuitar && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onQuitar();
              }}
              className="jira-description-media__remove"
            >
              Eliminar
            </button>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (selected) {
            onAbrirLightbox();
          } else {
            onSelect();
          }
        }}
        className="jira-description-media__img-btn"
      >
        <img ref={imgRef} src={preview} alt={label} />
      </button>
      {selected && !disabled && (
        <>
          <span
            className="jira-description-resize-handle is-left"
            onPointerDown={(e) => iniciarResize(e, "left")}
          />
          <span
            className="jira-description-resize-handle is-right"
            onPointerDown={(e) => iniciarResize(e, "right")}
          />
          <span
            className="jira-description-resize-handle is-corner"
            onPointerDown={(e) => iniciarResize(e, "corner")}
          />
        </>
      )}
    </figure>
  );
}
