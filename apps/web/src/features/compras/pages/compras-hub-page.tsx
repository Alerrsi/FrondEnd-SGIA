import { ListOrdered, ShoppingBag, SquareStack } from 'lucide-react';

import { ModuleGrid } from '@/components/ui/module-grid';
import { PageHeading } from '@/components/ui/page-heading';
import { SectionTitle } from '@/components/ui/section-title';
import { useAuth } from '@/features/auth/context/auth-context';
import { canAccessRoute } from '@/features/auth/types/roles';
import { PurchaseFlowSteps } from '@/features/compras/components/purchase-flow-steps';
import { purchaseLinksFor } from '@/features/compras/lib/purchase-nav';

export default function ComprasHubPage() {
  const { user } = useAuth();
  const canSeeRequests = user ? canAccessRoute(user.rol, '/compras/solicitudes') : false;

  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={ShoppingBag} title="Compras">
        Solicitud → envío por áreas → cotizaciones (mín. 3) → orden de compra → factura.
      </PageHeading>

      {canSeeRequests && (
        <section className="flex flex-col gap-2" aria-label="Etapas del flujo de compras">
          <SectionTitle icon={ListOrdered}>Etapas del flujo</SectionTitle>
          <PurchaseFlowSteps />
        </section>
      )}

      <section className="flex flex-col gap-2">
        <SectionTitle icon={SquareStack}>Módulos</SectionTitle>
        <ModuleGrid links={purchaseLinksFor(user?.rol)} />
      </section>
    </div>
  );
}
