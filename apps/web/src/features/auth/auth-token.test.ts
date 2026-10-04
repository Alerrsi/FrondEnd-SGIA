import { beforeEach, describe, expect, it } from 'vitest';
import type { TokenStorage } from '@sgia/api-client';

describe('Token Storage Mechanism', () => {
  let mockStorage: Record<string, string> = {};

  const tokenStorage: TokenStorage = {
    getToken: () => mockStorage['sgia_token'] ?? null,
    setToken: (token: string) => {
      mockStorage['sgia_token'] = token;
    },
    clearToken: () => {
      delete mockStorage['sgia_token'];
    },
  };

  beforeEach(() => {
    mockStorage = {};
  });

  it('initially returns null for token', async () => {
    expect(await tokenStorage.getToken()).toBeNull();
  });

  it('sets and retrieves stored token', async () => {
    await tokenStorage.setToken('test-jwt-token-123');
    expect(await tokenStorage.getToken()).toBe('test-jwt-token-123');
  });

  it('clears token properly upon logout', async () => {
    await tokenStorage.setToken('test-jwt-token-123');
    expect(await tokenStorage.getToken()).toBe('test-jwt-token-123');
    await tokenStorage.clearToken();
    expect(await tokenStorage.getToken()).toBeNull();
  });
});
