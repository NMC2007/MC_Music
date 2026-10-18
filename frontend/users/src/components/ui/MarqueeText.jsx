import React, { useRef, useState, useEffect } from "react";

/**
 * Component hiển thị text với cơ chế tự động cuộn ngang (Marquee) khi text vượt quá chiều rộng container
 * - Tự động phát hiện overflow bằng ResizeObserver.
 * - Khi text ngắn: đứng yên bình thường.
 * - Khi text dài: tự động cuộn ngang qua lại (ping-pong), dừng 20% thời gian ở đầu và cuối để người dùng đọc dễ dàng.
 * - Có lớp phủ gradient mờ mềm mại ở mép phải khi cuộn.
 */
export const MarqueeText = ({
  text = "",
  as: Component = "span",
  className = "",
  onClick,
  speed = 25, // pixels per second
}) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const textWidth = textRef.current.scrollWidth;
        const diff = textWidth - containerWidth;
        if (diff > 4) {
          setOverflowDistance(diff);
        } else {
          setOverflowDistance(0);
        }
      }
    };

    // Kiểm tra ngay sau render
    checkOverflow();

    let resizeObserver;
    if (typeof ResizeObserver !== "undefined" && containerRef.current) {
      resizeObserver = new ResizeObserver(checkOverflow);
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener("resize", checkOverflow);

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      window.removeEventListener("resize", checkOverflow);
    };
  }, [text]);

  const isOverflowing = overflowDistance > 0;
  // Thời gian cuộn tỷ lệ thuận với độ dài text, tối thiểu 4s
  const duration = Math.max(4, overflowDistance / speed + 2.5);

  return (
    <div
      ref={containerRef}
      className="overflow-hidden relative max-w-full"
      style={
        isOverflowing
          ? {
              maskImage:
                "linear-gradient(to right, black calc(100% - 16px), transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to right, black calc(100% - 16px), transparent 100%)",
            }
          : undefined
      }
      title={text}
    >
      <Component
        ref={textRef}
        onClick={onClick}
        style={
          isOverflowing
            ? {
                "--marquee-distance": `-${overflowDistance + 8}px`,
                animation: `marquee-scroll ${duration}s ease-in-out 1.5s infinite alternate`,
              }
            : undefined
        }
        className={`inline-block whitespace-nowrap ${
          isOverflowing ? "will-change-transform" : ""
        } ${className}`}
      >
        {text}
      </Component>
    </div>
  );
};
