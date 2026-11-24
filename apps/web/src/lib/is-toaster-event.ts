/**
 * `true` si la interacción viene de un aviso emergente (docs/avisos-emergentes.md). `Dialog` y `Sheet` la ignoran:
 * quitar un aviso con clic no debe cerrar el modal o la hoja que están abiertos.
 *
 * Radix difiere el «clic fuera» hasta el evento `click`; para entonces React ya quitó el aviso del DOM y
 * `closest('[data-toaster]')` no encuentra el contenedor. Por eso también se reconoce el propio aviso
 * (`[data-toast]`), que sigue siendo ancestro del nodo aunque esté desprendido.
 */
export function isToasterEvent(event: { target: EventTarget | null }): boolean {
  return event.target instanceof Element && event.target.closest('[data-toaster], [data-toast]') !== null;
}
