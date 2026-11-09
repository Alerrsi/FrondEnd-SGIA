import {
  INCIDENT_PROBLEM_LABELS,
  type CreateIncidentReportPayload,
  type IncidentProblemType,
} from '@sgia/types';
import { z } from 'zod';

import {
  MAX_PHOTO_BYTES,
  PHOTO_MIME_TYPES,
  type EvidencePhoto,
} from '@/features/novedades/lib/evidence-photo';
import { todayIso } from '@/lib/dates';

export const PROBLEM_TYPES = Object.keys(INCIDENT_PROBLEM_LABELS) as IncidentProblemType[];

/** Validación de UX del informe (§13 de `ENDPOINTS.md`); el backend sigue siendo la fuente de verdad. */
export const incidentFormSchema = z.object({
  subject: z.string().trim().min(1, 'Indica la asignatura.').max(100, 'Máximo 100 caracteres.'),
  report_date: z
    .string()
    .min(1, 'Indica la fecha del informe.')
    .refine((value) => value <= todayIso(), 'La fecha no puede ser futura.'),
  location_id: z
    .number({ error: 'Selecciona el laboratorio.' })
    .int()
    .positive('Selecciona el laboratorio.'),
  problems: z
    .array(
      z.object({
        type: z.enum(PROBLEM_TYPES as [IncidentProblemType, ...IncidentProblemType[]]),
        checked: z.boolean(),
        description: z.string(),
      }),
    )
    .superRefine((problems, context) => {
      // Va dentro del arreglo para que se evalúe aunque otros campos fallen.
      if (!problems.some((problem) => problem.checked)) {
        context.addIssue({ code: 'custom', message: 'Selecciona al menos un problema.' });
      }
      problems.forEach((problem, index) => {
        if (!problem.checked) return;
        if (!problem.description.trim()) {
          context.addIssue({
            code: 'custom',
            path: [index, 'description'],
            message: 'Describe el problema seleccionado.',
          });
        } else if (problem.description.length > 1000) {
          context.addIssue({
            code: 'custom',
            path: [index, 'description'],
            message: 'Máximo 1000 caracteres.',
          });
        }
      });
    }),
  suggestion: z.string().max(2000, 'Máximo 2000 caracteres.'),
  equipment_code: z.string().max(100, 'Máximo 100 caracteres.'),
  signature: z.string().min(1, 'Falta la firma.'),
  evidence_photo: z
    .custom<EvidencePhoto | null>()
    .refine((photo) => !photo || PHOTO_MIME_TYPES.includes(photo.type), 'La foto debe ser jpg, png o webp.')
    .refine(
      (photo) => !photo || (photo.size ?? 0) <= MAX_PHOTO_BYTES,
      'La foto no puede superar los 10 MB.',
    ),
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
  const photo = values.evidence_photo;
  return {
    subject: values.subject.trim(),
    report_date: values.report_date,
    location_id: values.location_id,
    problems: values.problems
      .filter((problem) => problem.checked)
      .map((problem) => ({ type: problem.type, description: problem.description.trim() })),
    suggestion: values.suggestion.trim() || undefined,
    signature: values.signature,
    evidence_photo: photo ? (photo.file ?? { uri: photo.uri, name: photo.name, type: photo.type }) : undefined,
    equipment_code: values.equipment_code.trim() || undefined,
  };
}
