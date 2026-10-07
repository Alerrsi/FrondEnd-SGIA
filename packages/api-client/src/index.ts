export {
  configureApiClient,
  getApiClientOptions,
  ApiRequestError,
  del,
  get,
  getBlob,
  patch,
  post,
  put,
} from './http';
export type { ApiClientOptions, TokenStorage } from './http';

export {
  login,
  logout,
  logoutAll,
  fetchCurrentUser,
  changePassword,
  fetchTokens,
  revokeToken,
  revokeOtherTokens,
  revokeAllTokens,
  normalizeUser,
} from './services/auth';
export type { LoginPayload, ChangePasswordPayload, ApiTokenInfo } from './services/auth';
export { authKeys, useCurrentUser, useLogin, useLogout } from './hooks/auth';

export {
  fetchProducts,
  fetchProduct,
  createProducto,
  updateProducto,
  deleteProducto,
  setProductoActivo,
  fetchProductLocation,
  updateProductLocation,
  fetchProductBarcode,
  extractFactura,
  fetchCriticalStockAlerts,
  resolveStockAlert,
  normalizeProducto,
  normalizeUbicacion,
} from './services/products';
export {
  productKeys,
  useProducts,
  useProduct,
  useProductBarcode,
  useProductLocation,
  useUpdateProductLocation,
  useCreateProducto,
  useUpdateProducto,
  useDeleteProducto,
  useToggleProductoActivo,
  useScanInvoice,
  alertKeys,
  useCriticalStockAlerts,
  useResolveStockAlert,
} from './hooks/products';

export {
  fetchLocations,
  fetchLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  fetchCajones,
  fetchCajon,
  createCajon,
  updateCajon,
  deleteCajon,
} from './services/locations';
export {
  locationKeys,
  cajonKeys,
  useLocations,
  useLocation,
  useCreateLocation,
  useUpdateLocation,
  useDeleteLocation,
  useCajones,
  useCajon,
  useCreateCajon,
  useUpdateCajon,
  useDeleteCajon,
} from './hooks/locations';

export {
  fetchLoans,
  fetchLoan,
  fetchPendingLoans,
  createLoanRequest,
  createPrestamo,
  fetchMyLoanRequests,
  cancelLoanRequest,
  approveLoan,
  approbarPrestamo,
  rejectLoan,
  rechazarPrestamo,
  checkoutLoan,
  checkinLoan,
  exportLoans,
  normalizePrestamo,
} from './services/loans';
export {
  loanKeys,
  useLoans,
  usePendingLoans,
  useMyLoanRequests,
  useLoan,
  useCreatePrestamo,
  useCreateLoanRequest,
  useCancelLoanRequest,
  useAprobarPrestamo,
  useRechazarPrestamo,
  useCheckoutLoan,
  useCheckinLoan,
  useExportLoans,
} from './hooks/loans';

export {
  fetchQuotations,
  fetchQuotation,
  createCotizacion,
  fetchSuppliers,
  fetchSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  setSupplierStatus,
  fetchPurchases,
  fetchPurchase,
  createPurchase,
  updatePurchaseStatus,
} from './services/quotations';
export {
  quotationKeys,
  supplierKeys,
  purchaseKeys,
  useCotizaciones,
  useCotizacion,
  useCreateCotizacion,
  useSuppliers,
  useSupplier,
  usePurchases,
} from './hooks/quotations';

export {
  fetchUsers,
  fetchUser,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  setUsuarioActivo,
} from './services/users';
export {
  userKeys,
  useUsers,
  useUser,
  useCreateUsuario,
  useUpdateUsuario,
  useToggleUsuarioActivo,
  useDeleteUsuario,
} from './hooks/users';

export {
  fetchEquipmentSpecs,
  updateEquipmentSpecs,
  fetchEquipmentTechnicalSheet,
  fetchEquipmentReports,
  fetchEquipos,
  fetchEquipo,
  createIncidentReport,
  createNovedad,
  fetchIncidentReports,
  updateIncidentReportStatus,
  fetchDashboardStats,
  fetchTopProducts,
  fetchTopSupplies,
  fetchCareersDistribution,
  fetchLeastDemanded,
  fetchTopTeachers,
  fetchLoansByTeacher,
} from './services/equipments';
export {
  equipmentKeys,
  incidentKeys,
  dashboardKeys,
  useEquipos,
  useEquipo,
  useEquipmentSpecs,
  useUpdateEquipmentSpecs,
  useEquipmentTechnicalSheet,
  useEquipmentReports,
  useDownloadTechnicalSheet,
  useDownloadEquipmentReports,
  useCreateNovedad,
  useIncidentReports,
  useUpdateIncidentReportStatus,
  useDashboardStats,
  useTopProducts,
  useTopSupplies,
  useCareersDistribution,
  useLeastDemanded,
  useTopTeachers,
  useLoansByTeacher,
} from './hooks/equipments';

export { createSgiaQueryClient } from './query-client';

export * as authApi from './services/auth';
export * as productsApi from './services/products';
export * as loansApi from './services/loans';
export * as quotationsApi from './services/quotations';
export * as usersApi from './services/users';
export * as equipmentsApi from './services/equipments';
