import notificationSoundUrl from '@/assets/sounds/notificacion.mp3';

/**
 * Sonido de las notificaciones (avisos emergentes y alertas nuevas de la campana): `assets/sounds/notificacion.mp3`
 * («New Notification 010» de Universfield, licencia de Pixabay: uso libre, sin atribución obligatoria). Un solo
 * `<audio>` reutilizado: si llegan varias notificaciones seguidas, el sonido vuelve a empezar en vez de apilarse.
 * El navegador solo deja sonar después de alguna interacción con la página (el login ya la cuenta); si no puede,
 * falla en silencio.
 */
const VOLUME = 0.6;

let audio: HTMLAudioElement | null = null;

function notificationAudio(): HTMLAudioElement | null {
  if (typeof Audio === 'undefined') return null;
  if (!audio) {
    audio = new Audio(notificationSoundUrl);
    audio.preload = 'auto';
    audio.volume = VOLUME;
  }
  return audio;
}

export function playNotificationSound(): void {
  try {
    const player = notificationAudio();
    if (!player) return;
    player.currentTime = 0;
    const playing = player.play();
    // `play()` se rechaza si el navegador aún no permite sonido: la notificación igual se ve.
    if (playing && typeof playing.catch === 'function') playing.catch(() => undefined);
  } catch {
    // Sin audio disponible: la notificación igual se ve en la campana o en el aviso.
  }
}

/** Solo para pruebas: olvida el `<audio>` creado. */
export function resetNotificationSoundForTests(): void {
  audio = null;
}
