import { formatFechaHora, formatFechaRelativa } from "../lib/fechas";
import { useAhoraReloj } from "./RelojProvider";

type Props = {
  iso: string;
  className?: string;
  /** Si true, muestra hora absoluta en lugar de relativa (fechas > 7 días ya son absolutas). */
  soloAbsoluto?: boolean;
};

export function TiempoRelativo({ iso, className = "", soloAbsoluto = false }: Props) {
  const ahora = useAhoraReloj();
  const absoluto = formatFechaHora(iso);
  const texto = soloAbsoluto ? absoluto : formatFechaRelativa(iso, ahora);

  return (
    <time dateTime={iso} className={className} title={soloAbsoluto ? undefined : absoluto}>
      {texto}
    </time>
  );
}
