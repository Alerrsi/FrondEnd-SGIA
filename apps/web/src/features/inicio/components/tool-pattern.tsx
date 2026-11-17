import {
  Battery,
  Cable,
  CircuitBoard,
  Cpu,
  Drill,
  HardDrive,
  Keyboard,
  Laptop,
  Lightbulb,
  MemoryStick,
  Monitor,
  Mouse,
  Plug,
  Printer,
  Router,
  Ruler,
  Server,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

import { cn } from '@/lib/cn';

const ICONS: LucideIcon[] = [
  Laptop, Wrench, Router, Cable, Cpu, Drill, Monitor, Plug, HardDrive,
  Ruler, Keyboard, CircuitBoard, Printer, Mouse, Server, MemoryStick, Battery, Lightbulb,
];

/** Trama de herramientas e insumos de TI en línea fina, para el panel oscuro. */
export function ToolPattern({ className }: { className?: string }) {
  const cells = Array.from({ length: 48 }, (_, i) => ICONS[(i * 7) % ICONS.length] ?? Wrench);
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 grid grid-cols-8 place-items-center gap-8 p-6 text-white/[0.07]',
        className,
      )}
    >
      {cells.map((Icon, i) => (
        <Icon
          key={i}
          strokeWidth={1}
          className="h-12 w-12"
          style={{ transform: `rotate(${((i * 37) % 60) - 30}deg)` }}
        />
      ))}
    </div>
  );
}
