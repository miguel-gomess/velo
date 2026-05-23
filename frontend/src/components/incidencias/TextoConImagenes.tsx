import { apiAssetUrl } from "../../lib/api";
import { AuthImage } from "../AuthImage";
import { parseAltConWidth } from "../../lib/imagenes";

const IMG_MD = /!\[([^\]]*)\]\(([^)]+)\)/g;

type Props = {
  texto: string;
  className?: string;
  variant?: "default" | "jira";
  onImagenClick?: (url: string) => void;
  puedeQuitarImagen?: (url: string) => boolean;
  onQuitarImagen?: (url: string) => void;
};

function resolverSrc(raw: string): string {
  if (raw.startsWith("blob:")) return raw;
  return apiAssetUrl(raw);
}

function ImagenBloque({
  src,
  alt,
  width,
  variant,
  quitar,
  onImagenClick,
  onQuitar,
}: {
  src: string;
  alt: string;
  width: number | null;
  variant: "default" | "jira";
  quitar: boolean;
  onImagenClick?: (url: string) => void;
  onQuitar?: () => void;
}) {
  if (variant === "jira") {
    const figureStyle = width ? { width: `${width}px`, maxWidth: "100%" } : undefined;
    return (
      <figure className="jira-description-media" style={figureStyle}>
        <div className="jira-description-media__bar">
          <span className="jira-description-media__label">{alt || "Imagen"}</span>
          {quitar && onQuitar ? (
            <button type="button" onClick={onQuitar} className="jira-description-media__remove">
              Eliminar
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onImagenClick?.(src)}
          className="jira-description-media__img-btn"
        >
          <AuthImage src={src} alt={alt} />
        </button>
      </figure>
    );
  }

  const imgStyle = width ? { width: `${width}px`, maxWidth: "100%" } : undefined;
  return (
    <span className="relative my-2 inline-block max-w-full">
      <button
        type="button"
        onClick={() => onImagenClick?.(src)}
        className="block max-w-full overflow-hidden rounded-lg border border-[var(--velo-border)] bg-white text-left shadow-sm transition hover:ring-2 hover:ring-[var(--velo-brand-muted)]"
        style={imgStyle}
      >
        <AuthImage
          src={src}
          alt={alt}
          className={
            width ? "block w-full object-contain" : "max-h-64 w-auto max-w-full object-contain"
          }
        />
      </button>
      {quitar && onQuitar ? (
        <button
          type="button"
          onClick={onQuitar}
          className="absolute right-1 top-1 rounded-md bg-[#091e42]/75 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-[#091e42]"
        >
          Quitar
        </button>
      ) : null}
    </span>
  );
}

export function TextoConImagenes({
  texto,
  className = "",
  variant = "default",
  onImagenClick,
  puedeQuitarImagen,
  onQuitarImagen,
}: Props) {
  const partes: React.ReactNode[] = [];
  let last = 0;
  let key = 0;
  const proseClass =
    variant === "jira" ? `jira-description-prose ${className}`.trim() : className;

  for (const m of texto.matchAll(IMG_MD)) {
    const idx = m.index ?? 0;
    if (idx > last) {
      const trozo = texto.slice(last, idx);
      if (trozo) {
        partes.push(
          <span key={key++} className="whitespace-pre-wrap">
            {trozo}
          </span>,
        );
      }
    }
    const src = resolverSrc(m[2]);
    const { alt: altLimpio, width } = parseAltConWidth(m[1] || "");
    const alt = altLimpio || "captura";
    const quitar = !!(puedeQuitarImagen?.(src) && onQuitarImagen);
    partes.push(
      <ImagenBloque
        key={key++}
        src={src}
        alt={alt}
        width={width}
        variant={variant}
        quitar={quitar}
        onImagenClick={onImagenClick}
        onQuitar={quitar ? () => onQuitarImagen!(src) : undefined}
      />,
    );
    last = idx + m[0].length;
  }

  if (last < texto.length) {
    partes.push(
      <span key={key++} className="whitespace-pre-wrap">
        {texto.slice(last)}
      </span>,
    );
  }

  if (partes.length === 0) {
    if (variant === "jira" && !texto.trim()) {
      return null;
    }
    return <span className={`whitespace-pre-wrap ${proseClass}`}>{texto || "—"}</span>;
  }

  return <div className={proseClass}>{partes}</div>;
}

/** Vista de solo lectura al estilo panel de descripción de Jira. */
export function DescripcionVistaJira({
  texto,
  className = "",
  onImagenClick,
  vacioLabel = "Sin descripción",
}: {
  texto: string;
  className?: string;
  onImagenClick?: (url: string) => void;
  vacioLabel?: string;
}) {
  const tieneImagen = /!\[([^\]]*)\]\(([^)]+)\)/.test(texto);
  const vacio = !texto.trim() && !tieneImagen;

  return (
    <div className={`jira-description-view ${className}`.trim()}>
      {vacio ? (
        <p className="jira-description-empty">{vacioLabel}</p>
      ) : (
        <TextoConImagenes texto={texto} variant="jira" onImagenClick={onImagenClick} />
      )}
    </div>
  );
}
