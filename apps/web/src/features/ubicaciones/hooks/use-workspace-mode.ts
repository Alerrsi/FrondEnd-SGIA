import { useLayoutEffect, useState } from 'react';

import { workspaceMode, type WorkspaceMode } from '../lib/workspace-mode';

/** Distribución de Ubicaciones para el ancho medido, con margen para no alternar justo en un umbral. */
export function useWorkspaceMode(width: number): WorkspaceMode {
  const [mode, setMode] = useState<WorkspaceMode>(() => workspaceMode(width));
  // Antes de pintar, para que el cambio de distribución no se vea a medias.
  useLayoutEffect(() => {
    setMode((previous) => workspaceMode(width, previous));
  }, [width]);
  return mode;
}
