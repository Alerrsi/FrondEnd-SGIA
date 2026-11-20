import { Maximize, Minus, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';

export interface ZoomControlsProps {
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
}

/** Acercar, alejar y ajustar la sala completa. También `Ctrl` + rueda sobre el plano. */
export function ZoomControls({ zoom, canZoomIn, canZoomOut, onZoomIn, onZoomOut, onFit }: ZoomControlsProps) {
  return (
    <div role="group" aria-label="Zoom del plano" className="flex items-center gap-1">
      <Button size="icon" variant="secondary" aria-label="Alejar" disabled={!canZoomOut} onClick={onZoomOut}>
        <Minus aria-hidden="true" className="h-4 w-4" />
      </Button>
      <span className="w-12 text-center font-mono text-[13px] text-zinc-600 dark:text-zinc-300" aria-live="polite">
        {Math.round(zoom * 100)} %
      </span>
      <Button size="icon" variant="secondary" aria-label="Acercar" disabled={!canZoomIn} onClick={onZoomIn}>
        <Plus aria-hidden="true" className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" disabled={!canZoomOut} onClick={onFit}>
        <Maximize aria-hidden="true" className="h-4 w-4" />
        Ajustar
      </Button>
    </div>
  );
}
