import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateSupplier, useUpdateSupplier } from '@sgia/api-client';
import type { Supplier } from '@sgia/types';
import { Building2, Loader2, Tag } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogCloseButton } from '@/components/ui/dialog';
import { SupplierAreasField } from '@/features/proveedores/components/supplier-areas-field';
import {
  supplierFormDefaults,
  supplierFormSchema,
  toSupplierPayload,
  type SupplierFormValues,
} from '@/features/proveedores/lib/supplier-form-schema';
import { apiErrorToMessage, apiFieldErrors } from '@/lib/api-error';
import { toast } from '@/lib/toast';

const inputClasses =
  'w-full h-8.5 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors focus:border-zinc-400 dark:focus:border-zinc-600 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 disabled:opacity-50';

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="mt-1 block text-xs text-red-600 dark:text-red-400 font-medium">{message}</span>;
}

function Label({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
    >
      {children}
    </label>
  );
}

export function SupplierFormDialog({
  open,
  onClose,
  supplier,
}: {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
}) {
  const esEdicion = supplier !== null;
  const createSupplier = useCreateSupplier();
  const updateSupplier = useUpdateSupplier();

  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: supplierFormDefaults(null),
  });

  useEffect(() => {
    if (open) reset(supplierFormDefaults(supplier));
  }, [open, supplier, reset]);

  const isPending = createSupplier.isPending || updateSupplier.isPending;

  const onSubmit = handleSubmit(
    async (values) => {
      const payload = toSupplierPayload(values);
      try {
        if (esEdicion && supplier) {
          await updateSupplier.mutateAsync({ id: supplier.id, payload });
          toast.success('Proveedor actualizado correctamente');
        } else {
          await createSupplier.mutateAsync(payload);
          toast.success('Proveedor registrado correctamente');
        }
        onClose();
      } catch (error) {
        const fieldErrors = apiFieldErrors(error);
        const areasError = Object.entries(fieldErrors).find(([f]) => /^areas(\.\d+)?$/.test(f));
        if (areasError) setError('areas', { message: areasError[1] });
        if (fieldErrors.email) setError('email', { message: fieldErrors.email });
        if (fieldErrors.name) setError('name', { message: fieldErrors.name });
        toast.error(apiErrorToMessage(error));
      }
    },
    (formErrors) => {
      const firstError = Object.values(formErrors)[0];
      if (firstError?.message) {
        toast.error(String(firstError.message));
      }
    },
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      hasUnsavedChanges={isDirty}
      title={esEdicion ? 'Editar proveedor' : 'Nuevo proveedor'}
      description={
        esEdicion
          ? 'Actualiza los datos de la empresa proveedora.'
          : 'Registra una nueva empresa proveedora para cotizaciones y adquisiciones.'
      }
      className="max-w-lg"
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4 text-zinc-900 dark:text-zinc-100" noValidate>
        {/* Fieldset: Datos de la Empresa */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Building2 className="h-3.5 w-3.5 text-zinc-400" />
            Datos de la Empresa
          </legend>

          <div>
            <Label htmlFor="supplier-name">Razón social / Nombre</Label>
            <input
              id="supplier-name"
              type="text"
              autoComplete="organization"
              disabled={isPending}
              placeholder="Distribuidora TechPro Ltda."
              className={inputClasses}
              {...register('name')}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="supplier-contact">Nombre de contacto (opcional)</Label>
            <input
              id="supplier-contact"
              type="text"
              autoComplete="name"
              disabled={isPending}
              placeholder="Juan Pérez"
              className={inputClasses}
              {...register('contact_name')}
            />
            <FieldError message={errors.contact_name?.message} />
          </div>

          <div>
            <Label htmlFor="supplier-email">Correo electrónico</Label>
            <input
              id="supplier-email"
              type="email"
              autoComplete="email"
              disabled={isPending}
              placeholder="ventas@techpro.cl"
              className={inputClasses}
              {...register('email')}
            />
            <FieldError message={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="supplier-phone">Teléfono (opcional)</Label>
            <input
              id="supplier-phone"
              type="tel"
              autoComplete="tel"
              disabled={isPending}
              placeholder="+56 9 1234 5678"
              className={inputClasses}
              {...register('phone')}
            />
            <FieldError message={errors.phone?.message} />
          </div>
        </fieldset>

        {/* Fieldset: Clasificación */}
        <fieldset className="rounded-md border border-zinc-200 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-900/50">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1.5 font-mono">
            <Tag className="h-3.5 w-3.5 text-zinc-400" />
            Áreas
          </legend>

          <div>
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              Áreas (al menos 1)
            </span>
            <Controller
              control={control}
              name="areas"
              render={({ field }) => (
                <SupplierAreasField
                  label="Áreas del proveedor"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isPending}
                  invalid={Boolean(errors.areas)}
                />
              )}
            />
            <FieldError message={errors.areas?.message} />
            <p className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              Al enviar una solicitud de compra se contacta a todos los proveedores activos de las
              áreas elegidas.
            </p>
          </div>
        </fieldset>

        <div className="mt-1 flex justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
          <DialogCloseButton disabled={isPending} className="text-xs">
            Cancelar
          </DialogCloseButton>
          <Button type="submit" variant="primary" disabled={isPending} className="min-w-28 text-xs">
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {esEdicion ? 'Guardar cambios' : 'Registrar proveedor'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
