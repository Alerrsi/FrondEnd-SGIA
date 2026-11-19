import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from '@/features/auth/auth-context';
import { registerPushDevice } from '@/features/notifications/push';

/**
 * Con sesión iniciada registra el dispositivo para recibir avisos y, al tocar un aviso de préstamo
 * (`loan_status`, `loan_due_soon`, `loan_overdue`…), abre "Mis Préstamos".
 */
export function usePushNotifications(): void {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  useEffect(() => {
    if (userId === undefined) return;
    // Sin push la app sigue funcionando: el fallo solo se registra.
    registerPushDevice().catch((error: unknown) => console.warn('No se pudo registrar el push:', error));
  }, [userId]);

  const response = Notifications.useLastNotificationResponse();
  const type = response?.notification.request.content.data?.type;

  useEffect(() => {
    if (userId !== undefined && typeof type === 'string' && type.startsWith('loan_')) {
      router.navigate('/explore');
    }
  }, [response, type, userId, router]);
}
