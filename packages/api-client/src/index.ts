export { configureApiClient, ApiRequestError } from './http';
export type { ApiClientOptions, TokenStorage } from './http';
export { login, logout, fetchCurrentUser } from './services/auth';
export type { LoginPayload } from './services/auth';

export { productKeys, useProducts, useProduct, useCreateProducto } from './hooks/products';
export { loanKeys, useLoans, useLoan, useCreatePrestamo, useAprobarPrestamo, useRechazarPrestamo } from './hooks/loans';
export { quotationKeys, useCotizaciones, useCreateCotizacion } from './hooks/quotations';
export { userKeys, useUsers, useUser, useCreateUsuario, useUpdateUsuario, useToggleUsuarioActivo } from './hooks/users';
export { equipmentKeys, useEquipos, useEquipo, useCreateNovedad } from './hooks/equipments';
export { createSgiaQueryClient } from './query-client';

export * as productsApi from './services/products';
export * as loansApi from './services/loans';
export * as quotationsApi from './services/quotations';
export * as usersApi from './services/users';
export * as equipmentsApi from './services/equipments';