import { PageEyebrow } from '@/components/shared/page-eyebrow';
import { PackageSearch } from 'lucide-react';

import { LoanRequestForm } from '@/features/profesor/components/loan-request-form';

export default function CatalogoPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
          <PageEyebrow area="PAÑOL TI" section="Catálogo" />
        <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
          <PackageSearch aria-hidden="true" className="h-5 w-5 text-text" />
          Catálogo y nueva solicitud
        </h1>
        <p className="text-xs text-text-muted">
          Pide insumos y equipos al pañol para una actividad. El pañol los prepara antes del inicio.
        </p>
      </div>
      <LoanRequestForm />
    </div>
  );
}
