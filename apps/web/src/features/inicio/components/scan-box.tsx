import { useState, type FormEvent } from 'react';
import { ScanBarcode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { cn } from '@/lib/cn';

/**
 * Escaneo desde Inicio: la pistola Code128 escribe el código y envía con Enter; lleva al inventario
 * filtrado por ese código. También sirve para escribir un SKU a mano.
 */
export function ScanBox() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!value) return;
    navigate(`/inventario?q=${encodeURIComponent(value)}`);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <label htmlFor="inicio-scan" className="flex items-center gap-2 text-[13px] font-medium text-zinc-700 dark:text-zinc-300">
        <ScanBarcode aria-hidden="true" className="h-4 w-4 text-zinc-500" />
        Buscar un producto por código
      </label>
      <div className="flex gap-2">
        <input
          id="inicio-scan"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Escanea o escribe el SKU"
          autoComplete="off"
          className={cn(FORM_CONTROL_CLASS, 'font-code')}
        />
        <Button type="submit" variant="secondary" disabled={!code.trim()}>
          Buscar
        </Button>
      </div>
    </form>
  );
}
