import { Badge, LoanStatusBadge, type Tone } from "@/components/ui/badge";

const REQUEST_STATUS: Record<string, { label: string; tone: Tone }> = {
  pendiente: { label: "Pendiente", tone: "warning" },
  en_proceso: { label: "En proceso", tone: "loaned" },
  procesado: { label: "Procesada", tone: "success" },
  procesada: { label: "Procesada", tone: "success" },
  rechazado: { label: "Rechazada", tone: "danger" },
  rechazada: { label: "Rechazada", tone: "danger" },
};

/** Estado de una solicitud remota; los estados de préstamo (preparado, entregado…) usan el badge común. */
export function LoanRequestStatusBadge({ estado }: { estado: string }) {
  const meta = REQUEST_STATUS[String(estado).toLowerCase()];
  if (!meta) return <LoanStatusBadge estado={estado} />;
  return (
    <Badge tone={meta.tone} dot>
      {meta.label}
    </Badge>
  );
}
