import { describe, expect, it } from 'vitest';
import { formatRun, normalizeStoredRun, validateRun } from './run';

describe('RUN utils', () => {
  describe('validateRun', () => {
    it('accepts valid RUNs with and without formatting', () => {
      expect(validateRun('11111111-1')).toBe(true);
      expect(validateRun('11.111.111-1')).toBe(true);
      expect(validateRun('12345678-5')).toBe(true);
      expect(validateRun('12.345.678-5')).toBe(true);
    });

    it('accepts K verifier digit', () => {
      expect(validateRun('8765432-k')).toBe(true);
      expect(validateRun('8765432-K')).toBe(true);
    });

    it('rejects invalid RUNs', () => {
      expect(validateRun('12345678-0')).toBe(false);
      expect(validateRun('11111111-2')).toBe(false);
      expect(validateRun('abc')).toBe(false);
      expect(validateRun('')).toBe(false);
      expect(validateRun('123')).toBe(false);
    });
  });

  describe('normalizeStoredRun', () => {
    it('removes dots, spaces and lowercases nothing (uppercases DV)', () => {
      expect(normalizeStoredRun('11.111.111-1')).toBe('11111111-1');
      expect(normalizeStoredRun('12.345.678-k')).toBe('12345678-K');
    });
  });

  describe('formatRun', () => {
    it('formats RUN with dots and dash', () => {
      expect(formatRun('11111111-1')).toBe('11.111.111-1');
      expect(formatRun('12345678-5')).toBe('12.345.678-5');
    });
  });
});