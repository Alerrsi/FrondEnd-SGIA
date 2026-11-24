import { afterEach, describe, expect, it, vi } from 'vitest';

import { downloadBlob } from './utils/download';

describe('downloadBlob (docs/exportaciones-y-campana.md)', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('descarga con el nombre pedido y revoca la URL después, no en el mismo tick', () => {
    vi.useFakeTimers();
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:prueba');
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('prestamos.xlsx');
      expect(this.href).toBe('blob:prueba');
    });

    downloadBlob(new Blob(['x']), 'prestamos.xlsx');

    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(revoke).not.toHaveBeenCalled();
    expect(document.querySelector('a[download]')).toBeNull();
    vi.advanceTimersByTime(1_000);
    expect(revoke).toHaveBeenCalledWith('blob:prueba');
  });
});
