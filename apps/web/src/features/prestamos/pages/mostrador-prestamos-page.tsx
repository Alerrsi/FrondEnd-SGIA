import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Barcode,
  CheckCircle2,
  Clock,
  History,
  Layers,
  Minus,
  Plus,
  Search,
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import {
  useCheckinLoan,
  useCheckoutLoan,
  useLoans,
  useProducts,
  useUsers,
} from '@sgia/api-client';
import { LoanStatus, type Prestamo, type Producto } from '@sgia/types';

import { Badge, LoanStatusBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorToMessage } from '@/lib/api-error';
import { playScannerBeep } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';

interface ScannedCheckoutItem {
  producto: Producto;
  barcode: string;
  cantidad: number;
}

export default function MostradorPrestamosPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'checkout' | 'checkin'>('checkout');

  // --- CHECKOUT STATE ---
  const [docenteRun, setDocenteRun] = useState('');
  const [docenteName, setDocenteName] = useState('');
  const [subject, setSubject] = useState('');
  const [room, setRoom] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedItems, setScannedItems] = useState<ScannedCheckoutItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Queries
  const { data: productsData } = useProducts({ per_page: 100 });
  const products = productsData?.data ?? [];

  const { data: usersData } = useUsers({ role: 'PRO-01' });
  const teachers = usersData?.data ?? [];

  const checkoutMutation = useCheckoutLoan();
  const checkinMutation = useCheckinLoan();

  // --- CHECKIN STATE ---
  const [checkinSearch, setCheckinSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Prestamo | null>(null);
  const [itemConditions, setItemConditions] = useState<
    Record<number, { condition: 'bueno' | 'regular' | 'dañado'; damaged: boolean; notes: string }>
  >({});
  const [generalCheckinNotes, setGeneralCheckinNotes] = useState('');

  // Préstamos activos para devolución
  const { data: activeLoansData, refetch: refetchActiveLoans } = useLoans({
    estado: LoanStatus.ACTIVO,
    per_page: 50,
  });
  const activeLoans = activeLoansData?.data ?? [];

  // Auto-foco continuo en modo escáner
  useEffect(() => {
    if (activeTab === 'checkout') {
      barcodeInputRef.current?.focus();
    }
  }, [activeTab]);

  // Manejo de escáner USB/Bluetooth (Enter al final del código)
  const handleBarcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      processBarcodeScanned(barcodeInput.trim());
    }
  };

  const processBarcodeScanned = (rawCode: string) => {
    if (!rawCode) return;

    // Buscar en productos por código de barras o SKU
    const foundProduct = products.find(
      (p) =>
        (p.codigoBarras && p.codigoBarras.toLowerCase() === rawCode.toLowerCase()) ||
        String(p.id) === rawCode,
    );

    if (!foundProduct) {
      if (soundEnabled) playScannerBeep('error');
      toast.error(`Código no identificado en inventario: ${rawCode}`);
      setBarcodeInput('');
      return;
    }

    if (foundProduct.stock <= 0) {
      if (soundEnabled) playScannerBeep('warn');
      toast.warning(`Stock agotado en pañol para ${foundProduct.nombre}`);
    }

    // Agregar o incrementar en scannedItems
    setScannedItems((prev) => {
      const idx = prev.findIndex((item) => item.producto.id === foundProduct.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx]!, cantidad: next[idx]!.cantidad + 1 };
        return next;
      }
      return [
        ...prev,
        {
          producto: foundProduct,
          barcode: rawCode,
          cantidad: 1,
        },
      ];
    });

    if (soundEnabled) playScannerBeep('success');
    toast.success(`Ítem agregado: ${foundProduct.nombre}`);
    setBarcodeInput('');
  };

  const handleUpdateQty = (productId: number, delta: number) => {
    setScannedItems((prev) =>
      prev
        .map((it) => {
          if (it.producto.id === productId) {
            const nextQty = it.cantidad + delta;
            return nextQty > 0 ? { ...it, cantidad: nextQty } : null;
          }
          return it;
        })
        .filter(Boolean) as ScannedCheckoutItem[],
    );
  };

  const handleRemoveItem = (productId: number) => {
    setScannedItems((prev) => prev.filter((it) => it.producto.id !== productId));
  };

  const handleConfirmCheckout = async () => {
    if (!docenteRun.trim()) {
      toast.error('Debes indicar el RUN o credencial del docente solicitante.');
      return;
    }
    if (scannedItems.length === 0) {
      toast.error('No hay insumos escaneados en la lista de préstamo.');
      return;
    }

    try {
      const payload = {
        docente_run: docenteRun.trim(),
        credential_code: docenteRun.trim(),
        subject: subject.trim() || undefined,
        room: room.trim() || undefined,
        items: scannedItems.map((it) => ({
          barcode: it.barcode,
          product_id: it.producto.id,
          quantity: it.cantidad,
        })),
        notes: docenteName.trim() ? `Docente: ${docenteName.trim()}` : undefined,
      };

      const res = await checkoutMutation.mutateAsync(payload);
      toast.success(
        `Préstamo #${res.codigo ?? res.id} registrado y entregado correctamente en mesón`,
      );

      // Limpiar formulario para el siguiente turno
      setDocenteRun('');
      setDocenteName('');
      setSubject('');
      setRoom('');
      setScannedItems([]);
      setBarcodeInput('');
      barcodeInputRef.current?.focus();
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  // Checkin selection
  const handleSelectLoanForCheckin = (loan: Prestamo) => {
    setSelectedLoan(loan);
    const initialConditions: Record<
      number,
      { condition: 'bueno' | 'regular' | 'dañado'; damaged: boolean; notes: string }
    > = {};
    loan.items.forEach((it) => {
      initialConditions[it.productoId] = {
        condition: 'bueno',
        damaged: false,
        notes: '',
      };
    });
    setItemConditions(initialConditions);
  };

  const handleConfirmCheckin = async () => {
    if (!selectedLoan) return;

    try {
      const itemsPayload = selectedLoan.items.map((it) => {
        const cond = itemConditions[it.productoId] || {
          condition: 'bueno',
          damaged: false,
          notes: '',
        };
        return {
          product_id: it.productoId,
          productoId: it.productoId,
          condition: cond.condition,
          damaged: cond.damaged,
          notes: cond.notes || undefined,
        };
      });

      await checkinMutation.mutateAsync({
        loan_id: selectedLoan.id,
        items: itemsPayload,
        general_notes: generalCheckinNotes || undefined,
      });

      toast.success(
        `Devolución de préstamo #${selectedLoan.codigo ?? selectedLoan.id} completada e ingresada al stock`,
      );
      setSelectedLoan(null);
      setCheckinSearch('');
      setGeneralCheckinNotes('');
      refetchActiveLoans();
    } catch (err) {
      toast.error(apiErrorToMessage(err));
    }
  };

  const filteredActiveLoans = activeLoans.filter((loan) => {
    if (!checkinSearch.trim()) return true;
    const term = checkinSearch.toLowerCase().trim();
    const name = (loan.solicitanteNombre || '').toLowerCase();
    const run = (loan.solicitanteRun || '').toLowerCase();
    const code = (loan.codigo || '').toLowerCase();
    const itemsMatch = loan.items.some(
      (it) =>
        (it.codigoBarras && it.codigoBarras.toLowerCase().includes(term)) ||
        (it.nombre && it.nombre.toLowerCase().includes(term)),
    );
    return name.includes(term) || run.includes(term) || code.includes(term) || itemsMatch;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header técnico con miga de pan */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-red-600 dark:text-red-400">
            <span className="h-1.5 w-1.5 rounded-full bg-red-600 dark:bg-red-500 animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-zinc-400 text-xs font-mono">/</span>
          <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Operatoria de Mesón
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              Mostrador de Pañol: Préstamos Presenciales y Devoluciones
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Atención ágil de mesón con lector de códigos Code128, control de credencial docente y restitución de stock.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/prestamos/cola')}
              className="text-xs gap-1.5"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Cola Remota</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/prestamos/historial')}
              className="text-xs gap-1.5"
            >
              <History className="h-3.5 w-3.5" />
              <span>Historial Auditoría</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Principales: Checkout vs Devolución */}
      <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-2">
        <Button
          type="button"
          variant={activeTab === 'checkout' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('checkout')}
          className="text-xs gap-1.5"
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
          <span>Préstamo Presencial Directo (Entrega)</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === 'checkin' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('checkin')}
          className="text-xs gap-1.5"
        >
          <ArrowDownLeft className="h-3.5 w-3.5" />
          <span>Devolución y Recepción (Check-in)</span>
        </Button>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar lector' : 'Activar sonido de escáner'}
            aria-label={soundEnabled ? 'Silenciar lector' : 'Activar sonido de escáner'}
            className={cn(
              'flex items-center gap-1.5 rounded px-2 py-1 text-xs font-mono transition-colors border',
              soundEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700',
            )}
          >
            <Volume2 className="h-3.5 w-3.5" />
            <span>Audio {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'checkout' ? (
        /* ======================== TAB CHECKOUT ======================== */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Columna Izquierda: Datos del Docente y Escáner */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Card className="flex flex-col gap-3 p-4 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                1. Credencial del Docente
              </span>

              <div className="flex flex-col gap-2">
                <div>
                  <label
                    htmlFor="docente_run"
                    className="font-mono text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    RUN / Credencial Docente <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="docente_run"
                      type="text"
                      value={docenteRun}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocenteRun(val);
                        // Autocompletar nombre si coincide con docente en lista
                        const matched = teachers.find(
                          (t) => (t as any).run === val || (t as any).rut === val,
                        );
                        if (matched) setDocenteName(matched.nombre);
                      }}
                      placeholder="12.345.678-9 o escanear credencial"
                      className="h-8.5 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-2.5 pl-8 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="docente_nombre"
                    className="font-mono text-xs text-zinc-700 dark:text-zinc-300"
                  >
                    Nombre del Docente
                  </label>
                  <input
                    id="docente_nombre"
                    type="text"
                    value={docenteName}
                    onChange={(e) => setDocenteName(e.target.value)}
                    placeholder="Ej. Profesor Carlos Rivera"
                    className="mt-1 h-8.5 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-2.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="subject" className="font-mono text-[11px] text-zinc-500">
                      Asignatura
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Redes CCNA"
                      className="mt-1 h-8 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="room" className="font-mono text-[11px] text-zinc-500">
                      Sala / Taller
                    </label>
                    <input
                      id="room"
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="Lab 201"
                      className="mt-1 h-8 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Captura de Escáner Code128 */}
            <Card className="flex flex-col gap-2 p-4 border-2 border-red-500/30 bg-red-500/5 dark:bg-red-500/10 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  2. Entrada Lector Code128
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-red-100 dark:bg-red-900/40 px-1.5 py-0.5 font-mono text-[10px] text-red-700 dark:text-red-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-600 animate-pulse" />
                  Auto-foco
                </span>
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                Pistola lectora opera como teclado estándar USB/Bluetooth terminado en [Enter].
              </p>

              <div className="relative mt-1">
                <Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Dispara con pistola o escribe SKU + Enter…"
                  aria-label="Código de barras"
                  className="h-10 w-full rounded-md border-2 border-zinc-300 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-950 px-3 pl-9 font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:font-normal placeholder:text-zinc-400 focus:border-red-600 dark:focus:border-red-500 focus:outline-none"
                />
              </div>
            </Card>
          </div>

          {/* Columna Derecha: Tabla de Ítems Escaneados y Confirmación */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Ítems Agregados al Préstamo
                  </span>
                  <Badge tone="neutral">{scannedItems.length} distintos</Badge>
                  <span className="font-mono text-xs text-zinc-500 tabular-nums">
                    ({scannedItems.reduce((acc, it) => acc + it.cantidad, 0)} unidades totales)
                  </span>
                </div>

                {scannedItems.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScannedItems([])}
                    className="h-7 text-xs text-zinc-400 hover:text-rose-600"
                  >
                    Limpiar lista
                  </Button>
                )}
              </div>

              {scannedItems.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-zinc-400 flex flex-col items-center gap-2">
                  <Barcode className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                  <span>No hay ítems escaneados aún.</span>
                  <span className="text-[11px] text-zinc-400">
                    Apunta la pistola lectora a las etiquetas de los productos o ingresa su SKU en el campo de escaneo.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-mono">
                    <thead className="bg-zinc-50/90 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">
                      <tr>
                        <th className="px-3.5 py-2">Código / SKU</th>
                        <th className="px-3.5 py-2">Producto</th>
                        <th className="px-3.5 py-2">Ubicación</th>
                        <th className="px-3.5 py-2 text-center">Cantidad</th>
                        <th className="px-3.5 py-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {scannedItems.map((item) => (
                        <tr
                          key={item.producto.id}
                          className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
                        >
                          <td className="px-3.5 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">
                            {item.barcode}
                          </td>
                          <td className="px-3.5 py-2.5 font-sans font-medium text-zinc-800 dark:text-zinc-200">
                            {item.producto.nombre}
                          </td>
                          <td className="px-3.5 py-2.5 text-zinc-500 text-[11px]">
                            {item.producto.ubicacion
                              ? `${item.producto.ubicacion.sala} · ${item.producto.ubicacion.cajon}`
                              : 'Pañol'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-950 p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.producto.id, -1)}
                                className="h-5 w-5 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <Minus className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                              </button>
                              <span className="w-6 text-center tabular-nums font-semibold">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.producto.id, 1)}
                                className="h-5 w-5 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-800"
                              >
                                <Plus className="h-3 w-3 text-zinc-600 dark:text-zinc-400" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.producto.id)}
                              className="text-zinc-400 hover:text-rose-600 p-1"
                              title="Quitar ítem"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Botón Culminante de Despacho */}
              <div className="flex items-center justify-between border-t border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="text-xs font-mono text-zinc-500">
                  {docenteRun ? `Docente: ${docenteName || docenteRun}` : 'Falta credencial'}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleConfirmCheckout}
                  disabled={checkoutMutation.isPending || scannedItems.length === 0 || !docenteRun.trim()}
                  className="gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Registrar Entrega de Préstamo</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ======================== TAB CHECKIN / DEVOLUCION ======================== */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Columna Izquierda: Búsqueda de Préstamo Activo */}
          <div className="flex flex-col gap-3 lg:col-span-1">
            <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 shadow-xs">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-500">
                Buscar Préstamo Activo
              </span>
              <div className="relative mt-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                <input
                  type="search"
                  value={checkinSearch}
                  onChange={(e) => setCheckinSearch(e.target.value)}
                  placeholder="Docente, RUN o Código..."
                  className="h-8.5 w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 px-3 pl-8.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Lista de préstamos activos */}
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              {filteredActiveLoans.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded">
                  No se encontraron préstamos activos.
                </div>
              ) : (
                filteredActiveLoans.map((loan) => {
                  const isSelected = selectedLoan?.id === loan.id;
                  return (
                    <Card
                      key={loan.id}
                      onClick={() => handleSelectLoanForCheckin(loan)}
                      className={cn(
                        'cursor-pointer border p-3 transition-colors',
                        isSelected
                          ? 'border-red-600 bg-red-50/10 dark:border-red-500 dark:bg-red-950/20'
                          : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                          {loan.codigo ?? `#${loan.id}`}
                        </span>
                        <LoanStatusBadge estado={loan.estado} />
                      </div>
                      <p className="mt-1 font-sans text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {loan.solicitanteNombre}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                        <span>{loan.items.length} ítems</span>
                        <span>{loan.sala || 'Mesón'}</span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Verificación y Reintegro de Ítems */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            {!selectedLoan ? (
              <div className="rounded-md border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 p-16 text-center text-xs font-mono text-zinc-400 flex flex-col items-center gap-2">
                <ArrowDownLeft className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                <span>Selecciona un préstamo activo del panel izquierdo para recepcionar insumos.</span>
              </div>
            ) : (
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
                      Recepcionando Préstamo {selectedLoan.codigo ?? `#${selectedLoan.id}`}
                    </span>
                    <span className="text-xs text-zinc-500">
                      Docente: {selectedLoan.solicitanteNombre}{' '}
                      {selectedLoan.solicitanteRun ? `(${selectedLoan.solicitanteRun})` : ''}
                    </span>
                  </div>
                  <LoanStatusBadge estado={selectedLoan.estado} />
                </div>

                {/* Lista de Ítems a devolver */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400">
                    Verificación de Estado por Ítem
                  </span>

                  <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded">
                    {selectedLoan.items.map((it) => {
                      const cond = itemConditions[it.productoId] || {
                        condition: 'bueno',
                        damaged: false,
                        notes: '',
                      };

                      return (
                        <div
                          key={it.productoId}
                          className="flex flex-col gap-2 p-3 text-xs bg-white dark:bg-zinc-900"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-sans font-medium text-zinc-800 dark:text-zinc-200">
                                {it.nombre || `Producto #${it.productoId}`}
                              </span>
                              <span className="font-mono text-[10px] text-zinc-400">
                                SKU: {it.codigoBarras || '—'} · Cantidad: {it.cantidad}
                              </span>
                            </div>

                            {/* Selector de Condición */}
                            <div className="flex items-center gap-1 text-[11px] font-mono">
                              <button
                                type="button"
                                onClick={() =>
                                  setItemConditions((prev) => ({
                                    ...prev,
                                    [it.productoId]: {
                                      ...cond,
                                      condition: 'bueno',
                                      damaged: false,
                                    },
                                  }))
                                }
                                className={cn(
                                  'px-2 py-0.5 rounded border transition-colors',
                                  cond.condition === 'bueno'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 font-semibold'
                                    : 'text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50',
                                )}
                              >
                                Buen estado
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  setItemConditions((prev) => ({
                                    ...prev,
                                    [it.productoId]: {
                                      ...cond,
                                      condition: 'dañado',
                                      damaged: true,
                                    },
                                  }))
                                }
                                className={cn(
                                  'px-2 py-0.5 rounded border transition-colors',
                                  cond.condition === 'dañado'
                                    ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 font-semibold'
                                    : 'text-zinc-500 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50',
                                )}
                              >
                                Reportar daño / falla
                              </button>
                            </div>
                          </div>

                          {cond.damaged && (
                            <div className="mt-1 flex flex-col gap-1">
                              <label className="text-[11px] font-mono text-rose-600 dark:text-rose-400">
                                Detalle de daño o novedad para pañol:
                              </label>
                              <input
                                type="text"
                                value={cond.notes}
                                onChange={(e) =>
                                  setItemConditions((prev) => ({
                                    ...prev,
                                    [it.productoId]: {
                                      ...cond,
                                      notes: e.target.value,
                                    },
                                  }))
                                }
                                placeholder="Ej. Cable cortado, fusible quemado, punta de prueba faltante…"
                                className="h-7 w-full rounded border border-rose-300 dark:border-rose-700 bg-rose-50/20 px-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                    Observaciones generales de recepción
                  </label>
                  <textarea
                    rows={2}
                    value={generalCheckinNotes}
                    onChange={(e) => setGeneralCheckinNotes(e.target.value)}
                    placeholder="Comentarios adicionales opcionales..."
                    className="mt-1 w-full rounded border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 p-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-400 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLoan(null)}
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleConfirmCheckin}
                    disabled={checkinMutation.isPending}
                    className="gap-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Completar Devolución e Ingresar a Pañol</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
