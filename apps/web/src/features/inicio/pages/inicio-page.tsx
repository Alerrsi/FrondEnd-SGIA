import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ROLE_LABELS, type RoleCode } from '@sgia/types';

import { useAuth } from '@/features/auth/context/auth-context';
import { toast } from '@/lib/toast';
import { getRoleDefaultPath } from '@/features/auth/types/roles';
import { FloatingPart } from '../components/floating-part';
import { HeroIllustration } from '../components/hero-illustration';
import { InicioHeader } from '../components/inicio-header';
import { QuickAccessCarousel } from '../components/quick-access-carousel';
import { TipCard } from '../components/tip-card';
import { ToolPattern } from '../components/tool-pattern';
import { getInicioHero, getInicioModules } from '../lib/inicio-content';

/** Diagonal del panel oscuro (pantallas grandes). */
const PANEL_CLIP =
  'polygon(77% 0, 100% 0, 100% 100%, 44% 100%, 44% 82%, 44.4% 77%, 45.6% 73%)';

/**
 * Portada común a todos los roles (`/inicio`), fuera del layout con sidebar.
 * Presenta SGIA, el acceso principal del rol y atajos a sus módulos.
 */
export default function InicioPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const hero = getInicioHero(user.rol);
  const modules = getInicioModules(user.rol);
  const panelPath = getRoleDefaultPath(user.rol);
  const firstName = user.nombre.split(' ')[0] ?? user.nombre;
  const roleLabel = ROLE_LABELS[user.rol as RoleCode] ?? user.rol;
  const storeroom = user.storeroom?.name;

  const handleLogout = () => {
    logout();
    toast.info('Sesión cerrada correctamente');
    navigate('/login');
  };

  return (
    <div className="min-h-dvh bg-zinc-100 p-3 text-zinc-900 sm:p-6 dark:bg-zinc-950 dark:text-zinc-100">
      <main className="relative mx-auto flex min-h-[calc(100dvh-1.5rem)] max-w-[1400px] flex-col gap-8 overflow-hidden rounded-3xl border border-zinc-200 bg-white p-5 shadow-xs sm:min-h-[calc(100dvh-3rem)] sm:p-8 lg:p-10 dark:border-zinc-800 dark:bg-zinc-950">
        {/* Halo cálido arriba a la izquierda */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-28 -left-28 h-72 w-72 rounded-full bg-amber-100/80 blur-3xl dark:bg-amber-400/10" />

        {/* Panel oscuro en diagonal con trama de herramientas */}
        <div
          aria-hidden="true"
          data-testid="inicio-dark-panel"
          className="pointer-events-none absolute inset-0 hidden bg-zinc-900 lg:block dark:bg-zinc-900"
          style={{ clipPath: PANEL_CLIP }}
        >
          <ToolPattern />
        </div>

        <InicioHeader modules={modules} panelPath={panelPath} onLogout={handleLogout} />

        <div className="relative z-10 grid flex-1 gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          {/* Columna izquierda: mensaje y acción principal */}
          <section id="que-es" className="flex flex-col justify-between gap-10">
            <div className="relative flex flex-col gap-6 lg:pt-10 lg:pl-16">
              <svg
                aria-hidden="true"
                viewBox="0 0 40 24"
                className="absolute top-24 left-0 hidden h-6 w-10 text-zinc-400 lg:block"
              >
                <path
                  d="M2 8 q 6 -6 12 0 t 12 0 t 12 0 M2 18 q 6 -6 12 0 t 12 0 t 12 0"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>

              <span className="inline-flex w-fit items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2 py-0.5 font-mono text-[11px] font-medium text-red-700 dark:border-red-900/40 dark:bg-red-950/50 dark:text-red-400">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                SEDE TEMUCO · {hero.eyebrow.toUpperCase()}
              </span>

              <h1 className="text-4xl leading-tight tracking-tight sm:text-5xl">
                <span className="block font-light">{hero.title}</span>
                <span className="block font-bold">{hero.titleStrong}</span>
              </h1>

              <p className="max-w-sm text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {hero.description} Todo en <strong className="font-semibold text-zinc-900 dark:text-zinc-100">SGIA</strong>,
                el sistema de inventario y activos de INACAP.
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    {roleLabel}
                    {storeroom ? ` · ${storeroom}` : ''}
                  </p>
                  <p className="text-2xl font-bold">Hola, {firstName}</p>
                </div>
                <Link
                  to={hero.cta.to}
                  className="group inline-flex h-14 items-center gap-3 rounded-full bg-zinc-900 pr-7 pl-2 text-sm font-medium text-white shadow-lg shadow-zinc-900/20 transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-300 text-zinc-900">
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                  {hero.cta.label}
                </Link>
              </div>

              <div aria-hidden="true" className="flex items-center gap-1.5">
                <span className="h-1 w-8 rounded-full bg-amber-300" />
                <span className="h-1 w-3 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                <span className="h-1 w-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
              </div>
            </div>

            <TipCard tip={hero.tip} />
          </section>

          {/* Columna derecha: bandeja del pañol y accesos rápidos */}
          <section
            aria-label="Pañol"
            className="relative flex flex-col justify-between gap-6 overflow-hidden rounded-3xl bg-zinc-900 p-5 lg:overflow-visible lg:rounded-none lg:bg-transparent lg:p-0"
          >
            <ToolPattern className="lg:hidden" />

            <div className="relative mx-auto w-full max-w-[560px] lg:-mt-6">
              <span aria-hidden="true" className="absolute top-[16%] left-[6%] h-2.5 w-2.5 rounded-full bg-zinc-900 lg:bg-zinc-900" />
              <span aria-hidden="true" className="absolute top-[8%] left-[44%] h-2 w-2 rounded-full bg-amber-300" />
              <span aria-hidden="true" className="absolute top-[30%] left-[2%] h-3 w-3 rounded-full bg-amber-200" />
              <HeroIllustration className="relative" />
              <FloatingPart kind="led" className="top-[22%] -left-[2%] h-16 w-16 sm:h-20 sm:w-20" />
              <FloatingPart kind="chip" className="top-[2%] right-[6%] h-16 w-16 sm:h-20 sm:w-20" />
              <FloatingPart kind="nut" className="bottom-[10%] left-[4%] h-10 w-10 sm:h-12 sm:w-12" />
              <FloatingPart kind="chip" className="right-[0%] bottom-[18%] h-12 w-12 rotate-45" />
            </div>

            <div className="relative w-full lg:ml-auto lg:max-w-md">
              <QuickAccessCarousel modules={modules} />
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
