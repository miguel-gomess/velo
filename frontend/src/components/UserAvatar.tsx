import { colorUsuario, inicialesUsuario } from "../lib/userAvatar";

const TAMANOS = {
  xs: "size-5 text-[8px]",
  sm: "size-7 text-[10px]",
  md: "size-8 text-[11px]",
  lg: "size-9 text-sm",
  xl: "size-11 text-base",
} as const;

type Props = {
  nombre: string;
  userId?: number | null;
  size?: keyof typeof TAMANOS;
  className?: string;
  /** Avatar cuadrado (p. ej. directorio). */
  square?: boolean;
};

export function UserAvatar({
  nombre,
  userId,
  size = "md",
  className = "",
  square = false,
}: Props) {
  const fondo = colorUsuario(userId, nombre);
  const forma = square ? "rounded-2xl shadow-inner" : "rounded-full ring-2 ring-white";

  return (
    <div
      className={`${TAMANOS[size]} flex shrink-0 items-center justify-center font-bold uppercase text-white ${forma} ${className}`}
      style={{ backgroundColor: fondo }}
      aria-hidden
      title={nombre}
    >
      {inicialesUsuario(nombre)}
    </div>
  );
}
