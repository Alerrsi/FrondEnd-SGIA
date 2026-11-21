/**
 * En web no hay push nativo y `useLastNotificationResponse` lanza `UnavailabilityError`:
 * la versión web no registra el dispositivo ni escucha avisos.
 */
export function usePushNotifications(): void {}
