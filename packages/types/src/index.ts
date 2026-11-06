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
  ProductConditionPayload,
  CriticalStockAlert,
  CriticalStockAlertQueryParams,
  ExtraerFacturaPayload,
} from './producto';

export { LoanStatus } from './prestamo';
export { INCIDENT_PROBLEM_LABELS } from './equipo';
export type {
  LoanStatus as LoanStatusValue,
  LoanOrigin,
  Prestamo,
  ItemPrestamo,
  PrestamoEvento,
  CreatePrestamoPayload,
  RemoteLoanRequestPayload,
  LoanCheckoutPayload,
  LoanItemUnit,
  DeliverLoanPayload,
  LoanCheckinPayload,
  AprobarPrestamoPayload,
  RechazarPrestamoPayload,
  PrestamoParams,
  LoanExportParams,
  LoanRequestQueryParams,
  PendingLoanParams,
} from './prestamo';

export { QuotationStatus, PurchaseStatus } from './cotizacion';
export type {
  QuotationStatus as QuotationStatusValue,
  PurchaseStatus as PurchaseStatusValue,
  Supplier,
  CreateSupplierPayload,
  SupplierQueryParams,
  Cotizacion,
  CotizacionItem,
  CreateCotizacionPayload,
  CotizacionParams,
  QuotationResponsePayload,
  PurchaseItem,
  PurchaseOrder,
  CreatePurchasePayload,
  PurchaseQueryParams,
  PurchaseTrace,
  PurchaseArrivalScanPayload,
} from './cotizacion';

export type {
  EquipmentStatus,
  EquipmentSpecs,
  UpdateEquipmentSpecsPayload,
  EquipmentMaintenanceRecord,
  EquipmentQueryParams,
  EquipmentReportQueryParams,
  Equipo,
  FichaTecnica,
  IncidentSeverity,
  IncidentStatus,
  IncidentReport,
  IncidentProblem,
  IncidentProblemType,
  IncidentReportQueryParams,
  CreateIncidentReportPayload,
  DashboardStats,
  DashboardAnalyticsParams,
  TopDemandedItem,
  CareerDistribution,
  TeacherLoanRanking,
} from './equipo';

export type {
  MetricEntity,
  MetricAggregation,
  TimeRange,
  KpiTimeRange,
  ChartType,
  MetricQueryInput,
  MetricDataPoint,
  MetricResult,
  ExecutiveKpis,
  DashboardTemplate,
} from './metric';

export type { PaginatedResponse, ApiError, AuthResponse } from './pagination';

export { BudgetMovementType } from './presupuesto';
export type {
  BudgetMovementType as BudgetMovementTypeValue,
  AnnualBudget,
  BudgetSummaryRow,
  BudgetMovement,
  BudgetSpendingGroupBy,
  BudgetSpendingRow,
  BudgetSpending,
  BudgetMonthlyRow,
  BudgetMonthly,
  BudgetQueryParams,
  BudgetMovementQueryParams,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from './presupuesto';

export { InvoiceIntakeStatus } from './ingreso-factura';
export type {
  InvoiceIntakeStatus as InvoiceIntakeStatusValue,
  InvoiceIntakeOcrItem,
  InvoiceIntakeOcrPayload,
  InvoiceIntakeItem,
  InvoiceIntake,
  InvoiceIntakeQueryParams,
  UploadInvoiceIntakePayload,
  ConfirmInvoiceIntakeItem,
  ConfirmInvoiceIntakePayload,
} from './ingreso-factura';

export type {
  EquipmentUnit,
  EquipmentUnitStatus,
  EquipmentUnitActiveLoan,
  EquipmentUnitQueryParams,
  EquipmentUnitBarcodeResponse,
  CreateEquipmentUnitsPayload,
  UpdateEquipmentUnitPayload,
  UnitReturnCondition,
  ProductType,
  MaintenancePriority,
  IncidentRequestType,
  Category,
  CategoryQueryParams,
  Career,
  CareerQueryParams,
  CreateCareerPayload,
  UpdateCareerPayload,
} from './unidad';

export type {
  Student,
  StudentQueryParams,
  CreateStudentPayload,
  UpdateStudentPayload,
} from './estudiante';

export type {
  MaintenanceType,
  MaintenanceExecutionMode,
  MaintenanceStatus,
  MaintenanceResult,
  MaintenanceDocumentType,
  MaintenanceDocument,
  MaintenanceDocumentQueryParams,
  UploadMaintenanceDocumentPayload,
  MaintenanceRecord,
  MaintenanceRecordQueryParams,
  MaintenanceCareerSummary,
  MaintenanceSummary,
  MaintenanceSummaryQueryParams,
  CreateMaintenanceRecordPayload,
  UpdateMaintenanceRecordPayload,
  FinishMaintenancePayload,
  CancelMaintenancePayload,
} from './mantencion';

export type {
  StoreroomId,
  Storeroom,
  StoreroomQueryParams,
  CreateStoreroomPayload,
  UpdateStoreroomPayload,
  RoleCatalogItem,
} from './panol';

export { AUDIT_ACTIONS, AUDITABLE_TYPES } from './auditoria';
export type { AuditAction, AuditableType, AuditLog, AuditLogQueryParams } from './auditoria';

export { MAX_USER_CHARTS } from './dashboard-personal';
export type {
  ChartTemplate,
  UserChart,
  UserChartQueryParams,
  CreateUserChartPayload,
  UpdateUserChartPayload,
  UserChartPosition,
} from './dashboard-personal';

export {
  PUSH_NOTIFICATION_TYPES,
  parsePushNotificationData,
  pushNotificationLabel,
  pushNotificationTarget,
} from './notificacion';
export type {
  PushNotificationType,
  LoanPushData,
  MaintenancePushData,
  PushNotificationData,
} from './notificacion';
