import { useEffect, useMemo, useRef, useState } from "react";
import { animate, motion, useMotionValue, useSpring, useTransform, useVelocity } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/cn";

/* ── Liquid Toggle (benco.dev) ─────────────────────────────────
   Industrial fluid toggle adapted for SGIA dual-theme interface.
   Left = Moon (Dark Mode, on=false), Right = Sun (Light Mode, on=true).
   Supports compact (size="sm") for collapsed sidebars and
   standard (size="md") for toolbars and settings.
─────────────────────────────────────────────────────────────────── */

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export interface ToggleProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: "sm" | "md";
  stretch?: number;
  speed?: number;
  className?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

export function Toggle({
  checked,
  defaultChecked = false,
  onCheckedChange,
  size = "md",
  stretch = 36,
  speed = 50,
  className,
  "aria-label": ariaLabel = "Alternar modo",
  disabled = false,
}: ToggleProps) {
  const isControlled = checked !== undefined;
  const [internalOn, setInternalOn] = useState(defaultChecked);
  const on = isControlled ? checked : internalOn;

  const [held, setHeld] = useState(false);
  const [hot, setHot] = useState(false);

  const rail = useRef<HTMLButtonElement | null>(null);
  const grip = useRef<{ id: number; grab: number | null; moved: boolean } | null>(null);

  // Geometric measurements by size
  const TRACK = size === "sm" ? 46 : 68;
  const TRACK_H = size === "sm" ? 24 : 34;
  const THUMB = size === "sm" ? 18 : 26;
  const PAD = (TRACK_H - THUMB) / 2;

  const SHUT_X = PAD;
  const OPEN_X = TRACK - THUMB - PAD;
  const MID_X = (SHUT_X + OPEN_X) / 2;

  const x = useMotionValue<number>(on ? OPEN_X : SHUT_X);

  const vel = useVelocity(x);
  const eased = useSpring(vel, { stiffness: 320, damping: 40, mass: 0.6 });

  const lengthen = (v: number) =>
    1 + Math.min(0.35, Math.abs(v) / 600) * (clamp(stretch, 0, 100) / 100);

  const swell = useSpring(hot ? 1.04 : 1, {
    stiffness: 520,
    damping: 34,
    mass: 0.6,
  });

  const wide = useTransform([eased, swell], (latest: unknown[]) => {
    const v = (latest[0] as number | undefined) ?? 0;
    const s = (latest[1] as number | undefined) ?? 1;
    return lengthen(v) * s;
  });

  const tall = useTransform([eased, swell], (latest: unknown[]) => {
    const v = (latest[0] as number | undefined) ?? 0;
    const s = (latest[1] as number | undefined) ?? 1;
    return s / lengthen(v);
  });

  const settle = useMemo(
    () => ({
      type: "spring" as const,
      stiffness: 170 - (50 - speed) * 1.1,
      damping: 21.5,
      mass: 0.9,
    }),
    [speed],
  );

  useEffect(() => {
    if (held) return;
    const run = animate(x, on ? OPEN_X : SHUT_X, settle);
    return () => run.stop();
  }, [on, held, x, settle, OPEN_X, SHUT_X]);

  const updateOn = (nextState: boolean) => {
    if (!isControlled) {
      setInternalOn(nextState);
    }
    onCheckedChange?.(nextState);
  };

  const local = (clientX: number) => {
    const el = rail.current;
    if (!el) return 0;
    const b = el.getBoundingClientRect();
    const k = b.width / (el.offsetWidth || b.width) || 1;
    return (clientX - b.left) / k;
  };

  const down = (e: React.PointerEvent) => {
    if (disabled) return;
    grip.current = { id: e.pointerId, grab: null, moved: false };
    setHeld(true);
    try {
      rail.current?.setPointerCapture(e.pointerId);
    } catch {
      /* ignore synthetic/detached pointers */
    }
  };

  const move = (e: React.PointerEvent) => {
    if (disabled) return;
    const g = grip.current;
    if (!g || g.id !== e.pointerId) return;
    const at = local(e.clientX);
    if (g.grab === null) g.grab = at - x.get();
    const next = clamp(at - g.grab, SHUT_X, OPEN_X);
    if (Math.abs(next - x.get()) > 0.4) g.moved = true;
    x.set(next);

    const past = next > MID_X;
    if (past !== on) {
      updateOn(past);
    }
  };

  const up = (e: React.PointerEvent) => {
    if (disabled) return;
    const g = grip.current;
    if (!g) return;
    grip.current = null;
    try {
      rail.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!g.moved) {
      updateOn(!on);
    }
    setHeld(false);
  };

  return (
    <div
      className={cn("liq-well", className)}
      style={
        {
          "--liq-thumb": `${THUMB}px`,
          "--liq-pad": `${PAD}px`,
          width: `${TRACK}px`,
          height: `${TRACK_H}px`,
        } as React.CSSProperties
      }
    >
      <button
        ref={rail}
        type="button"
        className="liq-sw"
        data-on={on}
        data-size={size}
        role="switch"
        aria-checked={on}
        aria-label={ariaLabel}
        disabled={disabled}
        style={{
          width: `${TRACK}px`,
          height: `${TRACK_H}px`,
        }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        onPointerEnter={() => setHot(true)}
        onPointerLeave={() => setHot(false)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key !== " " && e.key !== "Enter") return;
          e.preventDefault();
          updateOn(!on);
        }}
      >
        <span className="liq-sw-blobs flex items-center justify-between px-1" aria-hidden="true">
          <Moon
            size={size === "sm" ? 10 : 13}
            className={cn(
              "text-zinc-400 dark:text-zinc-500 pointer-events-none transition-colors ml-0.5",
              !on && "text-indigo-400 dark:text-indigo-300 font-bold",
            )}
          />
          <Sun
            size={size === "sm" ? 10 : 13}
            className={cn(
              "text-zinc-400 dark:text-zinc-500 pointer-events-none transition-colors mr-0.5",
              on && "text-amber-500 dark:text-amber-400 font-bold",
            )}
          />
          <motion.span
            className="liq-thumb"
            style={{
              x,
              scaleX: wide,
              scaleY: tall,
              top: `${PAD}px`,
            }}
          />
        </span>
      </button>
    </div>
  );
}
