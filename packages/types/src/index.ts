export type {
  RoleCode,
  Usuario,
  CreateUsuarioPayload,
  UpdateUsuarioPayload,
  UsuarioSinPassword,
  UserQueryParams,
} from './usuario';
export { ROLES, ROLE_LABELS } from './usuario';

export type {
  Producto,
  CreateProductoPayload,
  UpdateProductoPayload,
  BorradorProducto,
  InvoiceScanResponse,
  ProductoParams,
  Ubicacion,
  LocationTipo,
  LocationEntity,
  CajonEntity,
  LocationQueryParams,
  CajonQueryParams,
  CreateLocationPayload,
  UpdateLocationPayload,
  CreateCajonPayload,
  UpdateCajonPayload,
  ProductLocationDetailResponse,
  ProductLocationPayload,
  ProductBarcodeResponse,
  CriticalStockAlert,
  CriticalStockAlertQueryParams,
  ExtraerFacturaPayload,
} from './producto';

export { LoanStatus } from './prestamo';
export type {
  LoanStatus as LoanStatusValue,
  LoanOrigin,
  Prestamo,
  ItemPrestamo,
  PrestamoEvento,
  CreatePrestamoPayload,
  RemoteLoanRequestPayload,
  LoanCheckoutPayload,
  LoanCheckinPayload,
  AprobarPrestamoPayload,
  RechazarPrestamoPayload,
  PrestamoParams,
  LoanExportParams,
} from './prestamo';

export { QuotationStatus, PurchaseStatus } from './cotizacion';
export type {
  QuotationStatus as QuotationStatusValue,
  PurchaseStatus as PurchaseStatusValue,
  Supplier,
  CreateSupplierPayload,
  Cotizacion,
  CotizacionItem,
  CreateCotizacionPayload,
  CotizacionParams,
  PurchaseOrder,
  CreatePurchasePayload,
} from './cotizacion';

export type {
  EquipmentStatus,
  EquipmentSpecs,
  UpdateEquipmentSpecsPayload,
  EquipmentMaintenanceRecord,
  EquipmentQueryParams,
  Equipo,
  FichaTecnica,
  IncidentSeverity,
  IncidentStatus,
  IncidentReport,
  CreateIncidentReportPayload,
  Novedad,
  CreateNovedadPayload,
  DashboardStats,
  TopDemandedItem,
  CareerDistribution,
  TeacherLoanRanking,
} from './equipo';

export type { PaginatedResponse, ApiError, AuthResponse } from './pagination';
