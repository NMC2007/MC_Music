import React, { useEffect, useRef, useState, useLayoutEffect, useCallback } from "react";
import { createPortal } from "react-dom";

/**
 * Hàm tính toán toạ độ vị trí Popover dựa trên Trigger và kích thước Popover
 */
const computePopoverPosition = (triggerEl, popoverEl, placement, offset) => {
  if (!triggerEl) return { top: 0, left: 0, ready: false };

  const triggerRect = triggerEl.getBoundingClientRect();
  const windowWidth = window.innerWidth;
  const windowHeight = window.innerHeight;

  // Nếu popover đã mount thì lấy kích thước thật, nếu chưa thì ước lượng chính xác
  const popoverWidth = popoverEl?.offsetWidth || 256;
  const popoverHeight = popoverEl?.offsetHeight || 260;

  let top = 0;
  let left = 0;

  // 1. Tính toán trục Y (Vertical: Tránh tràn đỉnh/đáy)
  const spaceBelow = windowHeight - triggerRect.bottom;
  const spaceAbove = triggerRect.top;

  let placeAbove = false;
  if (placement.startsWith("top")) {
    placeAbove = true;
  } else if (placement.startsWith("bottom")) {
    placeAbove = false;
  } else {
    // "auto": nếu bên dưới không đủ chỗ và bên trên còn nhiều chỗ hơn -> mở lên trên
    placeAbove = spaceBelow < popoverHeight + offset && spaceAbove > spaceBelow;
  }

  if (placeAbove) {
    top = triggerRect.top - popoverHeight - offset;
  } else {
    top = triggerRect.bottom + offset;
  }

  // 2. Tính toán trục X (Horizontal: Tránh tràn trái/phải, đặc biệt tránh đè Sidebar bên trái)
  let placeStart = false; // true = căn mép trái trigger (mở sang phải); false = căn mép phải trigger (mở sang trái)
  if (placement.endsWith("-start")) {
    placeStart = true;
  } else if (placement.endsWith("-end")) {
    placeStart = false;
  } else {
    // "auto":
    // Nếu trigger nằm ở bên trái (khoảng cách tới mép trái < chiều rộng popover + 40px),
    // BẮT BUỘC mở sang phải (placeStart = true) để không bao giờ bị đè vào Sidebar bên trái!
    if (triggerRect.left < popoverWidth + 40) {
      placeStart = true;
    } else if (windowWidth - triggerRect.right < popoverWidth + 40) {
      // Nếu trigger nằm sát mép phải màn hình -> mở sang trái
      placeStart = false;
    } else {
      // Mặc định: căn lề phải của trigger nếu có đủ chỗ
      placeStart = false;
    }
  }

  if (placeStart) {
    left = triggerRect.left;
  } else {
    left = triggerRect.right - popoverWidth;
  }

  // 3. Viewport Clamping (Bảo vệ tuyệt đối: Đảm bảo popup luôn nằm trọn trong viewport)
  const minMargin = 16;
  if (left < minMargin) {
    left = minMargin;
  } else if (left + popoverWidth > windowWidth - minMargin) {
    left = windowWidth - popoverWidth - minMargin;
  }

  if (top < minMargin) {
    top = minMargin;
  } else if (top + popoverHeight > windowHeight - minMargin) {
    top = windowHeight - popoverHeight - minMargin;
  }

  return { top, left, ready: true };
};

/**
 * Component Popover hiển thị ở layer trên cùng (gắn trực tiếp vào document.body qua createPortal)
 * - Khắc phục hoàn toàn lỗi trượt từ trên xuống ở lần mở đầu tiên (tính toạ độ đồng bộ ngay từ lúc mount)
 * - Tự động phát hiện va chạm lề màn hình (Viewport Clamping)
 * - Tự động lật hướng mở (Auto Flip) khi không đủ không gian
 * - Tự động bám theo phần tử khi cuộn trang (Scroll tracking)
 * - Đóng khi click ra ngoài hoặc bấm phím Escape
 */
export const Popover = ({
  isOpen,
  onClose,
  triggerRef,
  placement = "auto", // "auto" | "bottom-start" | "bottom-end" | "top-start" | "top-end"
  offset = 8,
  className = "",
  children,
}) => {
  const popoverRef = useRef(null);

  // Tính toạ độ tức thì ngay khi mở, KHÔNG dùng toạ độ rác (-9999 hay 0) tránh hiệu ứng nhảy/trượt
  const [coords, setCoords] = useState(() => {
    if (triggerRef?.current) {
      return computePopoverPosition(triggerRef.current, null, placement, offset);
    }
    return { top: 0, left: 0, ready: false };
  });

  const updatePosition = useCallback(() => {
    if (!triggerRef?.current) return;
    const newCoords = computePopoverPosition(
      triggerRef.current,
      popoverRef.current,
      placement,
      offset
    );
    setCoords(newCoords);
  }, [triggerRef, placement, offset]);

  // useLayoutEffect chạy đồng bộ trước khi trình duyệt paint ra màn hình
  useLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Lắng nghe resize, scroll, click outside, phím Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          onClose?.();
          return;
        }
      }
      updatePosition();
    };

    window.addEventListener("resize", handleScrollOrResize);
    window.addEventListener("scroll", handleScrollOrResize, true);

    // Xử lý Click Outside
    const handleClickOutside = (e) => {
      const isClickInsidePopover = popoverRef.current && popoverRef.current.contains(e.target);
      const isClickInsideTrigger = triggerRef.current && triggerRef.current.contains(e.target);

      if (!isClickInsidePopover && !isClickInsideTrigger) {
        onClose?.();
      }
    };

    // Xử lý Escape Key
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 0);

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleScrollOrResize);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, triggerRef, updatePosition]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: "fixed",
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        visibility: coords.ready ? "visible" : "hidden",
        transitionProperty: "opacity, transform", // Chỉ cho phép transition opacity và transform, KHÔNG transition top/left
      }}
      className={`z-[99999] select-none animate-in fade-in-0 zoom-in-95 duration-100 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

export default Popover;
