import React from "react";
import { Calendar, MoreHorizontal, RotateCcw, ListMusic } from "lucide-react";
import { CoverImage } from "#/components/ui/CoverImage";
import { StatusBadge } from "#/components/ui/StatusBadge";
import { MarqueeText } from "#/components/ui/MarqueeText";
import { formatDate } from "#/utils/formatters";

export const AlbumCard = ({
  album,
  isTrash = false,
  onOpenDetail,
  onOpenMenu,
  onRestore,
}) => {
  return (
    <div
      onClick={() => {
        if (!isTrash) onOpenDetail?.(album);
      }}
      className="p-4 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all group shadow-lg flex flex-col justify-between cursor-pointer border border-white/[0.03] hover:border-white/[0.08]"
    >
      <div>
        {/* Cover Art với Badge Loại Album */}
        <div className="relative mb-3.5 w-full aspect-square rounded-xl overflow-hidden bg-neutral-800 shadow-md">
          <CoverImage
            src={album.coverImage}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            isAlbum
          />

          {/* Badge Loại Album */}
          <div className="absolute top-2 right-2">
            <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
              {album.albumType || "ALBUM"}
            </span>
          </div>

          {/* Overlay nút Xem Tracklist khi hover (chỉ khi không ở thùng rác) */}
          {!isTrash && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 transition-opacity">
              <span className="px-3 py-1.5 rounded-full bg-[#fa2d48] text-white text-xs font-bold flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <ListMusic size={14} /> Quản lý Tracklist
              </span>
            </div>
          )}
        </div>

        {/* Tiêu đề & Thông tin */}
        <div className="min-w-0">
          <MarqueeText
            text={album.title}
            as="h3"
            className="font-bold text-white text-sm transition-colors group-hover:text-[#fa2d48]"
          />
          <p className="text-xs text-neutral-400 mt-1 flex items-center justify-between">
            <span>{album.totalTracks || 0} bài hát</span>
            <span className="flex items-center gap-1 text-[11px] text-neutral-500">
              <Calendar size={12} /> {formatDate(album.releaseDate || album.createdAt)}
            </span>
          </p>
        </div>
      </div>

      {/* Footer: Trạng thái & Menu Thao tác */}
      <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/[0.04] text-[11px]">
        {isTrash ? (
          <span className="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/25 text-rose-300 text-[10px] font-bold">
            Đã xóa
          </span>
        ) : (
          <StatusBadge status={album.status} size="sm" />
        )}

        <div className="flex items-center gap-1">
          {isTrash ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRestore?.(album);
              }}
              className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 flex items-center gap-1 transition-all cursor-pointer"
              title="Khôi phục Album và toàn bộ bài hát bên trong"
            >
              <RotateCcw size={11} />
              Khôi phục
            </button>
          ) : (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu?.(e, album);
              }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
              title="Thao tác"
            >
              <MoreHorizontal size={15} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlbumCard;

