import { useState } from 'react';
import { useCreateOracleCategory, useOracleCategories } from '@sgia/api-client';
import { Check, Loader2, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { cn } from '@/lib/cn';

const ADD_NEW = '__add__';

interface OracleCategorySelectProps {
  id: string;
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Descripción de categoría del maestro de Oracle (opcional): elige una del catálogo o agrega una
 * nueva, que queda seleccionada. El backend la normaliza a mayúsculas y rechaza duplicados (422).
 */
export function OracleCategorySelect({
  id,
  value,
  onChange,
  disabled,
  className,
}: OracleCategorySelectProps) {
  const { data: categories = [], isLoading } = useOracleCategories();
  const createCategory = useCreateOracleCategory();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const closeAdd = () => {
    setAdding(false);
    setDraft('');
    setError(null);
  };

  const submitNew = async () => {
    const name = draft.trim();
    if (!name) {
      setError('Escribe la descripción de la categoría.');
      return;
    }
    try {
      const created = await createCategory.mutateAsync({ name });
      onChange(created.id);
      closeAdd();
    } catch (err) {
      setError(apiFieldErrors(err).name ?? apiErrorToMessage(err));
    }
  };

  if (adding) {
    const pending = createCategory.isPending;
    return (
      <div className={className}>
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="text"
            autoFocus
            maxLength={100}
            value={draft}
            disabled={disabled || pending}
            placeholder="Ej. TI.EQUIPOS DE RED"
            aria-invalid={Boolean(error) || undefined}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              // Enter agrega la categoría sin enviar el formulario del producto.
              if (e.key === 'Enter') {
                e.preventDefault();
                void submitNew();
              }
            }}
            className={cn(FORM_CONTROL_CLASS, '')}
          />
          <Button
            size="icon"
            variant="primary"
            className="shrink-0"
            disabled={disabled || pending}
            onClick={() => void submitNew()}
            aria-label="Agregar categoría"
            title="Agregar categoría"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="shrink-0"
            disabled={pending}
            onClick={closeAdd}
            aria-label="Cancelar nueva categoría"
            title="Cancelar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        {error && (
          <span className="mt-1 block text-xs font-medium text-rose-600 dark:text-rose-400">{error}</span>
        )}
      </div>
    );
  }

  return (
    <select
      id={id}
      disabled={disabled || isLoading}
      value={value ?? ''}
      onChange={(e) => {
        const next = e.target.value;
        if (next === ADD_NEW) {
          setAdding(true);
          return;
        }
        onChange(next === '' ? null : Number(next));
      }}
      className={cn(FORM_CONTROL_CLASS, className)}
    >
      <option value="">{isLoading ? 'Cargando…' : 'Sin categoría'}</option>
      {categories.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
      <option value={ADD_NEW}>+ Agregar nueva…</option>
    </select>
  );
}
