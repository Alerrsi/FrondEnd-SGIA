import { useState } from 'react';
import { PlusCircle, Target } from 'lucide-react';
import type { ChartType, DragItemPayload } from '../types/metrics';

interface DropZoneProps {
  index: number;
  disabled?: boolean;
  isFocused?: boolean;
  draggedWidgetType?: ChartType | null;
  onDropPayload: (targetIndex: number, payload: DragItemPayload) => void;
}

export function DropZone({
  index,
  disabled = false,
  isFocused = false,
  draggedWidgetType = null,
  onDropPayload,
}: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isOver) setIsOver(true);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!isOver) setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only toggle if relatedTarget is outside the current target
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOver(false);

    if (disabled) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('application/json');
      if (dataStr) {
        const parsed = JSON.parse(dataStr) as DragItemPayload;
        onDropPayload(index, parsed);
        return;
      }
    } catch {
      // Ignorar payloads malformados y proceder al fallback
    }

    if (draggedWidgetType) {
      onDropPayload(index, { type: 'NEW_WIDGET', chartType: draggedWidgetType });
    }
  };

  return (
    <div
      data-testid={`drop-zone-${index}`}
      data-focused={isFocused ? 'true' : 'false'}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex items-center justify-center rounded-lg border border-dashed transition duration-150 py-3 px-4 font-mono text-xs ${
        disabled
          ? 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/20 text-zinc-400 cursor-not-allowed opacity-60'
          : isOver
            ? 'border-accent ring-2 ring-accent/30 bg-accent-soft dark:bg-accent-soft text-accent dark:text-accent'
            : isFocused
              ? 'border-accent ring-2 ring-accent/30 bg-accent-soft dark:bg-accent-soft text-accent dark:text-accent'
              : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-2 pointer-events-none select-none">
        {isFocused ? (
          <Target aria-hidden="true" className="h-4 w-4 text-accent animate-spin-slow" />
        ) : (
          <PlusCircle aria-hidden="true" className={`h-4 w-4 ${isOver ? 'text-accent' : 'text-zinc-400'}`} />
        )}

        <span>
          {disabled
            ? 'Cupo máximo alcanzado'
            : isOver
              ? `Soltar aquí para ubicar en posición #${index + 1}`
              : isFocused
                ? `🎯 Zona de inserción enfocada${draggedWidgetType ? ` (${draggedWidgetType})` : ''} — Posición #${index + 1}`
                : `Zona de soltado (Posición #${index + 1})`}
        </span>
      </div>
    </div>
  );
}
