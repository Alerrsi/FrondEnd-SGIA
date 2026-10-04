import { describe, expect, it } from 'vitest';
import { canAccessRoute, getRoleDefaultPath, isWebRole } from './roles';

describe('Role and Route Permissions', () => {
  it('identifies web roles correctly', () => {
    expect(isWebRole('AD-01')).toBe(true);
    expect(isWebRole('DIR-01')).toBe(true);
    expect(isWebRole('PAN-01')).toBe(true);
    expect(isWebRole('PRO-01')).toBe(false);
    expect(isWebRole('UNKNOWN')).toBe(false);
  });

  it('defines default routes for each web role', () => {
    expect(getRoleDefaultPath('AD-01')).toBe('/usuarios');
    expect(getRoleDefaultPath('DIR-01')).toBe('/');
    expect(getRoleDefaultPath('PAN-01')).toBe('/inventario');
    expect(getRoleDefaultPath('PRO-01')).toBe('/login');
  });

  describe('canAccessRoute', () => {
    it('allows AD-01 only to access user management', () => {
      expect(canAccessRoute('AD-01', '/usuarios')).toBe(true);
      expect(canAccessRoute('AD-01', '/')).toBe(false);
      expect(canAccessRoute('AD-01', '/inventario')).toBe(false);
      expect(canAccessRoute('AD-01', '/prestamos/cola')).toBe(false);
      expect(canAccessRoute('AD-01', '/cotizaciones')).toBe(false);
    });

    it('allows DIR-01 to access dashboard, quotations, and inventory', () => {
      expect(canAccessRoute('DIR-01', '/')).toBe(true);
      expect(canAccessRoute('DIR-01', '/cotizaciones')).toBe(true);
      expect(canAccessRoute('DIR-01', '/inventario')).toBe(true);
      expect(canAccessRoute('DIR-01', '/usuarios')).toBe(false);
      expect(canAccessRoute('DIR-01', '/prestamos/cola')).toBe(false);
    });

    it('allows PAN-01 to access inventory and loan queue', () => {
      expect(canAccessRoute('PAN-01', '/inventario')).toBe(true);
      expect(canAccessRoute('PAN-01', '/prestamos/cola')).toBe(true);
      expect(canAccessRoute('PAN-01', '/')).toBe(false);
      expect(canAccessRoute('PAN-01', '/cotizaciones')).toBe(false);
      expect(canAccessRoute('PAN-01', '/usuarios')).toBe(false);
    });

    it('rejects PRO-01 from all web routes', () => {
      expect(canAccessRoute('PRO-01', '/')).toBe(false);
      expect(canAccessRoute('PRO-01', '/inventario')).toBe(false);
      expect(canAccessRoute('PRO-01', '/prestamos/cola')).toBe(false);
      expect(canAccessRoute('PRO-01', '/cotizaciones')).toBe(false);
      expect(canAccessRoute('PRO-01', '/usuarios')).toBe(false);
    });
  });
});
