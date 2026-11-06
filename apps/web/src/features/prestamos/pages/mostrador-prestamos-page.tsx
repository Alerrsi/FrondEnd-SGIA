import { useCallback, useEffect, useRef, useState } from 'react';
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
import { StudentLookup } from '@/features/estudiantes/components/student-lookup';
import {
  studentBorrowerLabel,
  studentBorrowerPayload,
  type StudentBorrower,
} from '@/features/estudiantes/lib/student-borrower';
import { CareerSelect } from '@/components/shared/career-select';
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
  const [borrowerMode, setBorrowerMode] = useState<'docente' | 'estudiante'>('docente');
  const [studentBorrower, setStudentBorrower] = useState<StudentBorrower | null>(null);
  const handleStudentChange = useCallback((b: StudentBorrower | null) => setStudentBorrower(b), []);
  const [docenteRun, setDocenteRun] = useState('');
  const [docenteName, setDocenteName] = useState('');
  const [subject, setSubject] = useState('');
  const [careerId, setCareerId] = useState<number | undefined>(undefined);
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
    if (borrowerMode === 'docente' && !docenteRun.trim()) {
      toast.error('Debes indicar el RUN o credencial del docente solicitante.');
      return;
    }
    if (borrowerMode === 'estudiante' && !studentBorrower) {
      toast.error('Busca al estudiante por su RUT antes de registrar la entrega.');
      return;
    }
    if (!careerId) {
      toast.error('Selecciona la carrera del préstamo.');
      return;
    }
    if (scannedItems.length === 0) {
      toast.error('No hay insumos escaneados en la lista de préstamo.');
      return;
    }

    try {
      const borrowerFields =
        borrowerMode === 'estudiante' && studentBorrower
          ? studentBorrowerPayload(studentBorrower)
          : { docente_run: docenteRun.trim(), credential_code: docenteRun.trim() };
      const payload = {
        ...borrowerFields,
        subject: subject.trim() || undefined,
        career_id: careerId,
        room: room.trim() || undefined,
        items: scannedItems.map((it) => ({
          barcode: it.barcode,
          product_id: it.producto.id,
          quantity: it.cantidad,
        })),
        notes:
          borrowerMode === 'docente' && docenteName.trim()
            ? `Docente: ${docenteName.trim()}`
            : undefined,
      };

      const res = await checkoutMutation.mutateAsync(payload);
      toast.success(
        `Préstamo #${res.codigo ?? res.id} registrado y entregado correctamente en mesón`,
      );

      // Limpiar formulario para el siguiente turno
      setDocenteRun('');
      setDocenteName('');
      setStudentBorrower(null);
      setSubject('');
      setCareerId(undefined);
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
          <span data-sede-badge="true" className="sede-badge inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-brand-soft px-2 py-0.5 text-xs font-mono font-medium text-brand-strong">
            <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
            SEDE TEMUCO · PAÑOL TI
          </span>
          <span className="text-text-muted text-xs font-mono">/</span>
          <span className="font-mono text-xs text-text-muted uppercase tracking-wider">
            Operatoria de Mesón
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-text flex items-center gap-2">
              <Layers aria-hidden="true" className="h-5 w-5 text-text" />
              Mostrador de Pañol: Préstamos Presenciales y Devoluciones
            </h1>
            <p className="text-xs text-text-muted">
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
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Cola Remota</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => navigate('/prestamos/historial')}
              className="text-xs gap-1.5"
            >
              <History aria-hidden="true" className="h-3.5 w-3.5" />
              <span>Historial Auditoría</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs Principales: Checkout vs Devolución */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Button
          type="button"
          variant={activeTab === 'checkout' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('checkout')}
          className="text-xs gap-1.5"
        >
          <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Préstamo Presencial Directo (Entrega)</span>
        </Button>
        <Button
          type="button"
          variant={activeTab === 'checkin' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('checkin')}
          className="text-xs gap-1.5"
        >
          <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5" />
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
                ? 'bg-ok-bg text-ok border-ok/30'
                : 'bg-surface-raised text-text-muted border-border',
            )}
          >
            <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Audio {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {activeTab === 'checkout' ? (
        /* ======================== TAB CHECKOUT ======================== */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Columna Izquierda: Datos del Docente y Escáner */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Card className="flex flex-col gap-3 p-4 border border-border bg-surface shadow-xs">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
                1. Quién retira
              </span>

              <div className="flex gap-1" role="group" aria-label="Tipo de solicitante">
                {(['docente', 'estudiante'] as const).map((mode) => (
                  <Button
                    key={mode}
                    type="button"
                    size="sm"
                    variant={borrowerMode === mode ? 'primary' : 'outline'}
                    aria-pressed={borrowerMode === mode}
                    onClick={() => setBorrowerMode(mode)}
                    className="flex-1 text-xs capitalize"
                  >
                    {mode}
                  </Button>
                ))}
              </div>

              <div className="flex flex-col gap-2">
                {borrowerMode === 'estudiante' && <StudentLookup onChange={handleStudentChange} />}
                {borrowerMode === 'docente' && (<>
                <div>
                  <label
                    htmlFor="docente_run"
                    className="font-mono text-xs text-text"
                  >
                    RUN / Credencial Docente <span className="text-danger">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                    <input
                      id="docente_run"
                      type="text"
                      value={docenteRun}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDocenteRun(val);
                        // Autocompletar nombre si coincide con docente en lista
                        const matched = teachers.find(
                          (t) => t.run === val,
                        );
                        if (matched) setDocenteName(matched.nombre);
                      }}
                      placeholder="12.345.678-9 o escanear credencial"
                      className="h-8.5 w-full rounded-md border border-border bg-background px-2.5 pl-8 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="docente_nombre"
                    className="font-mono text-xs text-text"
                  >
                    Nombre del Docente
                  </label>
                  <input
                    id="docente_nombre"
                    type="text"
                    value={docenteName}
                    onChange={(e) => setDocenteName(e.target.value)}
                    placeholder="Ej. Profesor Carlos Rivera"
                    className="mt-1 h-8.5 w-full rounded-md border border-border bg-background px-2.5 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                  />
                </div>
                </>)}

                <div>
                  <label htmlFor="career" className="font-mono text-xs text-text-muted">
                    Carrera <span className="text-danger">*</span>
                  </label>
                  <CareerSelect
                    id="career"
                    value={careerId}
                    onChange={setCareerId}
                    className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-text focus:border-text-muted focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label htmlFor="subject" className="font-mono text-xs text-text-muted">
                      Asignatura
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Redes CCNA"
                      className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                    />
                  </div>
                  <div>
                    <label htmlFor="room" className="font-mono text-xs text-text-muted">
                      Sala / Taller
                    </label>
                    <input
                      id="room"
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="Lab 201"
                      className="mt-1 h-8 w-full rounded border border-border bg-background px-2 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Captura de Escáner Code128 */}
            <Card className="flex flex-col gap-2 p-4 border-2 border-danger/30 bg-danger-bg shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-danger">
                  2. Entrada Lector Code128
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-danger-bg px-1.5 py-0.5 font-mono text-xs text-danger">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                  Auto-foco
                </span>
              </div>

              <p className="text-xs text-text-muted">
                Pistola lectora opera como teclado estándar USB/Bluetooth terminado en [Enter].
              </p>

              <div className="relative mt-1">
                <Barcode aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Dispara con pistola o escribe SKU + Enter…"
                  aria-label="Código de barras"
                  className="h-10 w-full rounded-md border-2 border-border bg-background px-3 pl-9 font-mono text-xs font-semibold text-text placeholder:font-normal placeholder:text-text-muted focus:border-danger focus:outline-none"
                />
              </div>
            </Card>
          </div>

          {/* Columna Derecha: Tabla de Ítems Escaneados y Confirmación */}
          <div className="flex flex-col gap-3 lg:col-span-2">
            <div className="rounded-md border border-border bg-surface overflow-hidden shadow-xs">
              <div className="flex items-center justify-between border-b border-border p-3 bg-surface-raised">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text uppercase tracking-wider">
                    Ítems Agregados al Préstamo
                  </span>
                  <Badge tone="neutral">{scannedItems.length} distintos</Badge>
                  <span className="font-mono text-xs text-text-muted tabular-nums">
                    ({scannedItems.reduce((acc, it) => acc + it.cantidad, 0)} unidades totales)
                  </span>
                </div>

                {scannedItems.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setScannedItems([])}
                    className="h-7 text-xs text-text-muted hover:text-danger"
                  >
                    Limpiar lista
                  </Button>
                )}
              </div>

              {scannedItems.length === 0 ? (
                <div className="p-12 text-center text-xs font-mono text-text-muted flex flex-col items-center gap-2">
                  <Barcode aria-hidden="true" className="h-8 w-8 text-text-muted" />
                  <span>No hay ítems escaneados aún.</span>
                  <span className="text-xs text-text-muted">
                    Apunta la pistola lectora a las etiquetas de los productos o ingresa su SKU en el campo de escaneo.
                  </span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs font-mono">
                    <thead className="bg-surface-raised border-b border-border text-xs uppercase tracking-wider text-text-muted font-semibold">
                      <tr>
                        <th className="px-3.5 py-2">Código / SKU</th>
                        <th className="px-3.5 py-2">Producto</th>
                        <th className="px-3.5 py-2">Ubicación</th>
                        <th className="px-3.5 py-2 text-center">Cantidad</th>
                        <th className="px-3.5 py-2 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {scannedItems.map((item) => (
                        <tr
                          key={item.producto.id}
                          className="hover:bg-surface-raised"
                        >
                          <td className="px-3.5 py-2.5 font-semibold text-text">
                            {item.barcode}
                          </td>
                          <td className="px-3.5 py-2.5 font-sans font-medium text-text">
                            {item.producto.nombre}
                          </td>
                          <td className="px-3.5 py-2.5 text-text-muted text-xs">
                            {item.producto.ubicacion
                              ? `${item.producto.ubicacion.sala} · ${item.producto.ubicacion.cajon}`
                              : 'Pañol'}
                          </td>
                          <td className="px-3.5 py-2.5 text-center">
                            <div className="inline-flex items-center gap-1.5 border border-border rounded bg-background p-0.5">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.producto.id, -1)}
                                className="h-5 w-5 rounded flex items-center justify-center hover:bg-surface-raised"
                              >
                                <Minus aria-hidden="true" className="h-3 w-3 text-text-muted" />
                              </button>
                              <span className="w-6 text-center tabular-nums font-semibold">
                                {item.cantidad}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.producto.id, 1)}
                                className="h-5 w-5 rounded flex items-center justify-center hover:bg-surface-raised"
                              >
                                <Plus aria-hidden="true" className="h-3 w-3 text-text-muted" />
                              </button>
                            </div>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.producto.id)}
                              className="text-text-muted hover:text-danger p-1"
                              title="Quitar ítem"
                            >
                              <Trash2 aria-hidden="true" className="h-3.5 w-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Botón Culminante de Despacho */}
              <div className="flex items-center justify-between border-t border-border p-3 bg-surface-raised">
                <div className="text-xs font-mono text-text-muted">
                  {borrowerMode === 'estudiante'
                    ? studentBorrower
                      ? `Estudiante: ${studentBorrowerLabel(studentBorrower)}`
                      : 'Falta estudiante'
                    : docenteRun
                      ? `Docente: ${docenteName || docenteRun}`
                      : 'Falta credencial'}
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleConfirmCheckout}
                  disabled={checkoutMutation.isPending || scannedItems.length === 0 ||
                    (borrowerMode === 'docente' ? !docenteRun.trim() : !studentBorrower)
                  }
                  className="gap-2"
                >
                  <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
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
            <div className="rounded-md border border-border bg-surface p-3 shadow-xs">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
                Buscar Préstamo Activo
              </span>
              <div className="relative mt-2">
                <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
                <input
                  type="search"
                  value={checkinSearch}
                  onChange={(e) => setCheckinSearch(e.target.value)}
                  placeholder="Docente, RUN o Código…"
                  className="h-8.5 w-full rounded-md border border-border bg-background px-3 pl-8.5 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                />
              </div>
            </div>

            {/* Lista de préstamos activos */}
            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto">
              {filteredActiveLoans.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-text-muted border border-dashed border-border rounded">
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
                          ? 'border-danger bg-danger-bg'
                          : 'border-border bg-surface hover:border-text-muted',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-text">
                          {loan.codigo ?? `#${loan.id}`}
                        </span>
                        <LoanStatusBadge estado={loan.estado} />
                      </div>
                      <p className="mt-1 font-sans text-xs font-semibold text-text truncate">
                        {loan.solicitanteNombre}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-xs font-mono text-text-muted">
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
              <div className="rounded-md border border-dashed border-border bg-surface p-16 text-center text-xs font-mono text-text-muted flex flex-col items-center gap-2">
                <ArrowDownLeft aria-hidden="true" className="h-8 w-8 text-text-muted" />
                <span>Selecciona un préstamo activo del panel izquierdo para recepcionar insumos.</span>
              </div>
            ) : (
              <div className="rounded-md border border-border bg-surface p-4 shadow-xs flex flex-col gap-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex flex-col">
                    <span className="font-mono text-xs font-bold text-text">
                      Recepcionando Préstamo {selectedLoan.codigo ?? `#${selectedLoan.id}`}
                    </span>
                    <span className="text-xs text-text-muted">
                      Docente: {selectedLoan.solicitanteNombre}{' '}
                      {selectedLoan.solicitanteRun ? `(${selectedLoan.solicitanteRun})` : ''}
                    </span>
                  </div>
                  <LoanStatusBadge estado={selectedLoan.estado} />
                </div>

                {/* Lista de Ítems a devolver */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono font-semibold uppercase tracking-wider text-text-muted">
                    Verificación de Estado por Ítem
                  </span>

                  <div className="flex flex-col divide-y divide-border border border-border rounded">
                    {selectedLoan.items.map((it) => {
                      const cond = itemConditions[it.productoId] || {
                        condition: 'bueno',
                        damaged: false,
                        notes: '',
                      };

                      return (
                        <div
                          key={it.productoId}
                          className="flex flex-col gap-2 p-3 text-xs bg-surface"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="font-sans font-medium text-text">
                                {it.nombre || `Producto #${it.productoId}`}
                              </span>
                              <span className="font-mono text-xs text-text-muted">
                                SKU: {it.codigoBarras || '—'} · Cantidad: {it.cantidad}
                              </span>
                            </div>

                            {/* Selector de Condición */}
                            <div className="flex items-center gap-1 text-xs font-mono">
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
                                    ? 'bg-ok-bg text-ok border-ok/30 font-semibold'
                                    : 'text-text-muted border-border hover:bg-surface-raised',
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
                                    ? 'bg-danger-bg text-danger border-danger/30 font-semibold'
                                    : 'text-text-muted border-border hover:bg-surface-raised',
                                )}
                              >
                                Reportar daño / falla
                              </button>
                            </div>
                          </div>

                          {cond.damaged && (
                            <div className="mt-1 flex flex-col gap-1">
                              <label className="text-xs font-mono text-danger">
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
                                className="h-7 w-full rounded border border-danger/30 bg-danger-bg px-2 font-mono text-xs text-text placeholder:text-text-muted focus:outline-none"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs text-text-muted">
                    Observaciones generales de recepción
                  </label>
                  <textarea
                    rows={2}
                    value={generalCheckinNotes}
                    onChange={(e) => setGeneralCheckinNotes(e.target.value)}
                    placeholder="Comentarios adicionales opcionales…"
                    className="mt-1 w-full rounded border border-border bg-background p-2 font-mono text-xs text-text placeholder:text-text-muted focus:border-text-muted focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 border-t border-border pt-3">
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
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
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
