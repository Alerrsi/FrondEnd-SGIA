import { Suspense, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { Outlet } from 'react-router-dom';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { cn } from '@/lib/cn';

function PageFallback() {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-24 text-[13px] text-zinc-500 dark:text-zinc-400">
      <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
      Cargando pantalla…
    </div>
  );
}

/**
 * Marco del contenido (sistema «Trazo»): columna centrada de hasta 1280px con líneas verticales de 1px
 * desde 1024px, como el marco de zed.dev. Cada pantalla se carga aparte (`React.lazy`) dentro del marco.
 */
export function ContentFrame({ className, children }: { className?: string; children?: ReactNode }) {
  return (
    <div
      className={cn(
        'mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-4 py-5 sm:px-6 sm:py-6 lg:border-x lg:border-zinc-200 lg:px-8 lg:dark:border-zinc-800',
        className,
      )}
    >
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>{children ?? <Outlet />}</Suspense>
      </ErrorBoundary>
    </div>
  );
}
