import { describe, expect, it } from 'vitest';
import { canAccessRoute, canDo, getRoleDefaultPath, isWebRole } from './roles';

describe('Role and Route Permissions', () => {
  it('identifies web roles correctly', () => {
    expect(isWebRole('AD-01')).toBe(true);
    expect(isWebRole('DIR-01')).toBe(true);
    expect(isWebRole('PAN-01')).toBe(true);
    expect(isWebRole('PRO-01')).toBe(true);
    expect(isWebRole('UNKNOWN')).toBe(false);
    expect(isWebRole('Director de carrera')).toBe(true);
    expect(isWebRole('Administrador')).toBe(true);
    expect(isWebRole('Pañol')).toBe(true);
    expect(isWebRole('Docente')).toBe(false);
  });

  it('defines default routes for each web role', () => {
    expect(getRoleDefaultPath('AD-01')).toBe('/usuarios');
    expect(getRoleDefaultPath('DIR-01')).toBe('/');
    expect(getRoleDefaultPath('PAN-01')).toBe('/inventario');
    expect(getRoleDefaultPath('PRO-01')).toBe('/profesor/solicitudes');
  });

  describe('canAccessRoute', () => {
    it('allows AD-01 to access management, inventory and administrative routes', () => {
      expect(canAccessRoute('AD-01', '/usuarios')).toBe(true);
      expect(canAccessRoute('AD-01', '/inventario')).toBe(true);
      expect(canAccessRoute('AD-01', '/cotizaciones')).toBe(true);
      expect(canAccessRoute('AD-01', '/')).toBe(true);
      expect(canAccessRoute('AD-01', '/presupuestos')).toBe(true);
      expect(canAccessRoute('AD-01', '/prestamos/cola')).toBe(false);
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

    it('allows PRO-01 only to its own routes', () => {
      expect(canAccessRoute('PRO-01', '/profesor/catalogo')).toBe(true);
      expect(canAccessRoute('PRO-01', '/profesor/solicitudes')).toBe(true);
      expect(canAccessRoute('PRO-01', '/profesor/novedades')).toBe(true);
      expect(canAccessRoute('PRO-01', '/')).toBe(false);
      expect(canAccessRoute('PRO-01', '/inventario')).toBe(false);
      expect(canAccessRoute('PRO-01', '/novedades')).toBe(false);
      expect(canAccessRoute('PRO-01', '/prestamos/cola')).toBe(false);
      expect(canAccessRoute('PRO-01', '/cotizaciones')).toBe(false);
      expect(canAccessRoute('PRO-01', '/solicitudes-compra')).toBe(false);
      expect(canAccessRoute('PRO-01', '/usuarios')).toBe(false);
    });

    it('gates actions like the backend', () => {
      // Solo DIR-01 escribe solicitudes de compra (AD-01 → 403 en el backend).
      expect(canDo('DIR-01', 'managePurchaseRequests')).toBe(true);
      expect(canDo('AD-01', 'managePurchaseRequests')).toBe(false);
      expect(canDo('PAN-01', 'cancelPurchase')).toBe(false);
      expect(canDo(undefined, 'manageBudgets')).toBe(false);
    });

    it('keeps the admin roles out of the professor routes', () => {
      for (const role of ['AD-01', 'DIR-01', 'PAN-01'] as const) {
        expect(canAccessRoute(role, '/profesor/solicitudes')).toBe(false);
      }
    });
  });
});
