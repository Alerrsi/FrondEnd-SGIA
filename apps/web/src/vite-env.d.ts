/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Contraseña sembrada en desarrollo para los accesos rápidos del login. Solo se lee en `vite dev`. */
  readonly VITE_DEV_QUICK_LOGIN_PASSWORD?: string;
}
