import { PurchaseRequestStatus } from '@sgia/types';

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

/** Las 5 etapas del flujo de compras como un solo tramo continuo (en móvil, en columna). */
export function PurchaseFlowSteps() {
  return (
    <ol className="grid grid-cols-1 divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 bg-white sm:grid-cols-5 sm:divide-x sm:divide-y-0 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {FLOW_STEPS.map((step) => (
        <li key={step.status}>
          <PurchaseFlowStep {...step} />
        </li>
      ))}
    </ol>
  );
}
