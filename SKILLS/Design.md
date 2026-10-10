# Sistema de Gestión de Inventario y Activos (SGIA) - Global UI Specification (Dual Theme: Light & Dark)

Eres un Diseñador de Producto Senior y Desarrollador Frontend experto en React, TypeScript y Tailwind CSS. Tu objetivo es diseñar e implementar interfaces para todo el ecosistema de la plataforma SGIA (Pañol TI, Inventario general, Mantenimiento, Préstamos, Gestión de Usuarios y Reportes), erradicando el aspecto de plantilla administrativa genérica mediante una estética técnica, industrial y de alta densidad de información (inspirada en Linear, Supabase y Vercel).Como senior debes usar variables CSS para codigo modular y que los temas no relentizen el sistema


---

## 1. Stack Tecnológico Obligatorio
- **Core:** React con TypeScript en modo estricto (cero `any`).
- **Estilos:** Tailwind CSS con arquitectura de doble tema basada en clases (`dark:...`) y escala neutra `zinc`.
- **Iconografía:** Lucide React (`lucide-react`).
- **Primitivas UI y Accesibilidad:** Radix UI / Shadcn UI (`DropdownMenu`, `Dialog`, `Sheet`/Drawer, `Tooltip`, `Select`, `Tabs`, `Popover`).
- **Tablas de Datos:** TanStack Table (`@tanstack/react-table`) para ordenamiento, filtros en memoria y data grids densos.
- **Formularios & Validación:** React Hook Form + Zod para esquemas fuertemente tipados.
- **Notificaciones & Feedback:** Sileo (`sileo`) para avisos fluidos, alertas de escáner y confirmaciones de estado.

---

## 2. Identidad Visual y Tokens de Superficie (Dual Theme)

### A. Superficies y Capas (Canvas Hierarchy)
- **Fondo base (Canvas):** `bg-zinc-100 dark:bg-zinc-950`. Prohibido usar blanco puro o negro plano en todo el fondo.
- **Contenedores y Paneles:** `bg-white dark:bg-zinc-900` con bordes nítidos de 1px (`border-zinc-200 dark:border-zinc-800`) y sombras leves (`shadow-xs`). Prohibido usar sombras difusas pesadas o tarjetas infladas.
- **Divisores y Separadores:** Líneas neutras delgadas de 1px (`border-zinc-200 dark:border-zinc-800` o `divide-zinc-100 dark:divide-zinc-800/60`).

### B. Paleta Semántica y Acentos
- **Acento Institucional INACAP (`#dc2626` / `#ef4444`):**
  - **Uso estricto y delimitado:** Reservado exclusivamente para la micro-etiqueta institucional (`SEDE TEMUCO · PAÑOL TI`) y estados de parada o alerta crítica real.
  - **Prohibición:** No usar botones rojos saturados gigantes como acción principal cotidiana para evitar fatiga visual y el aspecto de botón de emergencia.
- **Botón de Acción Principal Global (CTA):** Monocromático de alto contraste técnico:
  - Claro: `bg-zinc-900 text-white hover:bg-zinc-800`
  - Oscuro: `bg-zinc-100 text-zinc-900 hover:bg-white`
- **Escala de Textos:**
  - Títulos principales: `text-zinc-900 dark:text-zinc-100 font-semibold`.
  - Textos secundarios / metadatos: `text-zinc-500 dark:text-zinc-400 text-xs`.
  - Bordes e inputs: `border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100`.
- **Estados Semánticos Técnicos (Status Badges con Status Dot):**
  - No usar pastillas completas de colores fluorescentes. Emplear contenedor neutro (`bg-zinc-100 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60`) acompañado de un punto de estado de 6px (`rounded-full`):
    - **Disponible / Activo:** Dot `bg-emerald-500 dark:bg-emerald-400`.
    - **En Préstamo / Asignado:** Dot `bg-blue-500 dark:bg-blue-400`.
    - **Stock Crítico / Umbral Mínimo:** Dot `bg-rose-500 dark:bg-rose-400`.
    - **En Mantención / Revisión:** Dot `bg-amber-500 dark:bg-amber-400`.
    - **De Baja / Retirado:** Dot `bg-zinc-400 dark:bg-zinc-500`.


### B1. Paleta Semántica y Acentos
Esta paleta de colores es alternativa solo accionable dentro de los ajustes de cada usuario.
~Smart Blue #0466c8
Vibrant medium blue that radiates intelligence and calm, enhancing focus in digital platforms and designs.
~Steel Azure #0353a4
Sleek, bold blue-gray fuses industrial strength and steady calm, suggesting resilience, balance and high-tech vision.
~Regal Navy #023e7d
Powerful deep navy, like midnight seas, fosters authority, loyalty, and trust in bold, classic compositions.
~Prussian Blue #002855
Inky, profound blue filled with gravitas and mystery, conjures historical intrigue and academic tradition.
~Prussian Blue #001845
Inky, profound blue filled with gravitas and mystery, conjures historical intrigue and academic tradition.
~Prussian Blue #001233
Inky, profound blue filled with gravitas and mystery, conjures historical intrigue and academic tradition.
~Twilight Indigo #33415c
Evokes twilight’s serene embrace, blending night’s depth with a touch of anticipation for stories yet to unfold.
~Blue Slate #5c677d
Hints of blue add an air of cool authority and calm depth, sparking creativity in technology and modern art.
~Slate Grey #7d8597
Cool undertones and subdued strength, inspiring balance and clarity in both modern and classic aesthetics.
~Cool Steel #979dac
Cool, steely blue with a hint of mist, conjuring high-tech chic, creative clarity and contemplative moods.

### C. Tipografía Específica
- `font-mono`: Obligatorio para identificadores técnicos: SKUs, seriales de fábrica, rotulado Code128, direcciones IP/MAC (equipos Cisco), gavetas (`Cajon-A2`, `Sala-L3`) y RUT de usuarios.
- `font-sans`: Tipografía de interfaz (Inter o Geist) para títulos, formularios, textos descriptivos y navegación.

---

## 3. Arquitectura de Componentes por Módulo

### A. Sustitución de Tarjetas KPI por Cinta Métrica Compacta (Metric Strip)
- **Regla estricta:** Prohibido colocar tarjetas blancas gigantescas de 150px de alto para mostrar un solo número.
- **Solución técnica:** Integrar una barra horizontal compacta de métricas (36px a 40px de alto) directamente sobre la tabla (`2 Referencias registradas · 0 Stock Crítico · Lector Code128 listo`). Ahorra espacio vertical y da foco inmediato a los datos.

### B. Toolbar Unificado con la Tabla
- El buscador y los filtros **no flotan en una caja externa separada**.
- Se integran como la cabecera superior del marco de la tabla, con acceso rápido mediante teclado (`/` o `Ctrl + K`) y botones compactos tipo chip para desplegar filtros.

### C. Data Grids de Alta Densidad (TanStack Table)
- **Cabeceras:** Tipografía compacta en mayúsculas atenuadas (`text-[11px] font-mono uppercase tracking-wider text-zinc-500 dark:text-zinc-400 bg-zinc-50/60 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800`).
- **Filas de Activos:**
  - SKU destacado en bloque monoespaciado tenue (`font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60`).
  - Nombre del producto en seminegrita con categoría o modelo secundario debajo.
  - Indicador visual de stock: microbarra de nivel compacto (40-60px) en lugar de texto plano huérfano.
  - Acciones por fila: Máximo 1 botón de acción contextual directa (ej. "Prestar" o "Ficha") y el resto agrupadas en menú flotante `MoreHorizontal` de Radix UI.

### D. Paneles Laterales (Drawers / Sheets) vs Modales
- **Drawers laterales (Radix Sheet):** Utilizados para operaciones frecuentes de mesón (Ficha técnica del equipo, Asignación rápida a alumno, Historial de movimientos). Permiten no perder el contexto de la tabla inferior.
- **Modales centrados (Radix Dialog):** Reservados para confirmaciones destructivas (Dar de baja, Eliminar registro).

### E. Integración de Notificaciones con Sileo
- Implementar avisos con Sileo en todos los eventos críticos del sistema:
  - Escaneo con lector de código de barras: `toast.success("Código Code128 detectado: SGIA-36824904")`.
  - Alerta de stock bajo mínimo: `toast.warning("Stock crítico: 2 unidades disponibles")`.
  - Operación completada: `toast.info("Activo asignado exitosamente")`.
  - Error de red o validación: `toast.error("Activo no encontrado en pañol")`.

### F. Escáner Code128 y Ergonomía de Operador
- Listener global para eventos `keydown` en vistas de mesón: capturar ráfagas continuas de caracteres de pistola lectora que finalizan en `Enter`, sin necesidad de obligar al operador a hacer clic manual en el campo de búsqueda.
### G. Togle de modo oscuro
- componente llamado 'toggle' sacado de benco.dev que debe ser usado en el sidebar para activar/ desactivar modo oscuro 
### H. Sidebar Icon
- componente llamado 'iconbar' usado para el estado del sidebar de forma comprimida debe ser modificado para que sea horizontal puesto que el actual es vertical.
---

## 4. Patrón de Componente de Referencia (Dual Theme)

```tsx
import React from 'react';
import { MoreHorizontal, ArrowUpRight, Barcode, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sileo';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

export interface SGIAAsset {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  currentStock: number;
  minStock: number;
  status: 'available' | 'loaned' | 'critical' | 'maintenance';
}

export const InventoryView: React.FC<{ assets: SGIAAsset[] }> = ({ assets }) => {
  return (
    <div className="w-full bg-zinc-100 dark:bg-zinc-950 min-h-screen p-6 text-zinc-900 dark:text-zinc-100 transition-colors">
      
      {/* 1. Header técnico compacto */}
      <div className="flex items-center justify-between pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              SEDE TEMUCO · PAÑOL TI
            </span>
            <span className="text-zinc-400 dark:text-zinc-600 text-xs font-mono">/ Módulo FU-02</span>
          </div>
          <h1 className="text-lg font-semibold tracking-tight">Control de Inventario y Activos</h1>
        </div>

        <button 
          onClick={() => toast.info('Formulario de alta iniciado')}
          className="h-8 px-3 rounded text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white shadow-xs transition-colors"
        >
          + Dar de alta producto
        </button>
      </div>

      {/* 2. Barra métrica horizontal compacta (Sustituye tarjetas gigantes) */}
      <div className="flex items-center gap-6 px-4 py-2.5 mb-3 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Total Referencias:</span>
          <span className="font-mono font-medium text-zinc-900 dark:text-zinc-100">{assets.length}</span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Stock Crítico:</span>
          <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">0 bajo mínimo</span>
        </div>
        <div className="h-3 w-px bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex items-center gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Lector Code128:</span>
          <span className="font-mono text-zinc-600 dark:text-zinc-400">Listo (Presiona /)</span>
        </div>
      </div>

      {/* 3. Marco unificado: Toolbar + Tabla */}
      <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
        
        {/* Toolbar integrado */}
        <div className="flex items-center justify-between p-2.5 border-b border-zinc-200 dark:border-zinc-800 gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"/>
            <input
              type="text"
              placeholder="Buscar por nombre o escanear Code128..."
              className="w-full pl-8 pr-12 py-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-zinc-400 px-1 rounded bg-zinc-200/60 dark:bg-zinc-800">
              /
            </kbd>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-zinc-200 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <SlidersHorizontal className="w-3 h-3"/>
              Filtros
            </button>
          </div>
        </div>

        {/* Tabla técnica de alta densidad */}
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 text-zinc-500 dark:text-zinc-400 uppercase font-mono text-[11px]">
              <th className="py-2.5 px-4 font-medium">SKU / Code128</th>
              <th className="py-2.5 px-4 font-medium">Activo / Modelo</th>
              <th className="py-2.5 px-4 font-medium">Ubicación Física</th>
              <th className="py-2.5 px-4 font-medium">Stock</th>
              <th className="py-2.5 px-4 font-medium">Estado</th>
              <th className="py-2.5 px-4 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
            {assets.map((asset) => {
              const isCritical = asset.currentStock <= asset.minStock;
              const ratio = Math.min((asset.currentStock / (asset.minStock * 2.5)) * 100, 100);

              return (
                <tr 
                  key={asset.id} 
                  className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1 font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700/60">
                      <Barcode className="w-3 h-3 text-zinc-400"/>
                      {asset.sku}
                    </span>
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{asset.name}</div>
                    <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{asset.category}</div>
                  </td>
                  <td className="py-2.5 px-4 font-mono text-zinc-600 dark:text-zinc-400">
                    {asset.location}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${isCritical ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${ratio}%` }}
                        />
                      </div>
                      <span className="font-mono text-zinc-700 dark:text-zinc-300">
                        {asset.currentStock} <span className="text-zinc-400 dark:text-zinc-500">(mín {asset.minStock})</span>
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-4">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Activo
                    </span>
                  </td>
                  <td className="py-2.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        onClick={() => toast.success(`Préstamo iniciado: ${asset.sku}`)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors"
                      >
                        Prestar <ArrowUpRight className="w-3 h-3 text-zinc-400"/>
                      </button>

                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <button className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                            <MoreHorizontal className="w-3.5 h-3.5"/>
                          </button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Content className="w-36 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg p-1 text-xs">
                          <DropdownMenu.Item className="px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer">
                            Ver Ficha
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="px-2 py-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer">
                            Reubicar
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="px-2 py-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 cursor-pointer">
                            Dar de baja
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Root>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
