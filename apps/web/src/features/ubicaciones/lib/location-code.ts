/*
 * Códigos de sala y de cajón (plan `BackEnd-SGIA/docs/codigos-ubicacion.md`).
 * Funciones puras: el backend aplica la misma regla y es la fuente de verdad.
 */

/** Largo máximo del código de sala. */
export const LOCATION_CODE_MAX = 10;
/** Largo máximo del código de cajón normalizado (el Code128 debe caber en la etiqueta de 50 mm). */
export const CAJON_CODE_MAX = 12;

const STOP_WORDS = new Set(['DE', 'DEL', 'LA', 'EL', 'LOS', 'LAS', 'Y']);
/** Número de sala: 1 o 2 letras, guion o espacio opcional y 2 a 4 dígitos (`L-206`, `E 301`, `T102`). */
const ROOM_NUMBER = /(?:^|[^A-Z0-9])([A-Z]{1,2})[- ]?(\d{2,4})(?![A-Z0-9])/;

/** Quita tildes (también la de la ñ) y pasa a mayúsculas. */
function toPlainUpper(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
}

/** Deja solo A-Z0-9 y corta al largo máximo del código de sala (lo que acepta el campo). */
export function sanitizeLocationCode(value: string): string {
  return toPlainUpper(value).replace(/[^A-Z0-9]/g, '').slice(0, LOCATION_CODE_MAX);
}

/** Código de sala sugerido a partir del nombre: `Pañol Central` → `PCENTRAL`, `Lab. L-206` → `L206`. */
export function suggestLocationCode(nombre: string): string {
  const plain = toPlainUpper(nombre);

  const room = ROOM_NUMBER.exec(plain);
  if (room) return `${room[1]}${room[2]}`;

  const words = plain
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Z0-9]/g, ''))
    .filter((word) => word.length > 0);
  const meaningful = words.filter((word) => !STOP_WORDS.has(word));
  const parts = meaningful.length > 0 ? meaningful : words;

  const [first, ...rest] = parts;
  if (first === undefined) return '';
  if (rest.length === 0) return first.slice(0, 8);
  return `${first.charAt(0)}${rest.join('')}`.slice(0, LOCATION_CODE_MAX);
}

/** Normaliza el código del cajón: `Mesa 1 Cajón` → `MESA-1-CAJON`. */
export function normalizeCajonCode(codigo: string): string {
  return toPlainUpper(codigo)
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Código completo del cajón para escaneo y etiqueta: `L206` + `Rack R1` → `L206-RACK-R1`. */
export function cajonFullCode(locationCode: string, codigo: string): string {
  const cajon = normalizeCajonCode(codigo);
  const sala = locationCode.trim().toUpperCase();
  if (!sala) return cajon;
  if (!cajon) return sala;
  return `${sala}-${cajon}`;
}
