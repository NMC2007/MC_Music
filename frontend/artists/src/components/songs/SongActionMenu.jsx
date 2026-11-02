import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Pause, FileText, Users, Pencil, Trash2, Headphones } from "lucide-react";
import { notifyFeatureInDevelopment } from "#/utils/toastUtils";

/**
 * SongActionMenu: Menu thao tác nổi (React Portal) gắn trực tiếp vào document.body
 * - Sử dụng tọa độ `anchorRect` nhận từ nút bấm để tính toán vị trí hiển thị.
 * - Tự động lật lên trên (dropup) nếu phía dưới không đủ 215px.
 * - Sử dụng backdrop trong suốt giúp đóng menu khi click ra ngoài mà không xung đột sự kiện.
 * - Tự động đóng khi cuộn trang hoặc nhấn ESC.
 */
export const SongActionMenu = ({
  anchorRect,
  isPreviewPlaying,
  onTogglePreview,
  onEditLyrics,
  onAddArtist,
  onClose,
}) => {
  // Đóng menu khi nhấn Escape hoặc khi người dùng cuộn trang/resize
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleScrollOrResize = () => {
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [onClose]);

  if (!anchorRect) return null;

  // Tính toán vị trí fixed
  const MENU_WIDTH = 208; // w-52 = 13rem = 208px
  const MENU_HEIGHT = 215; // chiều cao menu
  const GAP = 4;

  const spaceBelow = window.innerHeight - anchorRect.bottom;
  const openUpward = spaceBelow < MENU_HEIGHT && anchorRect.top > MENU_HEIGHT;

  const top = openUpward
    ? Math.max(10, anchorRect.top - MENU_HEIGHT - GAP)
    : Math.min(window.innerHeight - MENU_HEIGHT - 10, anchorRect.bottom + GAP);

  let left = anchorRect.right - MENU_WIDTH;
  if (left < 10) left = 10;
  if (left + MENU_WIDTH > window.innerWidth - 10) {
    left = window.innerWidth - MENU_WIDTH - 10;
  }

  const menuItems = [
    {
      label: isPreviewPlaying ? "Dừng nghe thử" : "Nghe thử bài hát",
      icon: isPreviewPlaying ? Pause : Headphones,
      action: () => {
        onTogglePreview();
        onClose();
      },
      className: "text-white",
    },
    null, // Divider
    {
      label: "Cập nhật lời bài hát",
      icon: FileText,
      action: () => {
        onEditLyrics();
        onClose();
      },
      className: "text-white",
    },
    {
      label: "Thêm nghệ sĩ hợp tác",
      icon: Users,
      action: () => {
        onAddArtist();
        onClose();
      },
      className: "text-white",
    },
    null, // Divider
    {
      label: "Chỉnh sửa thông tin",
      icon: Pencil,
      action: () => {
        notifyFeatureInDevelopment("Chỉnh sửa bài hát");
        onClose();
      },
      className: "text-white",
    },
    {
      label: "Xóa bài hát",
      icon: Trash2,
      action: () => {
        notifyFeatureInDevelopment("Xóa bài hát");
        onClose();
      },
      className: "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10",
    },
  ];

  return createPortal(
    <>
      {/* Backdrop trong suốt bắt click ra ngoài để đóng menu */}
      <div
        className="fixed inset-0 z-[99998] bg-transparent"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Menu nổi */}
      <div
        style={{
          position: "fixed",
          top: `${top}px`,
          left: `${left}px`,
          zIndex: 99999,
        }}
        className={`w-52 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.95)] py-1.5 animate-in fade-in zoom-in-95 duration-150 ${
          openUpward ? "origin-bottom-right" : "origin-top-right"
        }`}
      >
        {menuItems.map((item, idx) => {
          if (item === null) {
            return <div key={idx} className="my-1 border-t border-white/[0.04]" />;
          }
          const Icon = item.icon;
          return (
            <button
              key={idx}
              type="button"
              onClick={item.action}
              className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-medium transition-colors cursor-pointer text-left hover:bg-white/[0.05] ${
                item.className || "text-white"
              }`}
            >
              <Icon size={14} className="flex-shrink-0 opacity-75" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );
};

export default SongActionMenu;
