import { PackageSearch } from "lucide-react";

import { LoanRequestForm } from "@/features/profesor/components/loan-request-form";

export default function CatalogoPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          <PackageSearch className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
          Catálogo y nueva solicitud
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Pide insumos y equipos al pañol para una actividad. El pañol los
          prepara antes del inicio.
        </p>
      </div>
      <LoanRequestForm />
    </div>
  );
}
