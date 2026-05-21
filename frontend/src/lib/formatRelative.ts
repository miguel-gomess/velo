export function formatHace(segundos: number): string {
  if (segundos < 5) return "ahora";
  if (segundos < 60) return `hace ${segundos} s`;
  const min = Math.floor(segundos / 60);
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  return `hace ${h} h`;
}
