import { screensForRole, type NavLinkEntry } from '@/layouts/nav-config';

/** Módulo que se ofrece en los accesos de la página de inicio. */
export type InicioModule = NavLinkEntry;

/** Pantallas que el rol puede abrir, en el orden del menú (sale de `nav-config.ts`, la fuente única). */
export function getInicioModules(role: string): InicioModule[] {
  return screensForRole(role);
}
