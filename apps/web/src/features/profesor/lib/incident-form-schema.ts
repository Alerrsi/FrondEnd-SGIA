import { z } from 'zod';
import {
  INCIDENT_PROBLEM_LABELS,
  type CreateIncidentReportPayload,
  type IncidentProblemType,
} from '@sgia/types';

import { todayIso } from '@/features/profesor/lib/dates';

export const PROBLEM_TYPES = Object.keys(INCIDENT_PROBLEM_LABELS) as IncidentProblemType[];

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export { todayIso };

/**
 * Validación de UX del informe de novedades (§13 de ENDPOINTS.md). El backend sigue siendo la
 * fuente de verdad.
 */
export const incidentFormSchema = z
  .object({
    subject: z.string().trim().min(1, 'Indica el nombre de la asignatura.').max(100, 'Máximo 100 caracteres.'),
    report_date: z
      .string()
      .min(1, 'Indica la fecha del informe.')
      .refine((v) => v <= todayIso(), 'La fecha no puede ser futura.'),
    location_id: z
      .number({ error: 'Selecciona el laboratorio.' })
      .int()
      .positive('Selecciona el laboratorio.'),
    problems: z.array(
      z.object({
        type: z.enum(PROBLEM_TYPES as [IncidentProblemType, ...IncidentProblemType[]]),
        checked: z.boolean(),
        description: z.string(),
      }),
    ).superRefine((problems, ctx) => {
      // Va dentro del arreglo para que se evalúe aunque otros campos del formulario fallen.
      if (!problems.some((p) => p.checked)) {
        ctx.addIssue({ code: 'custom', message: 'Marca al menos un tipo de problema.' });
      }
      problems.forEach((p, index) => {
        if (p.checked && p.description.length > 1000) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'description'],
            message: 'Máximo 1000 caracteres.',
          });
        }
        if (p.checked && !p.description.trim()) {
          ctx.addIssue({
            code: 'custom',
            path: [index, 'description'],
            message: 'Describe el problema marcado.',
          });
        }
      });
    }),
    suggestion: z.string().max(2000, 'Máximo 2000 caracteres.').optional(),
    equipment_code: z.string().optional(),
    signature: z.string().min(1, 'Falta la firma del docente.'),
    evidence_photo: z
      .custom<File | null>()
      .nullable()
      .refine((f) => !f || PHOTO_MIME_TYPES.includes(f.type), 'La foto debe ser jpg, png o webp.')
      .refine((f) => !f || f.size <= MAX_PHOTO_BYTES, 'La foto no puede superar los 10 MB.'),
  });

export type IncidentFormValues = z.infer<typeof incidentFormSchema>;

export function initialIncidentValues(): IncidentFormValues {
  return {
    subject: '',
    report_date: todayIso(),
    location_id: Number.NaN,
    problems: PROBLEM_TYPES.map((type) => ({ type, checked: false, description: '' })),
    suggestion: '',
    equipment_code: '',
    signature: '',
    evidence_photo: null,
  };
}

export function toIncidentPayload(values: IncidentFormValues): CreateIncidentReportPayload {
  return {
    subject: values.subject.trim(),
    report_date: values.report_date,
    location_id: values.location_id,
    problems: values.problems
      .filter((p) => p.checked)
      .map((p) => ({ type: p.type, description: p.description.trim() })),
    suggestion: values.suggestion?.trim() || undefined,
    signature: values.signature,
    evidence_photo: values.evidence_photo ?? undefined,
    equipment_code: values.equipment_code?.trim() || undefined,
  };
}
