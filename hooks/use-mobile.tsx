// app/hooks/useIsMobile.ts
"use client";

import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    // during SSR there is no window — default to false
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    // cross-browser safe: prefer addEventListener/removeEventListener, fallback to addListener/removeListener
    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange);
    } else {
      // older browsers
      // @ts-ignore - matchMedia.addListener exists on older types
      mql.addListener(onChange);
    }

    // ensure initial value is accurate on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);

    return () => {
      if (typeof mql.removeEventListener === "function") {
        mql.removeEventListener("change", onChange);
      } else {
        // @ts-ignore
        mql.removeListener(onChange);
      }
    };
  }, []);

  return !!isMobile;
}
