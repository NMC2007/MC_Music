import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { Button } from "./Button";
import { Z_INDEX } from "../../constants/layout";

/**
 * Component nền tảng dùng chung (Shared Primitive) dạng Bottom Sheet cho Mobile/Tablet.
 * - Tái sử dụng cho: Trình phát toàn màn hình (MobileFullPlayer), Lời bài hát (Lyrics), Hàng đợi (Queue), Menu Playlist.
 * - Hỗ trợ Portal rendering, khóa cuộn body, phím ESC, nhấn nền để đóng, và cử chỉ vuốt xuống (Swipe down) tại vùng thanh nắm/header.
 */
export const BottomSheet = ({
  isOpen,
  onClose,
  title = null,
  headerLeft = null,
  headerRight = null,
  fullScreen = false,
  heightClass = "max-h-[90dvh]",
  className = "bg-[#121212] border-t border-neutral-800/80",
  headerClassName = "",
  showDragHandle = true,
  showCloseButton = true,
  zIndexClass = Z_INDEX.MODAL,
  ariaLabel = "Bảng điều khiển trượt",
  children,
}) => {
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [hasEntered, setHasEntered] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const touchStartYRef = useRef(0);

  // Đồng bộ reset trạng thái ngay trong render-phase khi mở/đóng sheet
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setHasEntered(false);
    setDragOffset(0);
    setIsDragging(false);
  }

  // Khóa cuộn nền (body scroll lock) và lắng nghe phím Escape khi sheet đang mở
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    touchStartYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const delta = e.touches[0].clientY - touchStartYRef.current;
    if (delta > 0) {
      setDragOffset(delta);
    } else {
      setDragOffset(0);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 90) {
      setDragOffset(0);
      onClose?.();
    } else {
      setDragOffset(0);
    }
  };

  const hasHeader = showDragHandle || headerLeft || title || headerRight || showCloseButton;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={`fixed inset-0 ${zIndexClass} flex items-end justify-center`}
    >
      {/* Lớp phủ nền mờ (Backdrop) - Không dùng backdrop-blur toàn màn hình để tránh nghẽn GPU khi trượt */}
      {!fullScreen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/75 animate-sheet-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Thân Sheet trượt từ dưới lên */}
      <div
        onAnimationEnd={() => setHasEntered(true)}
        style={{
          transform: hasEntered && dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
          transition: isDragging
            ? "none"
            : "transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        className={`relative w-full flex flex-col overflow-hidden shadow-[0_-12px_48px_rgba(0,0,0,0.85)] ${
          !hasEntered ? "animate-sheet-up" : ""
        } ${
          fullScreen
            ? "h-[100dvh] rounded-none"
            : `${heightClass} rounded-t-2xl pb-[env(safe-area-inset-bottom,0px)]`
        } ${className}`}
      >
        {/* Vùng Header & Thanh nắm vuốt (Drag Handle) độc lập với nội dung cuộn */}
        {hasHeader && (
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`flex-shrink-0 select-none touch-none ${headerClassName}`}
          >
            {showDragHandle && (
              <div className="flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing">
                <span className="w-10 h-1 rounded-full bg-neutral-600/80" />
              </div>
            )}

            {(headerLeft || title || headerRight || showCloseButton) && (
              <div className="flex items-center justify-between gap-2 px-4 py-2 min-h-[48px]">
                <div className="flex items-center min-w-[40px] justify-start">
                  {headerLeft}
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-center">
                  {typeof title === "string" ? (
                    <h3 className="text-sm font-bold text-white truncate">
                      {title}
                    </h3>
                  ) : (
                    title
                  )}
                </div>

                <div className="flex items-center min-w-[40px] justify-end gap-1">
                  {headerRight}
                  {showCloseButton && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label="Đóng"
                      onClick={onClose}
                      className="text-spotify-sub hover:text-white hover:bg-white/10"
                    >
                      <X size={20} />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Nội dung chính */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
