import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ApiRequestError,
  apiErrorToMessage,
  createLoanRequest,
  fetchCareers,
  useProducts,
} from '@sgia/api-client';
import type { Career, Producto } from '@sgia/types';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DateField } from '@/components/ui/date-field';
import { SelectField } from '@/components/ui/select-field';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { todayIso } from '@/lib/dates';

const TIME_BLOCKS = [
  'Bloque 1-2: 08:30 - 10:00',
  'Bloque 3-4: 10:15 - 11:45',
  'Bloque 5-6: 12:00 - 13:30',
  'Bloque 7-8: 14:30 - 16:00',
  'Bloque 9-10: 16:15 - 17:45',
  'Vespertino 1: 18:30 - 20:00',
  'Vespertino 2: 20:15 - 21:45',
];

const TIME_BLOCK_OPTIONS = TIME_BLOCKS.map((block) => ({ value: block, label: block }));

const CATALOG_PAGE_SIZE = 6;

function sendErrorMessage(error: unknown): string {
  if (!(error instanceof ApiRequestError)) {
    return 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';
  }
  if (error.status >= 500) {
    return 'El servidor tuvo un problema. Inténtalo de nuevo en unos minutos.';
  }
  return apiErrorToMessage(error);
}

interface CartItem {
  producto: Producto;
  cantidad: number;
}

export default function NuevaSolicitudScreen() {
  const theme = useTheme();

  // Estados de catálogo y búsqueda
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const catalog = useProducts({
    search: debouncedSearch || undefined,
    per_page: CATALOG_PAGE_SIZE,
  });
  const productos = catalog.data?.data ?? [];
  const totalProductos = catalog.data?.meta.total ?? 0;

  // Carrito de solicitud
  const [cart, setCart] = useState<CartItem[]>([]);

  // Datos del formulario
  const [careers, setCareers] = useState<Career[]>([]);
  const [loadingCareers, setLoadingCareers] = useState(true);
  const [careerId, setCareerId] = useState<number | null>(null);
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [loanDate, setLoanDate] = useState(todayIso);
  const [timeBlock, setTimeBlock] = useState(TIME_BLOCKS[0]!);
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

  const addToCart = (prod: Producto) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.producto.id === prod.id);
      if (existing) {
        return prev.map((it) =>
          it.producto.id === prod.id ? { ...it, cantidad: it.cantidad + 1 } : it,
        );
      }
      return [...prev, { producto: prod, cantidad: 1 }];
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
    if (careerId === null) {
      Alert.alert('Campo obligatorio', 'Por favor selecciona la Carrera.');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa la Asignatura.');
      return;
    }
    if (!room.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor especifica la Sala, Laboratorio o Taller.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createLoanRequest({
        career_id: careerId,
        subject: subject.trim(),
        room: room.trim(),
        loan_date: loanDate,
        time_block: timeBlock,
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
      setRoom('');
    } catch (error) {
      Alert.alert('No se pudo enviar la solicitud', sendErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <ScrollView
        contentContainerStyle={[styles.contentContainer, { paddingBottom: BottomTabInset + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabecera institucional */}
        <ThemedView style={styles.header}>
          <View style={styles.badgeRow}>
            <View style={styles.indicatorDot} />
            <ThemedText type="code" style={styles.institutionTag}>
              INACAP SEDE TEMUCO · PAÑOL TI
            </ThemedText>
          </View>
          <ThemedText type="title" style={styles.mainTitle}>
            Solicitud de Préstamo
          </ThemedText>
          <ThemedText style={styles.subtitle} themeColor="textSecondary">
            Pre-reserva remota de insumos y equipos para clases prácticas.
          </ThemedText>
        </ThemedView>

        {/* Sección 1: Búsqueda y Selección de Catálogo */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            1. SELECCIONAR EQUIPOS O INSUMOS
          </ThemedText>

          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar multímetro, router, cable UTP…"
            placeholderTextColor="#888"
            style={[
              styles.input,
              {
                color: theme.text,
                borderColor: theme.backgroundElement,
                backgroundColor: theme.background,
              },
            ]}
          />

          {catalog.isLoading ? (
            <ActivityIndicator style={{ paddingVertical: 16 }} color="#d9232a" />
          ) : catalog.isError ? (
            <ThemedText type="small" themeColor="textSecondary">
              No se pudo cargar el catálogo. Revisa tu conexión e inténtalo de nuevo.
            </ThemedText>
          ) : productos.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No hay productos que coincidan con tu búsqueda.
            </ThemedText>
          ) : (
            <View style={styles.productList}>
              {productos.map((prod) => {
                const inCart = cart.find((it) => it.producto.id === prod.id);
                return (
                  <View
                    key={prod.id}
                    style={[styles.productRow, { borderColor: theme.backgroundElement }]}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <ThemedText type="default" style={styles.productName}>
                        {prod.nombre}
                      </ThemedText>
                      <ThemedText type="code" style={styles.productMeta}>
                        SKU: {prod.codigoBarras || 'N/A'} · Stock: {prod.stock}
                      </ThemedText>
                    </View>

                    <Pressable
                      onPress={() => addToCart(prod)}
                      style={({ pressed }) => [
                        styles.addButton,
                        pressed && { opacity: 0.8 },
                        inCart && styles.addButtonActive,
                      ]}
                    >
                      <ThemedText style={styles.addButtonText}>
                        {inCart ? `+ (${inCart.cantidad})` : '+ Agregar'}
                      </ThemedText>
                    </Pressable>
                  </View>
                );
              })}
              {totalProductos > productos.length && (
                <ThemedText type="small" themeColor="textSecondary">
                  Mostrando {productos.length} de {totalProductos}. Escribe para buscar el resto.
                </ThemedText>
              )}
            </View>
          )}
        </ThemedView>

        {/* Sección 2: Carrito de ítems seleccionados */}
        {cart.length > 0 && (
          <ThemedView type="backgroundElement" style={styles.sectionCard}>
            <View style={styles.cartHeader}>
              <ThemedText type="smallBold" style={styles.sectionTitle}>
                2. ÍTEMS EN TU SOLICITUD ({cart.length})
              </ThemedText>
              <Pressable onPress={() => setCart([])}>
                <ThemedText type="code" style={{ color: '#d9232a' }}>
                  Vaciar
                </ThemedText>
              </Pressable>
            </View>

            {cart.map(({ producto, cantidad }) => (
              <View
                key={producto.id}
                style={[styles.cartRow, { borderColor: theme.backgroundElement }]}
              >
                <ThemedText style={{ flex: 1 }} type="default">
                  {producto.nombre}
                </ThemedText>

                <View style={styles.qtyControls}>
                  <Pressable
                    onPress={() => updateCartQty(producto.id, -1)}
                    style={styles.qtyBtn}
                  >
                    <ThemedText type="smallBold">-</ThemedText>
                  </Pressable>
                  <ThemedText type="code" style={styles.qtyText}>
                    {cantidad}
                  </ThemedText>
                  <Pressable
                    onPress={() => updateCartQty(producto.id, 1)}
                    style={styles.qtyBtn}
                  >
                    <ThemedText type="smallBold">+</ThemedText>
                  </Pressable>
                </View>
              </View>
            ))}
          </ThemedView>
        )}

        {/* Sección 3: Datos de Clase y Taller */}
        <ThemedView type="backgroundElement" style={styles.sectionCard}>
          <ThemedText type="smallBold" style={styles.sectionTitle}>
            3. DATOS DE AULA Y HORARIO
          </ThemedText>

          <View style={styles.formGroup}>
            <ThemedText type="small">Carrera *</ThemedText>
            {loadingCareers ? (
              <ActivityIndicator style={{ paddingVertical: 8 }} color="#d9232a" />
            ) : careers.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">
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
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="small">Asignatura *</ThemedText>
            <TextInput
              value={subject}
              onChangeText={setSubject}
              placeholder="Ej. Redes y Comunicaciones II"
              placeholderTextColor="#888"
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.backgroundElement,
                  backgroundColor: theme.background,
                },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="small">Sala, Laboratorio o Taller *</ThemedText>
            <TextInput
              value={room}
              onChangeText={setRoom}
              placeholder="Ej. Laboratorio 302 / Taller Telecom"
              placeholderTextColor="#888"
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderColor: theme.backgroundElement,
                  backgroundColor: theme.background,
                },
              ]}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="small">Fecha Requerida *</ThemedText>
            <DateField
              accessibilityLabel="Fecha requerida"
              value={loanDate}
              onChange={setLoanDate}
              minimumDate={todayIso()}
            />
          </View>

          <View style={styles.formGroup}>
            <ThemedText type="small">Bloque Horario *</ThemedText>
            <SelectField
              accessibilityLabel="Bloque horario"
              options={TIME_BLOCK_OPTIONS}
              value={timeBlock}
              onChange={setTimeBlock}
            />
          </View>
        </ThemedView>

        {/* Botón Principal Culminante */}
        <Pressable
          onPress={handleSendRequest}
          disabled={submitting}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && { opacity: 0.85 },
            submitting && { opacity: 0.6 },
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <ThemedText style={styles.submitButtonText}>
              Enviar Solicitud a Pañol
            </ThemedText>
          )}
        </Pressable>
      </ScrollView>

      {/* Modal de Éxito / Confirmación */}
      <Modal visible={successModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.successIconWrapper}>
              <ThemedText style={styles.successCheck}>✓</ThemedText>
            </View>

            <ThemedText type="subtitle" style={styles.modalTitle}>
              Solicitud Enviada
            </ThemedText>

            <ThemedText type="code" style={styles.loanCodeBadge}>
              Código: {createdLoanCode}
            </ThemedText>

            <ThemedText style={styles.modalMessage} themeColor="textSecondary">
              El pañolero preparará los insumos antes del inicio de tu bloque horario. Puedes seguir
              el estado en la pestaña &quot;Mis Préstamos&quot;.
            </ThemedText>

            <Pressable
              onPress={() => setSuccessModalVisible(false)}
              style={styles.modalButton}
            >
              <ThemedText style={styles.modalButtonText}>Entendido</ThemedText>
            </Pressable>
          </ThemedView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    paddingTop: Spacing.three,
    gap: Spacing.one,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#d9232a',
  },
  institutionTag: {
    fontSize: 10,
    color: '#d9232a',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  sectionCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#888',
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  productList: {
    gap: 8,
    marginTop: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600',
  },
  productMeta: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonActive: {
    backgroundColor: '#fee2e2',
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#d9232a',
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 13,
    minWidth: 16,
    textAlign: 'center',
  },
  formGroup: {
    gap: 4,
  },
  submitButton: {
    backgroundColor: '#d9232a',
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  successIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCheck: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  loanCodeBadge: {
    fontSize: 13,
    fontWeight: '700',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalMessage: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  modalButton: {
    backgroundColor: '#d9232a',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
