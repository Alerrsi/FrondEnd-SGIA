import { useEffect, useState } from 'react';
import { useStudentByRut } from '@sgia/api-client';
import { CheckCircle2, Loader2, UserPlus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { StudentBorrower } from '@/features/estudiantes/lib/student-borrower';
import { validateRun, normalizeStoredRun } from '@/features/usuarios/lib/run';
import { apiErrorToMessage } from '@/lib/api-error';
import { FIELD_LABEL_CLASS } from '@/components/ui/typography';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';

const inputClasses =
  FORM_CONTROL_CLASS;

/**
 * Escanear o digitar el RUT (+ Enter): 200 → muestra el estudiante; 404 → pide el nombre (opcional)
 * y el checkout envía `student_rut` para que el backend lo cree.
 */
export function StudentLookup({
  onChange,
}: {
  onChange: (borrower: StudentBorrower | null) => void;
}) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState<string>();
  const [name, setName] = useState('');
  const [invalid, setInvalid] = useState(false);

  const { data: student, isFetching, isError, error } = useStudentByRut(submitted);

  const search = () => {
    const value = input.trim();
    if (!value) return;
    if (!validateRun(value)) {
      setInvalid(true);
      setSubmitted(undefined);
      return;
    }
    setInvalid(false);
    setSubmitted(normalizeStoredRun(value));
  };

  const notFound = submitted !== undefined && !isFetching && !isError && student === null;

  useEffect(() => {
    if (submitted === undefined || isFetching || isError || student === undefined) {
      onChange(null);
    } else if (student) {
      onChange({ kind: 'existing', student });
    } else {
      onChange({ kind: 'new', rut: submitted, name });
    }
  }, [submitted, isFetching, isError, student, name, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div>
        <label htmlFor="student_rut" className={FIELD_LABEL_CLASS}>
          RUT del estudiante <span className="text-red-500">*</span>
        </label>
        <input
          id="student_rut"
          type="text"
          value={input}
          autoComplete="off"
          placeholder="12.345.678-5 + Enter"
          onChange={(e) => {
            setInput(e.target.value);
            setSubmitted(undefined);
            setInvalid(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          onBlur={search}
          aria-invalid={invalid || undefined}
          className={`${inputClasses} mt-1`}
        />
        {invalid && (
          <p role="alert" className="mt-1 text-[11px] text-rose-600 dark:text-rose-400">
            RUT inválido: revisa el dígito verificador.
          </p>
        )}
      </div>

      {isFetching && (
        <p className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500">
          <Loader2 className="h-3 w-3 animate-spin" /> Buscando estudiante…
        </p>
      )}
      {isError && (
        <p role="alert" className="text-[11px] text-rose-600 dark:text-rose-400">
          {apiErrorToMessage(error)}
        </p>
      )}
      {student && (
        <div className="flex items-center gap-2 rounded-md border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/60 dark:bg-emerald-950/20 p-2 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <div className="min-w-0">
            <p className="truncate font-semibold">{student.full_name || 'Sin nombre'}</p>
            <p className="truncate font-mono text-[11px] text-zinc-500">
              {student.career?.name ?? 'Sin carrera'}
            </p>
          </div>
        </div>
      )}
      {notFound && (
        <div className="flex flex-col gap-1.5 rounded-md border border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 p-2">
          <Badge tone="warning" icon={<UserPlus className="h-3 w-3" />}>
            No registrado: se creará al confirmar
          </Badge>
          <label htmlFor="student_name" className={FIELD_LABEL_CLASS}>
            Nombre (opcional)
          </label>
          <input
            id="student_name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClasses}
          />
        </div>
      )}
    </div>
  );
}
