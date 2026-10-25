import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "../ui/Button";

/**
 * Modal Xác nhận xóa Playlist khi danh sách phát có chứa ít nhất 1 bài nhạc
 * - Thiết kế chuẩn Spotify Dark Mode
 * - Tự động đóng bằng phím Escape
 */
export const DeletePlaylistConfirmModal = ({
  isOpen,
  onClose,
  playlistName,
  onConfirm,
  isDeleting = false,
}) => {
  // Đóng modal khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && !isDeleting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-[420px] bg-[#282828] text-white rounded-xl shadow-2xl border border-neutral-700/60 p-6 z-10 animate-in zoom-in-95 duration-200 flex flex-col gap-4">
        <h3 className="text-xl font-bold text-white tracking-tight">
          Xóa khỏi Thư viện?
        </h3>

        <p className="text-sm text-neutral-300 leading-relaxed">
          Thao tác này sẽ xóa <strong className="text-white font-semibold">"{playlistName || "danh sách phát"}"</strong> khỏi Thư viện của bạn. Bạn có chắc chắn muốn tiếp tục không?
        </p>

        <div className="flex items-center justify-end gap-3 pt-3">
          {/* Nút Hủy */}
          <button
            type="button"
            onClick={() => !isDeleting && onClose()}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-full text-sm font-bold text-white hover:text-white/80 hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            Hủy
          </button>

          {/* Nút Xóa (Đỏ Neon #fa2d48) */}
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-6 font-bold shadow-lg"
          >
            {isDeleting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <span>Xóa</span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
