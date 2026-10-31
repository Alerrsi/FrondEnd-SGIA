import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CareerQueryParams,
  CreateCareerPayload,
  CreateEquipmentUnitsPayload,
  EquipmentUnitQueryParams,
  EquipmentUnitStatus,
  UpdateCareerPayload,
  UpdateEquipmentUnitPayload,
} from '@sgia/types';
import {
  createCareer,
  createProductUnits,
  deleteCareer,
  deleteEquipmentUnit,
  fetchCareer,
  fetchCareers,
  fetchEquipmentUnit,
  fetchEquipmentUnitBarcode,
  fetchEquipmentUnitByCode,
  fetchEquipmentUnits,
  fetchProductUnits,
  updateCareer,
  updateEquipmentUnit,
  updateEquipmentUnitStatus,
} from '../services/units';

export const unitKeys = {
  all: ['equipment-units'] as const,
  list: (params?: EquipmentUnitQueryParams) => ['equipment-units', 'list', params] as const,
  byProduct: (productId: number, params?: object) =>
    ['equipment-units', 'product', productId, params] as const,
  detail: (id: number) => ['equipment-units', 'detail', id] as const,
  byCode: (code: string) => ['equipment-units', 'code', code] as const,
  barcode: (id: number) => ['equipment-units', 'barcode', id] as const,
};

export const careerKeys = {
  all: ['careers'] as const,
  list: (params?: CareerQueryParams) => ['careers', 'list', params] as const,
  detail: (id: number) => ['careers', 'detail', id] as const,
};

export function useProductUnits(
  productId: number | undefined,
  params?: Omit<EquipmentUnitQueryParams, 'product_id'>,
) {
  return useQuery({
    queryKey: unitKeys.byProduct(productId!, params),
    queryFn: () => fetchProductUnits(productId!, params),
    enabled: productId !== undefined,
    placeholderData: keepPreviousData,
  });
}

export function useEquipmentUnits(params?: EquipmentUnitQueryParams) {
  return useQuery({
    queryKey: unitKeys.list(params),
    queryFn: () => fetchEquipmentUnits(params),
    placeholderData: keepPreviousData,
  });
}

export function useEquipmentUnit(id: number | undefined) {
  return useQuery({
    queryKey: unitKeys.detail(id!),
    queryFn: () => fetchEquipmentUnit(id!),
    enabled: id !== undefined,
  });
}

export function useEquipmentUnitByCode(code: string | undefined) {
  return useQuery({
    queryKey: unitKeys.byCode(code!),
    queryFn: () => fetchEquipmentUnitByCode(code!),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useEquipmentUnitBarcode(id: number | undefined) {
  return useQuery({
    queryKey: unitKeys.barcode(id!),
    queryFn: () => fetchEquipmentUnitBarcode(id!),
    enabled: id !== undefined,
  });
}

function useInvalidateUnits() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: unitKeys.all });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };
}

export function useCreateProductUnits() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({ productId, payload }: { productId: number; payload: CreateEquipmentUnitsPayload }) =>
      createProductUnits(productId, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEquipmentUnit() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateEquipmentUnitPayload }) =>
      updateEquipmentUnit(id, payload),
    onSuccess: invalidate,
  });
}

export function useUpdateEquipmentUnitStatus() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: EquipmentUnitStatus }) =>
      updateEquipmentUnitStatus(id, status),
    onSuccess: invalidate,
  });
}

export function useDeleteEquipmentUnit() {
  const invalidate = useInvalidateUnits();
  return useMutation({
    mutationFn: (id: number) => deleteEquipmentUnit(id),
    onSuccess: invalidate,
  });
}

export function useCareers(params?: CareerQueryParams) {
  return useQuery({
    queryKey: careerKeys.list(params),
    queryFn: () => fetchCareers(params),
    placeholderData: keepPreviousData,
  });
}

export function useCareer(id: number | undefined) {
  return useQuery({
    queryKey: careerKeys.detail(id!),
    queryFn: () => fetchCareer(id!),
    enabled: id !== undefined,
  });
}

export function useCreateCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCareerPayload) => createCareer(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: careerKeys.all }),
  });
}

export function useUpdateCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCareerPayload }) =>
      updateCareer(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: careerKeys.all }),
  });
}

export function useDeleteCareer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteCareer(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: careerKeys.all }),
  });
}
