import { PurchaseRequestStatus } from '@sgia/types';
import { ChevronDown, ChevronRight } from 'lucide-react';

import { PurchaseFlowStep, type PurchaseFlowStepProps } from '@/features/compras/components/purchase-flow-step';

const FLOW_STEPS: PurchaseFlowStepProps[] = [
  {
    number: 1,
    title: 'Solicitud',
    description: 'Productos, cantidades y presupuesto; la aprueba el director.',
    status: PurchaseRequestStatus.BORRADOR,
    pendingLabel: 'por aprobar',
  },
  {
    number: 2,
    title: 'Envío por áreas',
    description: 'Correo a los proveedores activos de las áreas elegidas.',
    status: PurchaseRequestStatus.APROBADA,
    pendingLabel: 'por enviar',
  },
  {
    number: 3,
    title: 'Cotizaciones',
    description: 'Se suben las recibidas; con 3 o más se elige una.',
    status: PurchaseRequestStatus.ENVIADA,
    pendingLabel: 'esperando cotizaciones',
  },
  {
    number: 4,
    title: 'Orden de compra',
    description: 'Se sube la OC emitida y se reserva el presupuesto.',
    status: PurchaseRequestStatus.COTIZADA,
    pendingLabel: 'por subir OC',
  },
  {
    number: 5,
    title: 'Factura',
    description: 'Ingresa el stock y consume lo facturado.',
    status: PurchaseRequestStatus.CON_OC,
    pendingLabel: 'esperando factura',
  },
];

/** Las 5 etapas del flujo de compras unidas por flechas (en móvil, en columna). */
export function PurchaseFlowSteps() {
  return (
    <ol className="flex flex-col gap-1 sm:flex-row sm:items-stretch">
      {FLOW_STEPS.map((step, i) => (
        <li key={step.status} className="flex flex-1 flex-col items-stretch gap-1 sm:flex-row sm:items-center">
          <div className="flex-1 self-stretch">
            <PurchaseFlowStep {...step} />
          </div>
          {i < FLOW_STEPS.length - 1 && (
            <span aria-hidden className="flex shrink-0 justify-center text-zinc-400 dark:text-zinc-600">
              <ChevronDown className="h-4 w-4 sm:hidden" />
              <ChevronRight className="hidden h-4 w-4 sm:block" />
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
