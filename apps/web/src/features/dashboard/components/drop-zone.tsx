import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import type { DragItemPayload } from '../types/metrics';

interface DropZoneProps {
  index: number;
  disabled?: boolean;
  onDropPayload: (targetIndex: number, payload: DragItemPayload) => void;
}

export function DropZone({ index, disabled = false, onDropPayload }: DropZoneProps) {
  const [isOver, setIsOver] = useState(false);

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
    setIsOver(false);

    if (disabled) return;

    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const parsed = JSON.parse(dataStr) as DragItemPayload;
      onDropPayload(index, parsed);
    } catch {
      // Ignorar payloads malformados
    }
  };

  return (
    <div
      data-testid={`drop-zone-${index}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative flex items-center justify-center rounded-lg border-2 border-dashed transition-all duration-150 py-3 px-4 font-mono text-xs ${
        disabled
          ? 'border-zinc-200 dark:border-zinc-800/80 bg-zinc-100/50 dark:bg-zinc-900/20 text-zinc-400 cursor-not-allowed opacity-60'
          : isOver
            ? 'border-red-500 bg-red-50/50 dark:bg-red-950/40 text-red-600 dark:text-red-400 scale-[1.01] shadow-xs'
            : 'border-zinc-300 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30 text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-700'
      }`}
    >
      <div className="flex items-center gap-2 pointer-events-none select-none">
        <PlusCircle className={`h-4 w-4 ${isOver ? 'text-red-500 animate-pulse' : 'text-zinc-400'}`} />
        <span>
          {disabled
            ? 'Cupo máximo alcanzado (5/5)'
            : isOver
              ? `Soltar aquí para ubicar en posición #${index + 1}`
              : `Zona de soltado (Posición #${index + 1})`}
        </span>
      </div>
    </div>
  );
}
