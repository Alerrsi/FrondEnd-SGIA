import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Check, Minus, Plus, Search } from 'lucide-react-native';
import { ActivityIndicator, Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import {
  createLoanRequest,
  fetchCareers,
  useLocations,
  useProducts,
  useStorerooms,
} from '@sgia/api-client';
import type { Career, Producto } from '@sgia/types';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { CodeChip } from '@/components/ui/code-chip';
import { DateField } from '@/components/ui/date-field';
import { Field } from '@/components/ui/field';
import { Row } from '@/components/ui/row';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Section } from '@/components/ui/section';
import { SelectField } from '@/components/ui/select-field';
import { StateMessage } from '@/components/ui/state-message';
import { TextField } from '@/components/ui/text-field';
import { useAuth } from '@/features/auth/auth-context';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/dates';
import { requestErrorMessage } from '@/lib/request-error';
import { radius, scrim, spacing, TOUCH } from '@/theme';

const TIME_BLOCKS = [
  { label: 'Bloque 1-2: 08:30 - 10:00', start: '08:30', end: '10:00' },
  { label: 'Bloque 3-4: 10:15 - 11:45', start: '10:15', end: '11:45' },
  { label: 'Bloque 5-6: 12:00 - 13:30', start: '12:00', end: '13:30' },
  { label: 'Bloque 7-8: 14:30 - 16:00', start: '14:30', end: '16:00' },
  { label: 'Bloque 9-10: 16:15 - 17:45', start: '16:15', end: '17:45' },
  { label: 'Vespertino 1: 18:30 - 20:00', start: '18:30', end: '20:00' },
  { label: 'Vespertino 2: 20:15 - 21:45', start: '20:15', end: '21:45' },
];

const TIME_BLOCK_OPTIONS = TIME_BLOCKS.map((block) => ({ value: block.label, label: block.label }));

const CATALOG_PAGE_SIZE = 6;

interface CartItem {
  producto: Producto;
  cantidad: number;
  /** Existencias al agregarlo y el pañol al que corresponden. */
  disponible: number;
  storeroomId: number;
}

export default function NuevaSolicitudScreen() {
  const theme = useTheme();
  const { user } = useAuth();

  // Pañol a solicitar: define las existencias del catálogo y los laboratorios
  const [storeroomId, setStoreroomId] = useState<number | null>(
    user?.storeroom_id != null ? Number(user.storeroom_id) : null,
  );
  const storerooms = useStorerooms({ per_page: 100 });
  const storeroomName = storerooms.data?.data.find((s) => Number(s.id) === storeroomId)?.name;
  const locations = useLocations({ storeroom_id: storeroomId ?? undefined, per_page: 100 });
  // Solo salas y talleres del pañol elegido; el filtro descarta también la lista del pañol anterior.
  const laboratorios = (locations.data?.data ?? []).filter(
    (l) =>
      Number(l.storeroom_id) === storeroomId && (l.tipo === 'sala' || l.tipo === 'taller'),
  );

  // Estados de catálogo y búsqueda
  // Búsqueda que llega desde Inicio (`/solicitar?q=…&t=…`). La pantalla sigue montada entre pestañas:
  // cada búsqueda nueva trae otro `t` y reemplaza a la escrita.
  const params = useLocalSearchParams<{ q?: string; t?: string }>();
  const [search, setSearch] = useState(params.q ?? '');
  const [lastSearchKey, setLastSearchKey] = useState(params.t);
  if (params.t !== lastSearchKey) {
    setLastSearchKey(params.t);
    if (params.q) setSearch(params.q);
  }
  const debouncedSearch = useDebouncedValue(search.trim());
  const catalog = useProducts({
    search: debouncedSearch || undefined,
    is_active: true,
    storeroom_id: storeroomId ?? undefined,
    per_page: CATALOG_PAGE_SIZE,
  });
  const productos = catalog.data?.data ?? [];
  const totalProductos = catalog.data?.meta.total ?? 0;
  // Mientras se recarga, `data` aún trae las existencias del pañol o la búsqueda anterior.
  const catalogoActualizado = storeroomId !== null && !catalog.isPlaceholderData;
  const existenciasDe = (producto: Producto) =>
    producto.available_in_storeroom ?? producto.stock ?? 0;

  // Carrito de solicitud
  const [cart, setCart] = useState<CartItem[]>([]);

  // Datos del formulario
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [careerId, setCareerId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [locationId, setLocationId] = useState<number | null>(null);
  const [loanDate, setLoanDate] = useState(todayIso);
  const [timeBlock, setTimeBlock] = useState(TIME_BLOCKS[0]!.label);
  const [submitting, setSubmitting] = useState(false);

  // Modal de éxito
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdLoanCode, setCreatedLoanCode] = useState('');

  // Cargar carreras: el backend exige `career_id` en toda solicitud
  useEffect(() => {
    let isMounted = true;
    fetchCareers({ per_page: 100 })
      .then((res) => {
        if (isMounted) setCareers(res.data);
      })
      .catch(() => {
        // Sin carreras se muestra el aviso en el formulario
      })
      .finally(() => {
        if (isMounted) setLoadingCareers(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleStoreroomChange = (id: number) => {
    setStoreroomId(id);
    // El laboratorio elegido pertenece al pañol anterior.
    setLocationId(null);
  };

  /** Existencias del ítem en el pañol elegido, o `null` si aún no se conocen para ese pañol. */
  const existenciasEnCarrito = (item: CartItem): number | null => {
    const enCatalogo = catalogoActualizado
      ? productos.find((p) => p.id === item.producto.id)
      : undefined;
    if (enCatalogo) return existenciasDe(enCatalogo);
    return item.storeroomId === storeroomId ? item.disponible : null;
  };

  const addToCart = (prod: Producto) => {
    if (storeroomId === null) return;
    const disponible = existenciasDe(prod);
    setCart((prev) => {
      const existing = prev.find((it) => it.producto.id === prod.id);
      if (existing) {
        return prev.map((it) =>
          it.producto.id === prod.id
            ? {
                ...it,
                cantidad: Math.min(it.cantidad + 1, disponible),
                disponible,
                storeroomId,
              }
            : it,
        );
      }
      return [...prev, { producto: prod, cantidad: 1, disponible, storeroomId }];
    });
  };

  const updateCartQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((it) => {
          if (it.producto.id === id) {
            const next = it.cantidad + delta;
            return next > 0 ? { ...it, cantidad: next } : null;
          }
          return it;
        })
        .filter(Boolean) as CartItem[],
    );
  };

  const handleSendRequest = async () => {
    if (cart.length === 0) {
      Alert.alert('Faltan productos', 'Agrega al menos 1 producto o herramienta a la solicitud.');
      return;
    }
    if (storeroomId === null) {
      Alert.alert('Campo obligatorio', 'Por favor selecciona el Pañol a solicitar.');
      return;
    }
    const sinExistencias = cart.filter((it) => {
      const disponible = existenciasEnCarrito(it);
      return disponible !== null && it.cantidad > disponible;
    });
    if (sinExistencias.length > 0) {
      Alert.alert(
        'Existencias insuficientes',
        `Ajusta la cantidad de: ${sinExistencias.map((it) => it.producto.nombre).join(', ')}.`,
      );
      return;
    }
    if (careerId === null) {
      Alert.alert('Campo obligatorio', 'Por favor selecciona la Carrera.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa la Asignatura.');
      return;
    }
    if (locationId === null) {
      Alert.alert('Campo obligatorio', 'Por favor selecciona el Laboratorio.');
      return;
    }
    const bloque = TIME_BLOCKS.find((block) => block.label === timeBlock) ?? TIME_BLOCKS[0]!;

    try {
      setSubmitting(true);
      const res = await createLoanRequest({
        career_id: careerId,
        subject: subject.trim(),
        storeroom_id: storeroomId,
        location_id: locationId,
        loan_date: loanDate,
        start_time: bloque.start,
        end_time: bloque.end,
        items: cart.map((it) => ({
          product_id: it.producto.id,
          quantity: it.cantidad,
        })),
      });

      setCreatedLoanCode(res.codigo ?? `PRS-${res.id}`);
      setSuccessModalVisible(true);

      // Limpiar formulario
      setCart([]);
      setCareerId(null);
      setSubject('');
      setLocationId(null);
    } catch (error) {
      Alert.alert('No se pudo enviar la solicitud', requestErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Screen>
        <ScreenHeader
          title="Solicitar equipo"
          description="Pre-reserva de insumos y equipos para tus clases prácticas."
        />

        {/* 1. Pañol que prepara la solicitud */}
        <Section title="Pañol" description="Define las existencias del catálogo y los laboratorios.">
          <Field label="Pañol a solicitar" required>
            {storerooms.isLoading ? (
              <ActivityIndicator style={styles.inlineLoader} color={theme.inkMuted} />
            ) : storerooms.isError ? (
              <StateMessage
                kind="error"
                title="No se pudieron cargar los pañoles."
                actionLabel="Reintentar"
                onAction={() => void storerooms.refetch()}
              />
            ) : (
              <SelectField
                accessibilityLabel="Pañol a solicitar"
                placeholder="Selecciona el pañol"
                options={(storerooms.data?.data ?? []).map((storeroom) => ({
                  value: Number(storeroom.id),
                  label: storeroom.name,
                }))}
                value={storeroomId}
                onChange={handleStoreroomChange}
              />
            )}
          </Field>
        </Section>

        {/* 2. Catálogo */}
        <Section title="Equipos e insumos" flush>
          <View style={styles.searchBox}>
            {storeroomId === null && (
              <ThemedText variant="secondary">
                Elige un pañol para ver sus existencias y agregar productos.
              </ThemedText>
            )}
            <View>
              <TextField
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar multímetro, router, cable UTP…"
                accessibilityLabel="Buscar en el catálogo"
                returnKeyType="search"
                style={styles.searchInput}
              />
              <Search size={16} color={theme.inkMuted} style={styles.searchIcon} aria-hidden />
            </View>
          </View>

          {catalog.isLoading ? (
            <StateMessage kind="loading" />
          ) : catalog.isError ? (
            <StateMessage
              kind="error"
              title="No se pudo cargar el catálogo."
              description="Revisa tu conexión e inténtalo de nuevo."
              actionLabel="Reintentar"
              onAction={() => void catalog.refetch()}
            />
          ) : productos.length === 0 ? (
            <StateMessage kind="empty" title="Sin resultados" description="No hay productos que coincidan con tu búsqueda." />
          ) : (
            <View>
              {productos.map((prod, index) => {
                const inCart = cart.find((it) => it.producto.id === prod.id);
                const disponible = existenciasDe(prod);
                const sinStock = catalogoActualizado && disponible <= 0;
                const alTope = catalogoActualizado && inCart && inCart.cantidad >= disponible;
                const puedeAgregar = catalogoActualizado && !sinStock && !alTope;
                return (
                  <Row key={prod.id} divider={index > 0}>
                    <View style={styles.rowText}>
                      <ThemedText variant="bodyMedium">{prod.nombre}</ThemedText>
                      <CodeChip code={prod.codigoBarras || 'Sin SKU'} />
                      {storeroomId !== null && (
                        <ThemedText variant="secondary" style={styles.tabular}>
                          {catalogoActualizado
                            ? `Existencias en ${storeroomName ?? 'el pañol'}: ${disponible}`
                            : 'Actualizando existencias…'}
                        </ThemedText>
                      )}
                    </View>
                    <Button
                      title={sinStock ? 'Sin stock' : inCart ? `Agregado (${inCart.cantidad})` : 'Agregar'}
                      variant="secondary"
                      size="sm"
                      onPress={() => addToCart(prod)}
                      disabled={!puedeAgregar}
                      accessibilityHint={`Agrega ${prod.nombre} a la solicitud`}
                      icon={(color) =>
                        inCart ? <Check size={14} color={color} aria-hidden /> : sinStock ? null : <Plus size={14} color={color} aria-hidden />
                      }
                    />
                  </Row>
                );
              })}
              {totalProductos > productos.length && (
                <ThemedText variant="secondary" style={styles.more}>
                  Mostrando {productos.length} de {totalProductos}. Escribe para buscar el resto.
                </ThemedText>
              )}
            </View>
          )}
        </Section>

        {/* 3. Carrito */}
        {cart.length > 0 && (
          <Section
            title={`En tu solicitud (${cart.length})`}
            flush
            action={<Button title="Vaciar" variant="ghost" size="sm" onPress={() => setCart([])} />}
          >
            {cart.map((item, index) => {
              const { producto, cantidad } = item;
              const disponible = existenciasEnCarrito(item);
              const excede = disponible !== null && cantidad > disponible;
              const alTope = disponible !== null && cantidad >= disponible;
              return (
                <Row key={producto.id} divider={index > 0}>
                  <View style={styles.rowText}>
                    <ThemedText variant="bodyMedium">{producto.nombre}</ThemedText>
                    <ThemedText variant="secondary" tone={excede ? 'danger' : undefined} style={styles.tabular}>
                      {disponible === null
                        ? 'Existencias por confirmar con este pañol'
                        : excede
                          ? `Solo hay ${disponible} en este pañol`
                          : `Existencias: ${disponible}`}
                    </ThemedText>
                  </View>

                  <View style={[styles.stepper, { borderColor: theme.line }]}>
                    <Pressable
                      onPress={() => updateCartQty(producto.id, -1)}
                      accessibilityRole="button"
                      accessibilityLabel={`Quitar una unidad de ${producto.nombre}`}
                      style={({ pressed }) => [styles.stepBtn, pressed && { backgroundColor: theme.surfaceAlt }]}
                    >
                      <Minus size={16} color={theme.ink} aria-hidden />
                    </Pressable>
                    <ThemedText variant="bodyMedium" style={[styles.qty, styles.tabular]}>
                      {cantidad}
                    </ThemedText>
                    <Pressable
                      onPress={() => updateCartQty(producto.id, 1)}
                      disabled={alTope}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: alTope }}
                      accessibilityLabel={`Agregar una unidad de ${producto.nombre}`}
                      style={({ pressed }) => [
                        styles.stepBtn,
                        pressed && { backgroundColor: theme.surfaceAlt },
                        alTope && styles.disabled,
                      ]}
                    >
                      <Plus size={16} color={theme.ink} aria-hidden />
                    </Pressable>
                  </View>
                </Row>
              );
            })}
          </Section>
        )}

        {/* 4. Clase y horario */}
        <Section title="Clase y horario">
          <Field label="Carrera" required>
            {loadingCareers ? (
              <ActivityIndicator style={styles.inlineLoader} color={theme.inkMuted} />
            ) : careers.length === 0 ? (
              <ThemedText variant="secondary" tone="danger">
                No se pudieron cargar las carreras. Vuelve a abrir la pantalla para reintentar.
              </ThemedText>
            ) : (
              <SelectField
                accessibilityLabel="Carrera"
                placeholder="Selecciona la carrera"
                options={careers.map((career) => ({ value: career.id, label: career.name }))}
                value={careerId}
                onChange={setCareerId}
              />
            )}
          </Field>

          <Field label="Asignatura" required>
            <TextField
              value={subject}
              onChangeText={setSubject}
              placeholder="Ej. Redes y Comunicaciones II"
              accessibilityLabel="Asignatura"
            />
          </Field>

          <Field label="Laboratorio" required>
            {storeroomId === null ? (
              <ThemedText variant="secondary">Elige primero el pañol.</ThemedText>
            ) : locations.isError ? (
              <StateMessage
                kind="error"
                title="No se pudieron cargar los laboratorios."
                actionLabel="Reintentar"
                onAction={() => void locations.refetch()}
              />
            ) : locations.isLoading || locations.isPlaceholderData ? (
              <ActivityIndicator style={styles.inlineLoader} color={theme.inkMuted} />
            ) : laboratorios.length === 0 ? (
              <ThemedText variant="secondary">Este pañol no tiene laboratorios registrados.</ThemedText>
            ) : (
              <SelectField
                accessibilityLabel="Laboratorio"
                placeholder="Selecciona el laboratorio"
                options={laboratorios.map((lab) => ({ value: lab.id, label: lab.nombre }))}
                value={locationId}
                onChange={setLocationId}
              />
            )}
          </Field>

          <Field label="Fecha requerida" required>
            <DateField
              accessibilityLabel="Fecha requerida"
              value={loanDate}
              onChange={setLoanDate}
              minimumDate={todayIso()}
            />
          </Field>

          <Field label="Bloque horario" required>
            <SelectField
              accessibilityLabel="Bloque horario"
              options={TIME_BLOCK_OPTIONS}
              value={timeBlock}
              onChange={setTimeBlock}
            />
          </Field>
        </Section>

        <Button title="Enviar solicitud al pañol" onPress={handleSendRequest} loading={submitting} />
      </Screen>

      {/* Confirmación */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={[styles.overlay, { backgroundColor: scrim }]}>
          <View
            accessibilityViewIsModal
            style={[styles.dialog, { backgroundColor: theme.surface, borderColor: theme.line }]}
          >
            <View style={[styles.successIcon, { backgroundColor: theme.okBg }]}>
              <Check size={24} color={theme.ok} aria-hidden />
            </View>
            <ThemedText variant="section" accessibilityRole="header" style={styles.center}>
              Solicitud enviada
            </ThemedText>
            <CodeChip code={createdLoanCode} />
            <ThemedText variant="secondary" style={styles.center}>
              El pañolero preparará los insumos antes de tu bloque horario. Sigue el estado en «Mis
              préstamos».
            </ThemedText>
            <Button title="Entendido" onPress={() => setSuccessModalVisible(false)} style={styles.full} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  inlineLoader: { alignSelf: 'flex-start', paddingVertical: spacing.sm },
  searchBox: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  // El icono de búsqueda va dentro del campo, a la izquierda.
  searchInput: { paddingHorizontal: 0, paddingLeft: spacing.xxl + spacing.xs, paddingRight: spacing.md },
  searchIcon: { position: 'absolute', left: spacing.md, top: (TOUCH - 16) / 2 },
  rowText: { flex: 1, gap: spacing.xs },
  tabular: { fontVariant: ['tabular-nums'] },
  more: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.full,
    overflow: 'hidden',
  },
  stepBtn: { width: TOUCH, height: TOUCH, alignItems: 'center', justifyContent: 'center' },
  qty: { minWidth: 20, textAlign: 'center' },
  disabled: { opacity: 0.4 },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  dialog: {
    width: '100%',
    maxWidth: 360,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    boxShadow: '0 8px 24px rgba(19, 18, 16, 0.18)',
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  full: { alignSelf: 'stretch', marginTop: spacing.xs },
});
