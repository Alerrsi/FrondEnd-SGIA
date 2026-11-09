import { zodResolver } from '@hookform/resolvers/zod';
import { useCreateIncidentReport, useLocations } from '@sgia/api-client';
import {
  INCIDENT_LOCATION_TYPES,
  INCIDENT_PROBLEM_LABELS,
  type IncidentProblemType,
} from '@sgia/types';
import { useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { DateField } from '@/components/ui/date-field';
import { MultiSelectField } from '@/components/ui/multi-select-field';
import { SelectField } from '@/components/ui/select-field';
import { MaxContentWidth, Spacing } from '@/constants/theme';
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

const PROBLEM_OPTIONS = PROBLEM_TYPES.map((type) => ({
  value: type,
  label: INCIDENT_PROBLEM_LABELS[type],
}));

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <ThemedText style={styles.error}>{message}</ThemedText>;
}

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
  const inputStyle = [
    styles.input,
    {
      color: theme.text,
      borderColor: theme.backgroundSelected,
      backgroundColor: theme.background,
    },
  ];

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <ThemedText type="subtitle" style={styles.title}>
          Nuevo informe
        </ThemedText>
        <Pressable
          onPress={onClose}
          disabled={create.isPending}
          accessibilityRole="button"
          hitSlop={8}
        >
          <ThemedText type="small" themeColor="textSecondary">
            Cancelar
          </ThemedText>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.safeArea}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          scrollEnabled={!drawing}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={styles.group}>
            <ThemedText type="small">Asignatura *</ThemedText>
            <Controller
              control={control}
              name="subject"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  maxLength={100}
                  accessibilityLabel="Asignatura"
                  placeholder="Ej. Redes y Comunicaciones II"
                  placeholderTextColor="#888"
                  style={inputStyle}
                />
              )}
            />
            <FieldError message={errors.subject?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Fecha *</ThemedText>
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
            <FieldError message={errors.report_date?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Laboratorio o pañol *</ThemedText>
            {locations.isLoading ? (
              <ActivityIndicator style={styles.loader} />
            ) : locations.isError ? (
              <Pressable onPress={() => void locations.refetch()} accessibilityRole="button">
                <ThemedText type="small" themeColor="textSecondary">
                  No se pudieron cargar las ubicaciones. Toca para reintentar.
                </ThemedText>
              </Pressable>
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
            <FieldError message={errors.location_id?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Código del equipo (opcional)</ThemedText>
            <Controller
              control={control}
              name="equipment_code"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={100}
                  accessibilityLabel="Código del equipo"
                  placeholder="EQP-AP-000003"
                  placeholderTextColor="#888"
                  style={[...inputStyle, { fontFamily: 'monospace' }]}
                />
              )}
            />
            <FieldError message={errors.equipment_code?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Problemas *</ThemedText>
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
            <FieldError message={problemsError} />
          </View>

          {problems.map((problem, index) =>
            problem.checked ? (
              <View key={problem.type} style={styles.group}>
                <ThemedText type="small">{INCIDENT_PROBLEM_LABELS[problem.type]} *</ThemedText>
                <Controller
                  control={control}
                  name={`problems.${index}.description`}
                  render={({ field }) => (
                    <TextInput
                      value={field.value}
                      onChangeText={field.onChange}
                      onBlur={field.onBlur}
                      multiline
                      maxLength={1000}
                      accessibilityLabel={`Descripción: ${INCIDENT_PROBLEM_LABELS[problem.type]}`}
                      placeholder="Describe lo ocurrido"
                      placeholderTextColor="#888"
                      style={[...inputStyle, styles.multiline]}
                    />
                  )}
                />
                <FieldError message={errors.problems?.[index]?.description?.message} />
              </View>
            ) : null,
          )}

          <View style={styles.group}>
            <ThemedText type="small">Sugerencia (opcional)</ThemedText>
            <Controller
              control={control}
              name="suggestion"
              render={({ field }) => (
                <TextInput
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                  multiline
                  maxLength={2000}
                  accessibilityLabel="Sugerencia"
                  placeholderTextColor="#888"
                  style={[...inputStyle, styles.multiline]}
                />
              )}
            />
            <FieldError message={errors.suggestion?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Foto de evidencia (opcional)</ThemedText>
            <Controller
              control={control}
              name="evidence_photo"
              render={({ field }) => <PhotoField value={field.value} onChange={field.onChange} />}
            />
            <FieldError message={errors.evidence_photo?.message} />
          </View>

          <View style={styles.group}>
            <ThemedText type="small">Firma *</ThemedText>
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
            <FieldError message={errors.signature?.message} />
          </View>

          <Pressable
            onPress={() => void onSubmit()}
            disabled={create.isPending}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.submit,
              { backgroundColor: theme.text },
              (pressed || create.isPending) && styles.submitMuted,
            ]}
          >
            {create.isPending ? (
              <ActivityIndicator color={theme.background} />
            ) : (
              <ThemedText style={[styles.submitText, { color: theme.background }]}>
                Enviar informe
              </ThemedText>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.three,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  group: {
    gap: 4,
  },
  input: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  multiline: {
    minHeight: 76,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  loader: {
    paddingVertical: 8,
  },
  error: {
    fontSize: 11,
    lineHeight: 16,
    color: '#b91c1c',
  },
  submit: {
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitMuted: {
    opacity: 0.7,
  },
  submitText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
