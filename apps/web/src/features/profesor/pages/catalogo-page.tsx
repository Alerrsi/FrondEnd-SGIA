import { PackageSearch } from "lucide-react";

import { LoanRequestForm } from "@/features/profesor/components/loan-request-form";
import { PageHeading } from '@/components/ui/page-heading';

export default function CatalogoPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={PackageSearch} title="Catálogo y nueva solicitud">
        Pide insumos y equipos al pañol para una actividad. El pañol los
        prepara antes del inicio.
      </PageHeading>
      <LoanRequestForm />
    </div>
  );
}
