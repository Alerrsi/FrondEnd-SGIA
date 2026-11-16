import AppTabs from '@/components/app-tabs';
import { usePushNotifications } from '@/features/notifications/use-push-notifications';

export default function AppLayout() {
  usePushNotifications();
  return <AppTabs />;
}
