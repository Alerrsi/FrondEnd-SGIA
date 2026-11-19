import { LayoutGrid, ListChecks } from 'lucide-react';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { ModuleGrid } from '@/components/ui/module-grid';
import { SectionTitle } from '@/components/ui/section-title';
import { useAuth } from '@/features/auth/context/auth-context';
import { quickActionsForRole } from '@/layouts/nav-config';
import { CatalogSearch } from '../components/catalog-search';
import { ExecutiveKpis } from '../components/executive-kpis';
import { HomeHero } from '../components/home-hero';
import { QueuePreview } from '../components/queue-preview';
import { RecentActivity } from '../components/recent-activity';
import { ScanBox } from '../components/scan-box';
import { TodaySection } from '../components/today-section';
import { getInicioModules } from '../lib/inicio-content';

const dateFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

/** Bloque propio de cada rol, debajo de sus pendientes (docs/rediseno-interfaz.md §6). */
function RoleBlock({ role }: { role: string }) {
  if (role === 'PAN-01') return <QueuePreview />;
  if (role === 'DIR-01') {
    return (
      <section aria-label="Cifras del pañol" className="flex flex-col gap-2">
        <SectionTitle>Últimos 30 días</SectionTitle>
        <ExecutiveKpis />
      </section>
    );
  }
  if (role === 'AD-01') return <RecentActivity />;
  return null;
}

/** Página de inicio de cada rol (`/`): a dónde llega cada usuario al iniciar sesión. */
export default function InicioPage() {
  const { user } = useAuth();
  if (!user) return null;

  const role = user.rol;
  const firstName = user.nombre.split(' ')[0] ?? user.nombre;
  const roleLabel = ROLE_LABELS[role as RoleCode] ?? role;
  const date = dateFormat.format(new Date());
  const today = date.charAt(0).toUpperCase() + date.slice(1);
  const [primary, ...secondary] = quickActionsForRole(role);
  const aside = role === 'PAN-01' ? <ScanBox /> : role === 'PRO-01' ? <CatalogSearch /> : undefined;

  return (
    <div className="flex flex-col gap-8">
      <HomeHero
        firstName={firstName}
        context={`${today} · ${roleLabel}${user.storeroom?.name ? ` · ${user.storeroom.name}` : ''}`}
        primary={primary}
        secondary={secondary}
        aside={aside}
      />

      <section className="ui-enter-2 flex flex-col gap-3" aria-label="Lo que te toca hoy">
        <SectionTitle icon={ListChecks}>Lo que te toca hoy</SectionTitle>
        <TodaySection role={role} />
      </section>

      <RoleBlock role={role} />

      <section className="flex flex-col gap-3" aria-label="Accesos">
        <SectionTitle icon={LayoutGrid}>Accesos</SectionTitle>
        <ModuleGrid links={getInicioModules(role)} />
      </section>
    </div>
  );
}
