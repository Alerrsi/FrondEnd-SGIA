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
import { createLoanRequest, fetchProducts } from '@sgia/api-client';
import type { Producto } from '@sgia/types';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const TIME_BLOCKS = [
  'Bloque 1-2: 08:30 - 10:00',
  'Bloque 3-4: 10:15 - 11:45',
  'Bloque 5-6: 12:00 - 13:30',
  'Bloque 7-8: 14:30 - 16:00',
  'Bloque 9-10: 16:15 - 17:45',
  'Vespertino 1: 18:30 - 20:00',
  'Vespertino 2: 20:15 - 21:45',
];

interface CartItem {
  producto: Producto;
  cantidad: number;
}

export default function NuevaSolicitudScreen() {
  const theme = useTheme();

  // Estados de catálogo y búsqueda
  const [search, setSearch] = useState('');
  const [productos, setProductos] = useState<Producto[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Carrito de solicitud
  const [cart, setCart] = useState<CartItem[]>([]);

  // Datos del formulario
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [loanDate, setLoanDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [timeBlock, setTimeBlock] = useState(TIME_BLOCKS[0]!);
  const [submitting, setSubmitting] = useState(false);

  // Modal de éxito
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [createdLoanCode, setCreatedLoanCode] = useState('');

  // Cargar catálogo de productos
  useEffect(() => {
    let isMounted = true;
    setLoadingCatalog(true);
    fetchProducts({ per_page: 50 })
      .then((res) => {
        if (isMounted) setProductos(res.data);
      })
      .catch(() => {
        // En caso de error de red
      })
      .finally(() => {
        if (isMounted) setLoadingCatalog(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = productos.filter((p) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      p.nombre.toLowerCase().includes(term) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(term)) ||
      (p.categoria && p.categoria.toLowerCase().includes(term))
    );
  });

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
    if (!subject.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor ingresa la Asignatura o Carrera.');
      return;
    }
    if (!room.trim()) {
      Alert.alert('Campo obligatorio', 'Por favor especifica la Sala, Laboratorio o Taller.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await createLoanRequest({
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
      setSubject('');
      setRoom('');
    } catch {
      Alert.alert('Error', 'No se pudo enviar la solicitud. Verifica la conexión con pañol.');
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

          {loadingCatalog ? (
            <ActivityIndicator style={{ paddingVertical: 16 }} color="#d9232a" />
          ) : (
            <View style={styles.productList}>
              {filteredProducts.slice(0, 6).map((prod) => {
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
            <ThemedText type="small">Asignatura o Taller *</ThemedText>
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
            <ThemedText type="small">Fecha Requerida (AAAA-MM-DD) *</ThemedText>
            <TextInput
              value={loanDate}
              onChangeText={setLoanDate}
              placeholder="AAAA-MM-DD"
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
            <ThemedText type="small">Bloque Horario *</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.blockScroll}>
              {TIME_BLOCKS.map((block) => {
                const isSelected = timeBlock === block;
                return (
                  <Pressable
                    key={block}
                    onPress={() => setTimeBlock(block)}
                    style={[
                      styles.blockChip,
                      isSelected && styles.blockChipSelected,
                      { borderColor: theme.backgroundElement },
                    ]}
                  >
                    <ThemedText
                      type="code"
                      style={[styles.blockChipText, isSelected && styles.blockChipTextSelected]}
                    >
                      {block}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
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
              el estado en la pestaña "Mis Préstamos".
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
  blockScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  blockChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  blockChipSelected: {
    backgroundColor: '#d9232a',
    borderColor: '#d9232a',
  },
  blockChipText: {
    fontSize: 11,
  },
  blockChipTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
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
