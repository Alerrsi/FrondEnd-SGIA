import { PackageSearch } from "lucide-react";

import { LoanRequestForm } from "@/features/profesor/components/loan-request-form";
import { PageHeader } from '@/components/ui/page-header';

export default function CatalogoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={PackageSearch}
        title="Catálogo y nueva solicitud"
        description="Pide insumos y equipos al pañol para una actividad. El pañol los prepara antes del inicio."
      />
      <LoanRequestForm />
    </div>
  );
}
