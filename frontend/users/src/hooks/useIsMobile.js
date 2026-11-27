import { useState, useEffect } from "react";
import { BREAKPOINTS } from "../constants/layout";

/**
 * Hook theo dõi kích thước màn hình Mobile (< breakpoint md: 768px).
 * Dùng để phân tách hoàn toàn các component Portal (BottomSheet vs Floating Popup Desktop),
 * tránh render đồng thời 2 giao diện đè lên nhau trên PC.
 */
export const useIsMobile = (breakpointPx = BREAKPOINTS.MD_PX) => {
  const getMatches = () => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(`(max-width: ${breakpointPx - 1}px)`).matches;
  };

  const [isMobile, setIsMobile] = useState(getMatches);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);

    const handleChange = (e) => {
      setIsMobile(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [breakpointPx]);

  return isMobile;
};
