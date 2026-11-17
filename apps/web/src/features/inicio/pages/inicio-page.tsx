import { House, LayoutGrid, ListChecks } from 'lucide-react';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { ModuleGrid } from '@/components/ui/module-grid';
import { PageHeading } from '@/components/ui/page-heading';
import { SectionTitle } from '@/components/ui/section-title';
import { useAuth } from '@/features/auth/context/auth-context';
import { TodaySection } from '../components/today-section';
import { getInicioModules } from '../lib/inicio-content';

const dateFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

/** Página de inicio de todos los roles (`/inicio`): a dónde llega cada usuario al iniciar sesión. */
export default function InicioPage() {
  const { user } = useAuth();
  if (!user) return null;

  const firstName = user.nombre.split(' ')[0] ?? user.nombre;
  const roleLabel = ROLE_LABELS[user.rol as RoleCode] ?? user.rol;
  const date = dateFormat.format(new Date());
  const today = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <div className="flex flex-col gap-4">
      <PageHeading icon={House} title={`Hola, ${firstName}`}>
        {today} · {roleLabel}
        {user.storeroom?.name ? ` · ${user.storeroom.name}` : ''}
      </PageHeading>

      <section className="flex flex-col gap-2" aria-label="Lo que te toca hoy">
        <SectionTitle icon={ListChecks}>Lo que te toca hoy</SectionTitle>
        <TodaySection role={user.rol} />
      </section>

      <section className="flex flex-col gap-2">
        <SectionTitle icon={LayoutGrid}>Accesos</SectionTitle>
        <ModuleGrid links={getInicioModules(user.rol)} />
      </section>
    </div>
  );
}
