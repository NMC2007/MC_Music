import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = "max-w-lg",
  closeOnOverlayClick = true,
  showCloseButton = true,
  className = "",
}) => {
  // Đóng modal khi nhấn phím ESC và khóa cuộn body khi mở modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Lớp nền mờ Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-200"
        onClick={() => closeOnOverlayClick && onClose?.()}
        aria-hidden="true"
      />

      {/* Nội dung Hộp thoại Modal */}
      <div
        className={`relative w-full ${maxWidth} bg-[#181818] rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.95)] z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {/* Header Modal */}
        {(title || showCloseButton) && (
          <div className="flex items-start justify-between px-6 pt-6 pb-4 bg-white/[0.02]">
            <div>
              {title && (
                <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-xs sm:text-sm text-spotify-sub mt-1">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 ml-4"
                title="Đóng (ESC)"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        {/* Thân Modal */}
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)] scrollbar-thin">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
