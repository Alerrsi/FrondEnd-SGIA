import { CalendarClock, ClipboardPlus, FileWarning, House } from 'lucide-react-native';
import { TabList, Tabs, TabSlot, TabTrigger } from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { IconTabBar, IconTabButton } from '@/components/icon-tab-bar';

/** Las cuatro pantallas del profesor con el menú inferior en barra de iconos (mismos iconos que el web). */
export default function AppTabs() {
  return (
    <Tabs style={styles.root}>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <IconTabBar>
          <TabTrigger name="index" href="/" asChild>
            <IconTabButton tabKey="index" label="Inicio" icon={House} />
          </TabTrigger>
          <TabTrigger name="solicitar" href="/solicitar" asChild>
            <IconTabButton tabKey="solicitar" label="Solicitar equipo" icon={ClipboardPlus} />
          </TabTrigger>
          <TabTrigger name="explore" href="/explore" asChild>
            <IconTabButton tabKey="explore" label="Mis préstamos" icon={CalendarClock} />
          </TabTrigger>
          <TabTrigger name="novedades" href="/novedades" asChild>
            <IconTabButton tabKey="novedades" label="Novedades" icon={FileWarning} />
          </TabTrigger>
        </IconTabBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  slot: { flex: 1 },
});
