import { useMyIncidentReports, useMyLoanRequests } from '@sgia/api-client';
import { ROLE_LABELS } from '@sgia/types';
import { ListChecks } from 'lucide-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Screen } from '@/components/ui/screen';
import { useAuth } from '@/features/auth/auth-context';
import { CatalogSearch } from '@/features/inicio/components/catalog-search';
import { HomeHero } from '@/features/inicio/components/home-hero';
import { OpenReports } from '@/features/inicio/components/open-reports';
import { TodayTasks } from '@/features/inicio/components/today-tasks';
import { UpcomingLoans } from '@/features/inicio/components/upcoming-loans';
import { countOpenReports, summarizeLoans, upcomingLoans } from '@/features/inicio/lib/loan-summary';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/dates';
import { spacing } from '@/theme';

const dateFormat = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });

/** Inicio del docente: saludo, búsqueda del catálogo, lo que le toca hoy, próximas clases e informes abiertos. */
export default function InicioScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  // shortcut: cuentas sobre las 100 más recientes (igual que el Inicio web); pedir totales a la API si un docente supera eso.
  const loans = useMyLoanRequests({ per_page: 100 });
  const reports = useMyIncidentReports({ per_page: 100 });

  const summary = useMemo(() => (loans.data ? summarizeLoans(loans.data) : undefined), [loans.data]);
  const upcoming = useMemo(() => (loans.data ? upcomingLoans(loans.data, todayIso()) : []), [loans.data]);
  const openReports = reports.data ? countOpenReports(reports.data.data) : undefined;

  if (!user) return null;

  const firstName = user.nombre.split(' ')[0] ?? user.nombre;
  const date = dateFormat.format(new Date());
  const today = date.charAt(0).toUpperCase() + date.slice(1);
  const context = [today, ROLE_LABELS[user.rol] ?? user.rol, user.storeroom?.name].filter(Boolean).join(' · ');

  return (
    <Screen
      refreshing={loans.isRefetching || reports.isRefetching}
      onRefresh={() => {
        void loans.refetch();
        void reports.refetch();
      }}
    >
      <HomeHero firstName={firstName} context={context} />
      <CatalogSearch />

      <View style={styles.block} accessibilityLabel="Lo que te toca hoy">
        <View style={styles.title}>
          <ListChecks size={16} color={theme.inkMuted} aria-hidden />
          <ThemedText variant="section" accessibilityRole="header">
            Lo que te toca hoy
          </ThemedText>
        </View>
        <TodayTasks summary={loans.isError ? undefined : summary} isLoading={loans.isLoading} />
      </View>

      <UpcomingLoans
        loans={upcoming}
        isLoading={loans.isLoading}
        isError={loans.isError}
        onRetry={() => void loans.refetch()}
      />
      <OpenReports count={openReports} isLoading={reports.isLoading} isError={reports.isError} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md },
  title: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
