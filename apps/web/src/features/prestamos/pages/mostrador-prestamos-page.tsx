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
  Trash2,
  User,
  Volume2,
} from 'lucide-react';
import {
  useCheckoutLoan,
  useLoans,
  useProducts,
} from '@sgia/api-client';
import type { Prestamo, Producto } from '@sgia/types';

import { Badge, LoanStatusBadge } from '@/components/ui/badge';
import { StudentLookup } from '@/features/estudiantes/components/student-lookup';
import {
  studentBorrowerLabel,
  studentBorrowerPayload,
  type StudentBorrower,
} from '@/features/estudiantes/lib/student-borrower';
import { CareerSelect } from '@/components/shared/career-select';
import { LoanCheckinPanel } from '@/features/prestamos/components/loan-checkin-panel';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiErrorToMessage } from '@/lib/api-error';
import { playScannerBeep } from '@/lib/audio';
import { cn } from '@/lib/cn';
import { toast } from '@/lib/toast';
import { EmptyState } from '@/components/ui/empty-state';
import { FORM_CONTROL_BASE_CLASS, FORM_CONTROL_CLASS } from '@/components/ui/form-control';
import { PageHeader } from '@/components/ui/page-header';
import { SectionTitle } from '@/components/ui/section-title';
import { TableFrame } from '@/components/ui/table-frame';
import { TableSearch } from '@/components/ui/table-search';
import { ICON_BUTTON_CLASS, ROW_CLASS, STICKY_COL_CLASS, TD_CLASS, TH_CLASS } from '@/components/ui/table-styles';
import { CODE_CHIP_CLASS, FIELD_LABEL_CLASS, TABLE_HEAD_CLASS } from '@/components/ui/typography';

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

  const checkoutMutation = useCheckoutLoan();

  // --- CHECKIN STATE ---
  const [checkinSearch, setCheckinSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<Prestamo | null>(null);

  // Préstamos activos para devolución
  // Préstamos entregados y aún sin devolver. La API no conoce el estado `activo` (respondía 422 y
  // la lista quedaba vacía): son los `procesado` con `returned_at` nulo.
  const { data: activeLoansData, refetch: refetchActiveLoans } = useLoans({
    estado: 'procesado',
    devuelto: false,
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

  // Devolución: el panel de escaneo (`LoanCheckinPanel`) maneja el resto.
  const handleSelectLoanForCheckin = (loan: Prestamo) => setSelectedLoan(loan);

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

  const totalUnits = scannedItems.reduce((acc, it) => acc + it.cantidad, 0);
  const tabClass = (active: boolean) =>
    cn(
      '-mb-px inline-flex h-10 cursor-pointer items-center gap-1.5 border-b-2 px-3 text-[13px] font-medium transition-colors duration-150 pointer-coarse:h-11',
      active
        ? 'border-accent text-zinc-900 dark:text-zinc-100'
        : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={Layers}
        title="Mostrador de pañol: préstamos presenciales y devoluciones"
        description="Entrega y recibe materiales en el mesón con el lector Code128 y la credencial de quien retira."
        actions={
          <>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/prestamos/cola')}>
              <Clock aria-hidden="true" className="h-3.5 w-3.5" />
              Cola remota
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => navigate('/prestamos/historial')}>
              <History aria-hidden="true" className="h-3.5 w-3.5" />
              Historial auditoría
            </Button>
          </>
        }
      />

      {/* Pestañas: entrega o devolución */}
      <div className="flex flex-col gap-2 border-b border-zinc-200 dark:border-zinc-800 sm:flex-row sm:items-end">
        <div className="flex min-w-0 overflow-x-auto" role="group" aria-label="Modo del mostrador">
          <button
            type="button"
            aria-pressed={activeTab === 'checkout'}
            onClick={() => setActiveTab('checkout')}
            className={tabClass(activeTab === 'checkout')}
          >
            <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Préstamo presencial directo (entrega)</span>
          </button>
          <button
            type="button"
            aria-pressed={activeTab === 'checkin'}
            onClick={() => setActiveTab('checkin')}
            className={tabClass(activeTab === 'checkin')}
          >
            <ArrowDownLeft aria-hidden="true" className="h-3.5 w-3.5" />
            <span className="whitespace-nowrap">Devolución y recepción (Check-in)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Silenciar lector' : 'Activar sonido de escáner'}
          aria-label={soundEnabled ? 'Silenciar lector' : 'Activar sonido de escáner'}
          className={cn(
            'mb-2 inline-flex h-7 cursor-pointer items-center gap-1.5 self-start rounded-md px-2 text-xs font-medium transition-colors duration-150 sm:ml-auto sm:self-auto pointer-coarse:h-11',
            soundEnabled
              ? 'bg-ok-bg text-ok'
              : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400',
          )}
        >
          <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
          <span>Audio {soundEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {activeTab === 'checkout' ? (
        /* ======================== TAB CHECKOUT ======================== */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Columna Izquierda: Datos del Docente y Escáner */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Card className="flex flex-col gap-3">
              <SectionTitle as="h2">1. Quién retira</SectionTitle>

              <div
                className="flex gap-0.5 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950"
                role="group"
                aria-label="Tipo de solicitante"
              >
                {(['docente', 'estudiante'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    aria-pressed={borrowerMode === mode}
                    onClick={() => setBorrowerMode(mode)}
                    className={cn(
                      'h-7 flex-1 cursor-pointer rounded-sm text-[13px] font-medium capitalize transition-colors duration-150 pointer-coarse:h-10',
                      borrowerMode === mode
                        ? 'bg-white text-zinc-900 shadow-[0_0_0_1px_var(--line)] dark:bg-zinc-800 dark:text-zinc-100'
                        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100',
                    )}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                {borrowerMode === 'estudiante' && <StudentLookup onChange={handleStudentChange} />}
                {borrowerMode === 'docente' && (<>
                <div>
                  <label
                    htmlFor="docente_run"
                    className={FIELD_LABEL_CLASS}
                  >
                    RUN / credencial docente <span className="text-danger">*</span>
                  </label>
                  <div className="relative mt-1">
                    <User aria-hidden="true" className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                    <input
                      id="docente_run"
                      type="text"
                      value={docenteRun}
                      onChange={(e) => setDocenteRun(e.target.value)}
                      placeholder="12.345.678-9 o escanear credencial"
                      className={cn(FORM_CONTROL_CLASS, 'pl-8 font-code')}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="docente_nombre"
                    className={FIELD_LABEL_CLASS}
                  >
                    Nombre del docente
                  </label>
                  <input
                    id="docente_nombre"
                    type="text"
                    value={docenteName}
                    onChange={(e) => setDocenteName(e.target.value)}
                    placeholder="Ej. Profesor Carlos Rivera"
                    className={cn(FORM_CONTROL_CLASS, 'mt-1')}
                  />
                </div>
                </>)}

                <div>
                  <label htmlFor="career" className={FIELD_LABEL_CLASS}>
                    Carrera <span className="text-danger">*</span>
                  </label>
                  <CareerSelect
                    id="career"
                    value={careerId}
                    onChange={setCareerId}
                    className={cn(FORM_CONTROL_CLASS, 'mt-1')}
                  />
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <div>
                    <label htmlFor="subject" className={FIELD_LABEL_CLASS}>
                      Asignatura
                    </label>
                    <input
                      id="subject"
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Redes CCNA"
                      className={cn(FORM_CONTROL_CLASS, 'mt-1')}
                    />
                  </div>
                  <div>
                    <label htmlFor="room" className={FIELD_LABEL_CLASS}>
                      Sala / taller
                    </label>
                    <input
                      id="room"
                      type="text"
                      value={room}
                      onChange={(e) => setRoom(e.target.value)}
                      placeholder="Lab 201"
                      className={cn(FORM_CONTROL_CLASS, 'mt-1')}
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Captura de Escáner Code128 */}
            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <SectionTitle as="h2">2. Entrada lector Code128</SectionTitle>
                <Badge tone="accent" dot>Auto-foco</Badge>
              </div>

              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Pistola lectora opera como teclado estándar USB/Bluetooth terminado en [Enter].
              </p>

              <div className="relative mt-1">
                <Barcode aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  onKeyDown={handleBarcodeKeyDown}
                  placeholder="Dispara con pistola o escribe SKU + Enter…"
                  aria-label="Código de barras"
                  className={cn(FORM_CONTROL_BASE_CLASS, 'h-10 pl-9 font-code pointer-coarse:h-11')}
                />
              </div>
            </Card>
          </div>

          {/* Columna Derecha: Tabla de Ítems Escaneados y Confirmación */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            <TableFrame
              toolbar={
                <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SectionTitle as="h2">Ítems agregados al préstamo</SectionTitle>
                    <Badge tone="neutral">{scannedItems.length} distintos</Badge>
                    <span className="font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                      ({totalUnits} unidades totales)
                    </span>
                  </div>
                  {scannedItems.length > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setScannedItems([])}>
                      Limpiar lista
                    </Button>
                  )}
                </div>
              }
              footer={
                <>
                  <span>
                    {borrowerMode === 'estudiante'
                      ? studentBorrower
                        ? `Estudiante: ${studentBorrowerLabel(studentBorrower)}`
                        : 'Falta estudiante'
                      : docenteRun
                        ? `Docente: ${docenteName || docenteRun}`
                        : 'Falta credencial'}
                  </span>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    onClick={handleConfirmCheckout}
                    disabled={checkoutMutation.isPending || scannedItems.length === 0 ||
                      (borrowerMode === 'docente' ? !docenteRun.trim() : !studentBorrower)
                    }
                  >
                    <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                    Registrar entrega de préstamo
                  </Button>
                </>
              }
            >
              {scannedItems.length === 0 ? (
                <EmptyState
                  icon={Barcode}
                  title="No hay ítems escaneados aún."
                  description="Apunta la pistola lectora a las etiquetas de los productos o ingresa su SKU en el campo de escaneo."
                />
              ) : (
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead className={TABLE_HEAD_CLASS}>
                    <tr>
                      <th className={`${TH_CLASS} ${STICKY_COL_CLASS} max-md:bg-zinc-50`}>Código / SKU</th>
                      <th className={TH_CLASS}>Producto</th>
                      <th className={TH_CLASS}>Ubicación</th>
                      <th className={`${TH_CLASS} text-center`}>Cantidad</th>
                      <th className={`${TH_CLASS} text-right`}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scannedItems.map((item) => (
                      <tr key={item.producto.id} className={ROW_CLASS}>
                        <td className={`${TD_CLASS} ${STICKY_COL_CLASS}`}>
                          <span className={CODE_CHIP_CLASS}>{item.barcode}</span>
                        </td>
                        <td className={`${TD_CLASS} font-medium text-zinc-900 dark:text-zinc-100`}>
                          {item.producto.nombre}
                        </td>
                        <td className={`${TD_CLASS} font-mono text-[13px] text-zinc-500 dark:text-zinc-400`}>
                          {item.producto.ubicacion
                            ? `${item.producto.ubicacion.sala} · ${item.producto.ubicacion.cajon}`
                            : 'Pañol'}
                        </td>
                        <td className={`${TD_CLASS} text-center`}>
                          <div className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-950">
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.producto.id, -1)}
                              aria-label={`Restar una unidad de ${item.producto.nombre}`}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 pointer-coarse:h-10 pointer-coarse:w-10"
                            >
                              <Minus aria-hidden="true" className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center font-mono font-medium">{item.cantidad}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQty(item.producto.id, 1)}
                              aria-label={`Sumar una unidad de ${item.producto.nombre}`}
                              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-sm text-zinc-600 transition-colors duration-150 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-800 pointer-coarse:h-10 pointer-coarse:w-10"
                            >
                              <Plus aria-hidden="true" className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                        <td className={`${TD_CLASS} text-right`}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.producto.id)}
                            className={ICON_BUTTON_CLASS}
                            title="Quitar ítem"
                            aria-label={`Quitar ${item.producto.nombre}`}
                          >
                            <Trash2 aria-hidden="true" className="h-3.5 w-3.5 text-danger" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableFrame>
          </div>
        </div>
      ) : (
        /* ======================== TAB CHECKIN / DEVOLUCION ======================== */
        <div className="grid gap-4 lg:grid-cols-3">
          {/* Columna Izquierda: Búsqueda de Préstamo Activo */}
          <div className="flex flex-col gap-3 lg:col-span-1">
            <Card className="flex flex-col gap-2">
              <SectionTitle as="h2">Buscar préstamo activo</SectionTitle>
              <TableSearch
                value={checkinSearch}
                onChange={setCheckinSearch}
                placeholder="Docente, RUN o código…"
              />
            </Card>

            {/* Lista de préstamos activos */}
            <div className="flex max-h-[500px] flex-col gap-2 overflow-y-auto">
              {filteredActiveLoans.length === 0 ? (
                <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                  <EmptyState title="No se encontraron préstamos activos." />
                </div>
              ) : (
                filteredActiveLoans.map((loan) => {
                  const isSelected = selectedLoan?.id === loan.id;
                  return (
                    <Card
                      key={loan.id}
                      onClick={() => handleSelectLoanForCheckin(loan)}
                      aria-current={isSelected ? 'true' : undefined}
                      className={cn(
                        'cursor-pointer p-3 transition-colors duration-150',
                        isSelected
                          ? 'border-accent bg-accent-soft dark:border-accent dark:bg-accent-soft'
                          : 'hover:border-zinc-300 dark:hover:border-zinc-700',
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={CODE_CHIP_CLASS}>{loan.codigo ?? `#${loan.id}`}</span>
                        <LoanStatusBadge loan={loan} />
                      </div>
                      <p className="mt-1.5 truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {loan.solicitanteNombre}
                      </p>
                      <div className="mt-1.5 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <span className="font-mono">{loan.items.length} ítems</span>
                        <span>{loan.sala || 'Mesón'}</span>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </div>

          {/* Columna Derecha: Verificación y Reintegro de Ítems */}
          <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
            {!selectedLoan ? (
              <div className="rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <EmptyState
                  icon={ArrowDownLeft}
                  title="Selecciona un préstamo activo para recepcionar sus insumos."
                  description="La lista de préstamos entregados está en el panel de búsqueda."
                />
              </div>
            ) : (
              <LoanCheckinPanel
                loan={selectedLoan}
                soundEnabled={soundEnabled}
                onCancel={() => setSelectedLoan(null)}
                onDone={() => {
                  setSelectedLoan(null);
                  setCheckinSearch('');
                  refetchActiveLoans();
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
