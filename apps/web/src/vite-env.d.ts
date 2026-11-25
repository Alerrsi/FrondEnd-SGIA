/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Contraseña sembrada en desarrollo para los accesos rápidos del login. Solo se lee en `vite dev`. */
  readonly VITE_DEV_QUICK_LOGIN_PASSWORD?: string;
  /**
   * Contraseña de las cuentas de demostración en un build de presentación (docs/accesos-demo.md).
   * Queda en el JavaScript público: nunca en producción real.
   */
  readonly VITE_DEMO_LOGIN_PASSWORD?: string;
}
