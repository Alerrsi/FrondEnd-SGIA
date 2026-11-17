import { PurchaseRequestStatus } from '@sgia/types';
import { ArrowRight, ChevronDown, ChevronRight, ListOrdered, ShoppingBag, SquareStack } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PageHeading } from '@/components/ui/page-heading';
import { SectionTitle } from '@/components/ui/section-title';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute } from '@/features/auth/types/roles';
import { PurchaseFlowStep, type PurchaseFlowStepProps } from '@/features/compras/components/purchase-flow-step';
import { purchaseLinksFor } from '@/features/compras/lib/purchase-nav';

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

export default function ComprasHubPage() {
  const { user } = useAuth();
  const links = purchaseLinksFor(user?.rol);
  const canSeeRequests = user ? canAccessRoute(user.rol, '/compras/solicitudes') : false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={ShoppingBag} title="Compras">
        Solicitud → envío por áreas → cotizaciones (mín. 3) → orden de compra → factura.
      </PageHeading>

      {canSeeRequests && (
        <section className="flex flex-col gap-2" aria-label="Etapas del flujo de compras">
          <SectionTitle icon={ListOrdered}>Etapas del flujo</SectionTitle>
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
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle icon={SquareStack}>Módulos</SectionTitle>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {links.map(({ to, label, description, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="group flex h-full items-start gap-3 rounded-md border border-zinc-200 bg-white px-3 py-2.5 shadow-xs transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/60"
              >
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{label}</span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400">{description}</span>
                </span>
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
