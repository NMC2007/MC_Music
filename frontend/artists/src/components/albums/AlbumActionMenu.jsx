import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { ListMusic, Pencil, Trash2, RotateCcw } from "lucide-react";

/**
 * AlbumActionMenu: Menu thao tác nổi (React Portal) dành riêng cho Album
 */
export const AlbumActionMenu = ({
  anchorRect,
  isTrash = false,
  onViewDetails,
  onEdit,
  onDelete,
  onRestore,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    const handleScrollOrResize = () => onClose();

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

  const MENU_WIDTH = 210;
  const MENU_HEIGHT = isTrash ? 75 : 155;
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

  const menuItems = isTrash
    ? [
        {
          label: "Khôi phục Album",
          icon: RotateCcw,
          action: () => {
            onRestore?.();
            onClose();
          },
          className: "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 font-bold",
        },
      ]
    : [
        {
          label: "Quản lý Tracklist",
          icon: ListMusic,
          action: () => {
            onViewDetails?.();
            onClose();
          },
          className: "text-white font-medium hover:text-[#fa2d48]",
        },
        null, // Divider
        {
          label: "Chỉnh sửa Album",
          icon: Pencil,
          action: () => {
            onEdit?.();
            onClose();
          },
          className: "text-white hover:text-[#fa2d48]",
        },
        {
          label: "Xóa Album",
          icon: Trash2,
          action: () => {
            onDelete?.();
            onClose();
          },
          className: "text-rose-400 hover:text-rose-300 hover:bg-rose-500/10",
        },
      ];

  return createPortal(
    <>
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
              <Icon size={14} className="flex-shrink-0 opacity-80" />
              {item.label}
            </button>
          );
        })}
      </div>
    </>,
    document.body
  );
};

export default AlbumActionMenu;

