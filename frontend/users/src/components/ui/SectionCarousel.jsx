import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

/**
 * Component Carousel hiển thị danh sách cuộn ngang theo chuyên mục.
 * - Mobile: Vuốt mượt cảm ứng (touch-pan-x snap-x snap-mandatory), ẩn nút mũi tên desktop.
 * - Desktop: Nút mũi tên chuyển hướng (ChevronLeft/ChevronRight) nổi khi hover.
 */
export const SectionCarousel = ({ title, onSeeAll, children }) => {
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    // Hiện nút trái nếu đã cuộn qua một chút
    setShowLeft(scrollLeft > 0);
    // Hiện nút phải nếu chưa cuộn tới cuối (cộng thêm 2px để tránh sai số)
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  useEffect(() => {
    handleScroll();

    let observer;
    if (typeof ResizeObserver !== "undefined" && scrollRef.current) {
      observer = new ResizeObserver(() => {
        handleScroll();
      });
      observer.observe(scrollRef.current);
    }

    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("resize", handleScroll);
      if (observer) observer.disconnect();
    };
  }, []);

  // Cập nhật lại khi danh sách children thay đổi
  useEffect(() => {
    handleScroll();
  }, [children]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;

    // Lấy phần tử con đầu tiên để tính kích thước
    const firstChild = scrollRef.current.firstElementChild;
    if (!firstChild) return;

    const itemWidth = firstChild.offsetWidth || 180;

    // Cuộn 3 bài hát mỗi lần bấm trên desktop
    const scrollAmount = direction === "left" ? -(itemWidth * 3) : itemWidth * 3;

    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative group/carousel">
      {title && (
        <div className="flex items-center justify-between mb-3 sm:mb-5">
          <h2
            onClick={onSeeAll}
            className={`text-lg sm:text-2xl font-bold text-white ${
              onSeeAll ? "hover:underline cursor-pointer" : ""
            }`}
          >
            {title}
          </h2>
          {onSeeAll && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSeeAll}
              className="!h-8 px-2 text-xs sm:text-sm font-bold text-spotify-sub hover:text-white"
            >
              Hiện tất cả
            </Button>
          )}
        </div>
      )}

      <div className="relative">
        {/* Fade trái và Nút Prev (Chỉ hiện trên desktop) */}
        {showLeft && (
          <>
            <div className="hidden md:block absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-black/80 to-transparent z-[5] pointer-events-none" />
            <Button
              variant="glass"
              size="sm"
              iconOnly
              aria-label="Cuộn sang trái"
              onClick={() => scroll("left")}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </Button>
          </>
        )}

        {/* Danh sách cuộn - Vuốt mượt trên di động kèm snap */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto pb-2 touch-pan-x snap-x snap-mandatory scroll-smooth scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -mx-1 px-1 sm:mx-0 sm:px-0"
        >
          {children}
        </div>

        {/* Fade phải và Nút Next (Chỉ hiện trên desktop) */}
        {showRight && (
          <>
            <div className="hidden md:block absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-black/80 to-transparent z-[5] pointer-events-none" />
            <Button
              variant="glass"
              size="sm"
              iconOnly
              aria-label="Cuộn sang phải"
              onClick={() => scroll("right")}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}
      </div>
    </section>
  );
};
