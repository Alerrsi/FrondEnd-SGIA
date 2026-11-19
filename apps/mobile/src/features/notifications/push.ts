import { devicesApi } from '@sgia/api-client';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/** `id` que devolvió `POST /devices`, para borrarlo al cerrar sesión. */
const DEVICE_ID_KEY = 'sgia_push_device_id';

if (Platform.OS !== 'web') {
  // Con la app abierta el aviso también se muestra (por defecto se descarta en silencio).
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/**
 * Pide permiso, obtiene el token de Expo y lo registra en la API. No hace nada en web, en emulador,
 * sin permiso o sin `extra.eas.projectId` (requiere `eas init` y un development build; Expo Go en
 * Android no entrega tokens de push).
 */
export async function registerPushDevice(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) return;

  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    console.warn('Push desactivado: falta extra.eas.projectId en app.json (ejecuta `eas init`).');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Avisos de SGIA',
      importance: AndroidImportance.DEFAULT,
    });
  }

  let { granted, canAskAgain } = await Notifications.getPermissionsAsync();
  if (!granted && canAskAgain) ({ granted } = await Notifications.requestPermissionsAsync());
  if (!granted) return;

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  const { id } = await devicesApi.registerDevice(token, Platform.OS === 'ios' ? 'ios' : 'android');
  await SecureStore.setItemAsync(DEVICE_ID_KEY, String(id));
}

/** Quita el token de este dispositivo de la cuenta. Llamar antes de revocar la sesión. */
export async function unregisterPushDevice(): Promise<void> {
  if (Platform.OS === 'web') return;

  const id = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (!id) return;

  await SecureStore.deleteItemAsync(DEVICE_ID_KEY);
  await devicesApi.unregisterDevice(Number(id));
}
