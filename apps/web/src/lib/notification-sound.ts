/**
 * Sonido de prueba para notificaciones nuevas (docs/exportaciones-y-campana.md): dos tonos cortos generados con
 * Web Audio, sin archivo. El navegador solo deja sonar después de alguna interacción con la página (el login
 * ya la cuenta); si no puede, falla en silencio.
 */
let context: AudioContext | null = null;

function audioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  context ??= new Ctor();
  return context;
}

export function playNotificationSound(): void {
  try {
    const ctx = audioContext();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime;
    // «Ding-dong» suave: 880 Hz y luego 1320 Hz, 160 ms cada uno, con entrada y salida para que no chasquee.
    [880, 1320].forEach((frequency, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t0 = start + i * 0.16;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 0.17);
    });
  } catch {
    // Sin audio disponible: la notificación igual se ve en la campana.
  }
}
