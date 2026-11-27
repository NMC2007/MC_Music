import React, { useRef, useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/**
 * Thanh bộ lọc dạng chip có ray trượt ngang và hai nút điều hướng kính mờ.
 */
export const FilterChipsBar = React.memo(({
  items = [],
  selectedKey = null,
  onSelect,
  allLabel = null,
  activeVariant = "primary", // "primary" | "white"
  toggleable = false,
  fadeColorClass = "from-[#121212]",
  scrollContainerClassName = "px-1 py-1",
  className = "",
}) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeft(el.scrollLeft > 4);
    setShowRight(Math.ceil(el.scrollLeft + el.clientWidth) < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    const observer = new ResizeObserver(updateScrollButtons);
    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }
    window.addEventListener("resize", updateScrollButtons);
    return () => {
      window.removeEventListener("resize", updateScrollButtons);
      observer.disconnect();
    };
  }, [updateScrollButtons, items.length]);

  const scrollByDirection = (direction) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -240 : 240,
      behavior: "smooth",
    });
  };

  const getChipClass = (isActive) => {
    if (isActive) {
      return activeVariant === "white"
        ? "bg-white text-black border-white font-bold shadow-sm"
        : "bg-[#fa2d48] text-white border-[#fa2d48] font-bold shadow-[0_2px_10px_rgba(250,45,72,0.35)]";
    }
    return "bg-[#232323] hover:bg-[#2a2a2a] text-neutral-300 hover:text-white border-transparent";
  };

  return (
    <div className={`relative group/chips ${className}`}>
      {showLeft && (
        <>
          <div
            className={`absolute left-0 top-0 bottom-0 w-14 bg-gradient-to-r ${fadeColorClass} via-[#121212]/90 to-transparent z-[5] pointer-events-none rounded-l-full`}
          />
          <Button
            type="button"
            variant="glass"
            size="sm"
            iconOnly
            onClick={() => scrollByDirection("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-90 group-hover/chips:opacity-100 hover:scale-110 active:scale-95 transition-all"
            title="Cuộn sang trái"
          >
            <ChevronLeft size={18} />
          </Button>
        </>
      )}

      <div
        ref={scrollRef}
        onScroll={updateScrollButtons}
        className={`flex items-center gap-2 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${scrollContainerClassName}`}
      >
        {allLabel && (
          <button
            type="button"
            onClick={() => onSelect?.(null)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer flex-shrink-0 border ${getChipClass(
              selectedKey === null
            )}`}
          >
            {allLabel}
          </button>
        )}

        {items.map((item) => {
          const itemKey = typeof item === "string" ? item : item.key;
          const itemLabel = typeof item === "string" ? item : item.label;
          const isActive = selectedKey === itemKey;

          return (
            <button
              key={itemKey ?? itemLabel}
              type="button"
              onClick={() => onSelect?.(toggleable && isActive ? null : itemKey)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm transition-all cursor-pointer flex-shrink-0 border ${getChipClass(
                isActive
              )}`}
            >
              {itemLabel}
            </button>
          );
        })}
      </div>

      {showRight && (
        <>
          <div
            className={`absolute right-0 top-0 bottom-0 w-14 bg-gradient-to-l ${fadeColorClass} via-[#121212]/90 to-transparent z-[5] pointer-events-none rounded-r-full`}
          />
          <Button
            type="button"
            variant="glass"
            size="sm"
            iconOnly
            onClick={() => scrollByDirection("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-90 group-hover/chips:opacity-100 hover:scale-110 active:scale-95 transition-all"
            title="Cuộn sang phải"
          >
            <ChevronRight size={18} />
          </Button>
        </>
      )}
    </div>
  );
});
