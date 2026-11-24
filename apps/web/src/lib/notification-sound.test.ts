import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { playNotificationSound, resetNotificationSoundForTests } from './notification-sound';

describe('playNotificationSound', () => {
  const created: Array<{ src: string; volume: number; currentTime: number; play: ReturnType<typeof vi.fn> }> = [];

  beforeEach(() => {
    created.length = 0;
    resetNotificationSoundForTests();
    vi.stubGlobal(
      'Audio',
      vi.fn(function (this: (typeof created)[number], src: string) {
        this.src = src;
        this.volume = 1;
        this.currentTime = 0;
        this.play = vi.fn(() => Promise.resolve());
        created.push(this);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('reproduce el mp3 de notificación con volumen moderado', () => {
    playNotificationSound();
    expect(created).toHaveLength(1);
    expect(created[0]!.src).toContain('notificacion');
    expect(created[0]!.volume).toBe(0.6);
    expect(created[0]!.play).toHaveBeenCalledTimes(1);
  });

  it('reutiliza el mismo audio y vuelve a empezar si suena de nuevo', () => {
    playNotificationSound();
    created[0]!.currentTime = 0.4;
    playNotificationSound();
    expect(created).toHaveLength(1);
    expect(created[0]!.currentTime).toBe(0);
    expect(created[0]!.play).toHaveBeenCalledTimes(2);
  });

  it('si el navegador bloquea el sonido falla en silencio', async () => {
    vi.stubGlobal(
      'Audio',
      vi.fn(function (this: { play: () => Promise<void>; currentTime: number; volume: number }) {
        this.currentTime = 0;
        this.volume = 1;
        this.play = () => Promise.reject(new DOMException('No permitido', 'NotAllowedError'));
      }),
    );
    expect(() => playNotificationSound()).not.toThrow();
    await Promise.resolve();
  });
});
