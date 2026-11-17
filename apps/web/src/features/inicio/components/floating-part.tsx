import { useId } from 'react';

import { cn } from '@/lib/cn';

type PartKind = 'led' | 'chip' | 'nut';

/** Pieza suelta que "flota" alrededor de la bandeja (decorativa). */
export function FloatingPart({ kind, className }: { kind: PartKind; className?: string }) {
  const gradientId = `ini-part-${useId().replace(/:/g, '')}`;
  return (
    <svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className={cn('pointer-events-none absolute drop-shadow-[0_10px_12px_rgba(0,0,0,0.3)]', className)}
    >
      {kind === 'led' && (
        <>
          <defs>
            <radialGradient id={gradientId} cx="38%" cy="32%" r="70%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
          </defs>
          <circle cx="50" cy="50" r="40" fill="#fbbf24" opacity="0.25" />
          <circle cx="50" cy="50" r="30" fill={`url(#${gradientId})`} />
          <ellipse cx="40" cy="38" rx="9" ry="6" fill="#fff" opacity="0.7" />
        </>
      )}
      {kind === 'chip' && (
        <g transform="rotate(-18 50 50)">
          <g fill="#d4d4d8">
            {[22, 34, 46, 58, 70].map((y) => (
              <g key={y}>
                <rect x="10" y={y} width="12" height="5" rx="1" />
                <rect x="78" y={y} width="12" height="5" rx="1" />
              </g>
            ))}
          </g>
          <rect x="20" y="16" width="60" height="68" rx="6" fill="#18181b" />
          <circle cx="31" cy="27" r="3.5" fill="#3f3f46" />
          <rect x="30" y="52" width="40" height="4" rx="2" fill="#3f3f46" />
          <rect x="30" y="62" width="26" height="4" rx="2" fill="#3f3f46" />
        </g>
      )}
      {kind === 'nut' && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f4f4f5" />
              <stop offset="60%" stopColor="#a1a1aa" />
              <stop offset="100%" stopColor="#71717a" />
            </linearGradient>
          </defs>
          <polygon points="50,8 86,29 86,71 50,92 14,71 14,29" fill={`url(#${gradientId})`} />
          <circle cx="50" cy="50" r="18" fill="#52525b" />
          <circle cx="50" cy="50" r="13" fill="#27272a" />
        </>
      )}
    </svg>
  );
}
