import { useState, useEffect } from "react";

/**
 * Shared resize hook. Computes width (capped at 960), height via caller-supplied
 * function, and breakpoint flags.
 * @param {(w: number, vh: number) => number} heightFn
 */
export default function useDims(heightFn) {
  const [dims, setDims] = useState(() => {
    const w = Math.min(960, window.innerWidth - 24);
    return { w, h: heightFn(w, window.innerHeight) };
  });

  useEffect(() => {
    const update = () => {
      const w = Math.min(960, window.innerWidth - 24);
      setDims({ w, h: heightFn(w, window.innerHeight) });
    };
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [heightFn]);

  return {
    w: dims.w,
    h: dims.h,
    isMobile: dims.w <= 480,
    isTablet: dims.w > 480 && dims.w <= 768,
  };
}
