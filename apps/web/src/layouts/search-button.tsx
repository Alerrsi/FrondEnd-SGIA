import { Search } from 'lucide-react';

import { Kbd } from '@/components/ui/kbd';

/** Abre el buscador `Ctrl K`. Con puntero táctil queda solo el icono (44px). */
export function SearchButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Buscar pantallas y acciones"
      aria-keyshortcuts="Control+K"
      className="flex h-8 shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 pl-3 pr-1.5 text-[13px] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900 dark:hover:border-zinc-700 dark:hover:text-zinc-100 cursor-pointer max-sm:w-8 max-sm:justify-center max-sm:p-0 pointer-coarse:h-11 pointer-coarse:min-w-11"
    >
      <Search aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
      <span className="hidden sm:inline">Buscar</span>
      <Kbd className="max-sm:pointer-fine:hidden">Ctrl K</Kbd>
    </button>
  );
}
