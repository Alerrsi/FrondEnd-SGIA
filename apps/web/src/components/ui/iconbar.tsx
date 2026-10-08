import { useLayoutEffect, useMemo, useRef, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Bookmark, Folder, House, Search, User } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/cn";

/* ── Glass IconBar (benco.dev) ─────────────────────────────────
   Elastic glass dock adapted for SGIA collapsed sidebar and toolbars.
   Supports row (horizontal) and column (vertical) layout modes,
   with fluid indicator pill dilation and dual-theme tokens.
─────────────────────────────────────────────────────────────────── */

const rate = (speed: number) => 1.6 - (speed / 100) * 1.2;

const overshoot = (bounce: number, tuned: number) =>
  Number((1 + (bounce / 100) * (tuned - 1) * 2).toFixed(3));

const curve = (bounce: number, tuned: number, x1 = 0.28, x2 = 0.36) =>
  `cubic-bezier(${x1}, ${overshoot(bounce, tuned)}, ${x2}, 1)`;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type IconNavItem = {
  key: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;
  to?: string;
  end?: boolean;
  onClick?: () => void;
};

const DEFAULT_BAR: IconNavItem[] = [
  { key: "home", label: "Home", Icon: House },
  { key: "search", label: "Search", Icon: Search },
  { key: "files", label: "Files", Icon: Folder },
  { key: "saved", label: "Saved", Icon: Bookmark },
  { key: "you", label: "You", Icon: User },
];

type Ind = { p: number; s: number };

const settleCurve = (bounce: number) => ({
  move: curve(bounce, 1.28, 0.28, 0.36),
  size: curve(bounce, 1.34, 0.24, 0.38),
});

export interface IconNavProps {
  items: IconNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  glyph?: number;
  axis?: "row" | "column";
  dilate?: number;
  bounce?: number;
  speed?: number;
  hug?: number;
  className?: string;
}

export function IconNav({
  items,
  activeKey,
  onSelect,
  glyph = 18,
  axis = "row",
  dilate = 100,
  bounce = 50,
  speed = 50,
  hug = 4,
  className,
}: IconNavProps) {
  const vertical = axis === "column";
  const location = useLocation();

  // Find initial active based on prop, route or first item
  const initialKey = useMemo(() => {
    if (activeKey) return activeKey;
    if (location?.pathname) {
      const match = items.find((item) =>
        item.end
          ? location.pathname === item.to
          : item.to && location.pathname.startsWith(item.to),
      );
      if (match) return match.key;
    }
    return items[0]?.key ?? "";
  }, [activeKey, items, location?.pathname]);

  const [active, setActive] = useState<string>(initialKey);
  const trackRef = useRef<HTMLElement | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});
  const [ind, setInd] = useState<Ind | null>(null);
  const [phase, setPhase] = useState<"idle" | "stretch" | "settle">("idle");
  const indRef = useRef<Ind | null>(null);
  const timer = useRef<number | undefined>(undefined);

  // Sync active when location or activeKey prop changes
  useEffect(() => {
    if (activeKey && activeKey !== active) {
      select(activeKey);
      return;
    }
    if (location?.pathname) {
      const match = items.find((item) =>
        item.end
          ? location.pathname === item.to
          : item.to && (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)),
      );
      if (match && match.key !== active) {
        select(match.key);
      }
    }
  }, [location?.pathname, activeKey, items]);

  const measure = (k: string): Ind | null => {
    const el = refs.current[k];
    if (!el) return null;
    return vertical
      ? { p: el.offsetTop, s: el.offsetHeight }
      : { p: el.offsetLeft, s: el.offsetWidth };
  };

  useLayoutEffect(() => {
    const update = () => {
      if (!active) return;
      const next = measure(active);
      if (!next) return;
      indRef.current = next;
      setPhase("idle");
      setInd(next);
    };

    update();
    const ro = new ResizeObserver(update);
    if (trackRef.current) ro.observe(trackRef.current);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vertical, active, items]);

  const select = (k: string) => {
    if (k === active) return;
    const to = measure(k);
    const from = indRef.current;
    setActive(k);
    onSelect?.(k);

    if (!to) return;
    window.clearTimeout(timer.current);

    if (!from) {
      indRef.current = to;
      setPhase("settle");
      setInd(to);
      return;
    }

    const start = Math.min(from.p, to.p);
    const end = Math.max(from.p + from.s, to.p + to.s);
    const grow = dilate / 100;

    setPhase("stretch");
    setInd({
      p: to.p + (start - to.p) * grow,
      s: to.s + (end - start - to.s) * grow,
    });

    timer.current = window.setTimeout(() => {
      indRef.current = to;
      setPhase("settle");
      setInd(to);
    }, 150 * rate(speed));
  };

  const style = ind
    ? vertical
      ? { transform: `translate3d(0, ${ind.p}px, 0)`, height: ind.s }
      : { transform: `translate3d(${ind.p}px, 0, 0)`, width: ind.s }
    : { opacity: 0 };

  const curveData = settleCurve(bounce);
  const vars = {
    "--nav-pad": `${hug}px`,
    "--ind-stretch": `${Math.round(190 * rate(speed))}ms`,
    "--ind-settle": `${Math.round(420 * rate(speed))}ms`,
    "--ind-move": curveData.move,
    "--ind-size": curveData.size,
  } as React.CSSProperties;

  return (
    <nav
      ref={trackRef as React.RefObject<HTMLElement>}
      className={cn("gnav", className)}
      data-orientation={vertical ? "vertical" : "horizontal"}
      style={vars}
      aria-label="Navegación principal"
    >
      <span className="gnav-ind" data-phase={phase} style={style} aria-hidden="true" />
      {items.map(({ key, label, Icon, to, end, onClick }) => {
        const isCurrent = active === key;
        const buttonElement = to ? (
          <NavLink
            key={key}
            to={to}
            end={end}
            ref={(el) => {
              refs.current[key] = el;
            }}
            className="gnav-item"
            data-active={isCurrent}
            aria-label={label}
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => {
              select(key);
              onClick?.();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Icon size={glyph} strokeWidth={2} />
          </NavLink>
        ) : (
          <button
            key={key}
            type="button"
            ref={(el) => {
              refs.current[key] = el;
            }}
            className="gnav-item"
            data-active={isCurrent}
            aria-label={label}
            aria-current={isCurrent ? "page" : undefined}
            onClick={() => {
              select(key);
              onClick?.();
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Icon size={glyph} strokeWidth={2} />
          </button>
        );

        return (
          <Tooltip key={key}>
            <TooltipTrigger asChild>{buttonElement}</TooltipTrigger>
            <TooltipContent side={vertical ? "right" : "top"}>
              <span className="text-xs font-medium">{label}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

const NAV_CORNER = 16;

export interface GlassIconBarProps {
  items?: IconNavItem[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  glyph?: number;
  axis?: "row" | "column";
  dilate?: number;
  bounce?: number;
  speed?: number;
  hug?: number;
  corner?: number;
  className?: string;
}

export function GlassIconBar({
  items = DEFAULT_BAR,
  corner = NAV_CORNER,
  className,
  ...props
}: GlassIconBarProps) {
  return (
    <div
      className={cn("bar-well", className)}
      style={{ "--gnav-r": `${clamp(corner, 0, 26)}px` } as React.CSSProperties}
    >
      <IconNav items={items} {...props} />
    </div>
  );
}
