import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./Button";

export const SectionCarousel = ({ title, children }) => {
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
    
    const observer = new ResizeObserver(() => {
      handleScroll();
    });

    if (scrollRef.current) {
      observer.observe(scrollRef.current);
    }

    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("resize", handleScroll);
      observer.disconnect();
    };
  }, []);

  // Cập nhật lại khi danh sách children thay đổi (nếu có fetch API sau này)
  useEffect(() => {
    handleScroll();
  }, [children]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    
    // Lấy phần tử con đầu tiên (thẻ bài hát) để tính kích thước
    const firstChild = scrollRef.current.firstElementChild;
    if (!firstChild) return;
    
    // Kích thước 1 bài hát = Chiều rộng bài hát (khoảng cách gap đã được loại bỏ)
    const itemWidth = firstChild.offsetWidth; 
    
    // Cuộn đúng 3 bài hát mỗi lần bấm
    const scrollAmount = direction === "left" ? -(itemWidth * 3) : (itemWidth * 3);
    
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="relative group/carousel">
      {title && (
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white hover:underline cursor-pointer">
            {title}
          </h2>
          <span className="text-sm font-bold text-spotify-sub hover:text-white cursor-pointer">
            Hiện tất cả
          </span>
        </div>
      )}

      <div className="relative">
        {/* Fade trái và Nút Prev */}
        {showLeft && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-black to-transparent z-[5] pointer-events-none" />
            <Button
              variant="glass" size="sm" iconOnly
              onClick={() => scroll("left")}
              className="absolute left-5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronLeft size={20} />
            </Button>
          </>
        )}

        {/* Danh sách cuộn - Ẩn thanh cuộn mặc định */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {children}
        </div>

        {/* Fade phải và Nút Next */}
        {showRight && (
          <>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-black to-transparent z-[5] pointer-events-none" />
            <Button
              variant="glass" size="sm" iconOnly
              onClick={() => scroll("right")}
              className="absolute right-5 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            >
              <ChevronRight size={20} />
            </Button>
          </>
        )}
      </div>
    </section>
  );
};
