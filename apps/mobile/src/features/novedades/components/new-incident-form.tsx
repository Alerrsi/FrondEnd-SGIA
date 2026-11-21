import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateIncidentReport, useLocations } from '@sgia/api-client';
import {
  INCIDENT_LOCATION_TYPES,
  INCIDENT_PROBLEM_LABELS,
  type IncidentProblemType,
} from '@sgia/types';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { MultiSelectField } from '@/components/ui/multi-select-field';
import { Section } from '@/components/ui/section';
import { SelectField } from '@/components/ui/select-field';
import { SheetHeader } from '@/components/ui/sheet-header';
import { StateMessage } from '@/components/ui/state-message';
import { TextField } from '@/components/ui/text-field';
import { PhotoField } from '@/features/novedades/components/photo-field';
import { SignaturePad } from '@/features/novedades/components/signature-pad';
import {
  incidentFormSchema,
  initialIncidentValues,
  PROBLEM_TYPES,
  toIncidentPayload,
  type IncidentFormValues,
} from '@/features/novedades/lib/incident-form-schema';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/dates';
import { requestErrorMessage } from '@/lib/request-error';
import { fonts, MAX_CONTENT_WIDTH, spacing } from '@/theme';

const PROBLEM_OPTIONS = PROBLEM_TYPES.map((type) => ({
  value: type,
  label: INCIDENT_PROBLEM_LABELS[type],
}));

interface NewIncidentFormProps {
  onClose: () => void;
}

/** Formulario del informe de novedades del docente. */
export function NewIncidentForm({ onClose }: NewIncidentFormProps) {
  const theme = useTheme();
  const create = useCreateIncidentReport();
  const locations = useLocations({ per_page: 100 });
  const [drawing, setDrawing] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: initialIncidentValues(),
  });

  const problems = useWatch({ control, name: 'problems' });
  const onSubmit = handleSubmit(async (values) => {
    try {
      const report = await create.mutateAsync(toIncidentPayload(values));
      Alert.alert('Informe enviado', `Código: ${report.code ?? `#${report.id}`}`);
      onClose();
    } catch (error) {
      Alert.alert('No se pudo enviar el informe', requestErrorMessage(error));
    }
  });

  const problemsError = errors.problems?.message ?? errors.problems?.root?.message;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.bg }]}>
      <SheetHeader
        title="Nuevo informe"
        onClose={onClose}
        closeLabel="Cancelar informe"
        disabled={create.isPending}
      />

      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          scrollEnabled={!drawing}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Section title="Clase">
            <Field label="Asignatura" required error={errors.subject?.message}>
              <Controller
                control={control}
                name="subject"
                render={({ field }) => (
                  <TextField
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    invalid={Boolean(errors.subject)}
                    maxLength={100}
                    accessibilityLabel="Asignatura"
                    placeholder="Ej. Redes y Comunicaciones II"
                  />
                )}
              />
            </Field>

            <Field label="Fecha" required error={errors.report_date?.message}>
              <Controller
                control={control}
                name="report_date"
                render={({ field }) => (
                  <DateField
                    accessibilityLabel="Fecha del informe"
                    value={field.value}
                    onChange={field.onChange}
                    maximumDate={todayIso()}
                  />
                )}
              />
            </Field>

            <Field label="Laboratorio o pañol" required error={errors.location_id?.message}>
              {locations.isLoading ? (
                <ActivityIndicator style={styles.loader} color={theme.inkMuted} />
              ) : locations.isError ? (
                <StateMessage
                  kind="error"
                  title="No se pudieron cargar las ubicaciones."
                  actionLabel="Reintentar"
                  onAction={() => void locations.refetch()}
                />
              ) : (
                <Controller
                  control={control}
                  name="location_id"
                  render={({ field }) => (
                    <SelectField
                      accessibilityLabel="Laboratorio o pañol"
                      placeholder="Selecciona el laboratorio o pañol"
                      options={(locations.data?.data ?? [])
                        .filter((location) => INCIDENT_LOCATION_TYPES.includes(location.tipo))
                        .map((location) => ({ value: location.id, label: location.nombre }))}
                      value={Number.isNaN(field.value) ? null : field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              )}
            </Field>

            <Field label="Código del equipo (opcional)" error={errors.equipment_code?.message}>
              <Controller
                control={control}
                name="equipment_code"
                render={({ field }) => (
                  <TextField
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    invalid={Boolean(errors.equipment_code)}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={100}
                    accessibilityLabel="Código del equipo"
                    placeholder="EQP-AP-000003"
                    style={styles.code}
                  />
                )}
              />
            </Field>
          </Section>

          <Section title="Problemas">
            <Field label="Qué ocurrió" required error={problemsError}>
              <Controller
                control={control}
                name="problems"
                render={({ field }) => (
                  <MultiSelectField<IncidentProblemType>
                    accessibilityLabel="Problemas"
                    options={PROBLEM_OPTIONS}
                    values={field.value.filter((p) => p.checked).map((p) => p.type)}
                    onChange={(types) =>
                      field.onChange(
                        field.value.map((p) => ({ ...p, checked: types.includes(p.type) })),
                      )
                    }
                  />
                )}
              />
            </Field>

            {problems.map((problem, index) =>
              problem.checked ? (
                <Field
                  key={problem.type}
                  label={INCIDENT_PROBLEM_LABELS[problem.type]}
                  required
                  error={errors.problems?.[index]?.description?.message}
                >
                  <Controller
                    control={control}
                    name={`problems.${index}.description`}
                    render={({ field }) => (
                      <TextField
                        value={field.value}
                        onChangeText={field.onChange}
                        onBlur={field.onBlur}
                        invalid={Boolean(errors.problems?.[index]?.description)}
                        multiline
                        maxLength={1000}
                        accessibilityLabel={`Descripción: ${INCIDENT_PROBLEM_LABELS[problem.type]}`}
                        placeholder="Describe lo ocurrido"
                      />
                    )}
                  />
                </Field>
              ) : null,
            )}

            <Field label="Sugerencia (opcional)" error={errors.suggestion?.message}>
              <Controller
                control={control}
                name="suggestion"
                render={({ field }) => (
                  <TextField
                    value={field.value}
                    onChangeText={field.onChange}
                    onBlur={field.onBlur}
                    multiline
                    maxLength={2000}
                    accessibilityLabel="Sugerencia"
                  />
                )}
              />
            </Field>
          </Section>

          <Section title="Evidencia y firma">
            <Field label="Foto de evidencia (opcional)" error={errors.evidence_photo?.message}>
              <Controller
                control={control}
                name="evidence_photo"
                render={({ field }) => <PhotoField value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label="Firma" required error={errors.signature?.message}>
              <Controller
                control={control}
                name="signature"
                render={({ field }) => (
                  <SignaturePad
                    onChange={field.onChange}
                    onDrawingChange={setDrawing}
                    invalid={Boolean(errors.signature)}
                  />
                )}
              />
            </Field>
          </Section>

          <Button title="Enviar informe" onPress={() => void onSubmit()} loading={create.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
    maxWidth: MAX_CONTENT_WIDTH,
    alignSelf: 'center',
    width: '100%',
  },
  loader: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  // Identificador: Geist Mono (`font-code` del web).
  code: { fontFamily: fonts.code },
});
