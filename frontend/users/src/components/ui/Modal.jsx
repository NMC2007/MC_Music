import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/**
 * Component Modal hiển thị ở layer trên cùng (gắn trực tiếp vào document.body qua createPortal)
 * - Đảm bảo không bị che khuất bởi Sidebar, Topbar, Player hay bất kỳ layout nào
 * - Hỗ trợ đóng khi click ra ngoài backdrop hoặc bấm phím Escape
 * - Animation mượt mà chuẩn Spotify Dark Theme
 */
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "max-w-[560px]",
  showCloseButton = true,
  closeOnBackdropClick = true,
  closeOnEscape = true,
  className = "",
}) => {
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99990] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0"
        onClick={() => closeOnBackdropClick && onClose?.()}
      />

      {/* Modal Dialog Card */}
      <div
        className={`relative w-full ${maxWidth} bg-[#282828] text-white rounded-xl shadow-2xl border border-neutral-700/60 overflow-hidden z-10 animate-in zoom-in-95 duration-200 ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header nếu có title hoặc nút đóng */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            {typeof title === "string" ? (
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {title}
              </h2>
            ) : (
              title
            )}

            {showCloseButton && (
              <button
                type="button"
                onClick={() => onClose?.()}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-700 transition-colors cursor-pointer"
                title="Đóng"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}

        {/* Nội dung bên trong Modal */}
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;

