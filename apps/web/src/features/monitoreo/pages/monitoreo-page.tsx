import { ShieldCheck } from 'lucide-react';

import { PageHeading } from '@/components/ui/page-heading';
import { HealthPanel } from '../components/health-panel';
import { LoginActivityPanel } from '../components/login-activity-panel';
import { RecentFailuresPanel } from '../components/recent-failures-panel';
import { SensitiveChangesPanel } from '../components/sensitive-changes-panel';
import { SessionsPanel } from '../components/sessions-panel';

/** Monitoreo de seguridad y salud del sistema (AD-01). Los paneles se refrescan solos. */
export default function MonitoreoPage() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={ShieldCheck} title="Monitoreo">
        Accesos, sesiones y estado del sistema. Se actualiza cada minuto.
      </PageHeading>
      <HealthPanel />
      <LoginActivityPanel />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <RecentFailuresPanel />
        <SensitiveChangesPanel />
      </div>
      <SessionsPanel />
    </div>
  );
}
