import { PurchaseRequestStatus } from '@sgia/types';

import type { Tone } from '@/components/ui/badge';

export const PURCHASE_REQUEST_STATUS_LABEL: Record<PurchaseRequestStatus, string> = {
  [PurchaseRequestStatus.BORRADOR]: 'Borrador',
  [PurchaseRequestStatus.APROBADA]: 'Aprobada',
  [PurchaseRequestStatus.ENVIADA]: 'Enviada',
  [PurchaseRequestStatus.COTIZADA]: 'Cotizada',
  [PurchaseRequestStatus.CON_OC]: 'Con OC',
  [PurchaseRequestStatus.FACTURADA]: 'Facturada',
  [PurchaseRequestStatus.CANCELADA]: 'Cancelada',
};

export const PURCHASE_REQUEST_STATUS_TONE: Record<PurchaseRequestStatus, Tone> = {
  [PurchaseRequestStatus.BORRADOR]: 'neutral',
  [PurchaseRequestStatus.APROBADA]: 'loaned',
  [PurchaseRequestStatus.ENVIADA]: 'warning',
  [PurchaseRequestStatus.COTIZADA]: 'maintenance',
  [PurchaseRequestStatus.CON_OC]: 'loaned',
  [PurchaseRequestStatus.FACTURADA]: 'success',
  [PurchaseRequestStatus.CANCELADA]: 'retired',
};

/** Camino feliz de la máquina de estados (sin `cancelada`). */
export const PURCHASE_REQUEST_FLOW: PurchaseRequestStatus[] = [
  PurchaseRequestStatus.BORRADOR,
  PurchaseRequestStatus.APROBADA,
  PurchaseRequestStatus.ENVIADA,
  PurchaseRequestStatus.COTIZADA,
  PurchaseRequestStatus.CON_OC,
  PurchaseRequestStatus.FACTURADA,
];
