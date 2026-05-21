/** Desplaza solo el contenedor del hilo de chat, sin mover el scroll del modal. */
export function scrollChatAlFinal(
  contenedor: HTMLElement | null,
  behavior: ScrollBehavior = "smooth",
) {
  if (!contenedor) return;
  contenedor.scrollTo({ top: contenedor.scrollHeight, behavior });
}

/** True si el usuario ya estaba viendo el final del hilo (± umbral px). */
export function chatCercaDelFinal(contenedor: HTMLElement, umbralPx = 96): boolean {
  const restante = contenedor.scrollHeight - contenedor.scrollTop - contenedor.clientHeight;
  return restante <= umbralPx;
}
