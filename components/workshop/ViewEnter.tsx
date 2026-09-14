"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

const MAX_STAGGER = 10;

export function ViewEnter({
  active,
  className = "",
  children,
}: {
  active: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);
  const [gen, setGen] = useState(0);

  useLayoutEffect(() => {
    if (active && !wasActive.current) {
      setGen((n) => n + 1);
    }
    wasActive.current = active;
    if (!active) return;
    const root = ref.current;
    if (!root) return;
    root.querySelectorAll<HTMLElement>("[data-view-item]").forEach((node, i) => {
      node.style.setProperty("--view-i", String(Math.min(i, MAX_STAGGER)));
    });
  }, [active, gen]);

  return (
    <div
      ref={ref}
      data-view-gen={gen % 2 === 0 ? "a" : "b"}
      className={`${className} ${active ? "view-enter" : "hidden"}`}
    >
      {children}
    </div>
  );
}
