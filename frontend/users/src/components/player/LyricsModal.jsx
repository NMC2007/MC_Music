import React, { useEffect, useMemo } from "react";
import { Mic2, MicOff, X, Music } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { CoverImage } from "../ui/CoverImage";

/**
 * Component hiển thị Lời bài hát (Lyrics Modal/Drawer)
 * - Tối ưu hóa: Chỉ gửi request 1 lần duy nhất cho mỗi bài hát nếu chưa có dữ liệu.
 * - Lưu trạng thái kết quả (có lời hoặc không có lời) vào cache trong playerStore.
 * - Khi mở/đóng lại bài hát đó: 0 request gửi lên mạng!
 */
export const LyricsModal = ({ isOpen, onClose, currentSong }) => {
  const songId = currentSong?.id;
  const { lyricsCache, fetchLyrics } = usePlayerStore();

  const cached = songId ? lyricsCache[songId] : null;

  // Khi modal mở và bài hát chưa có trong cache thì chỉ gọi 1 lần duy nhất
  useEffect(() => {
    if (isOpen && songId && !lyricsCache[songId]) {
      fetchLyrics(songId);
    }
  }, [isOpen, songId, lyricsCache, fetchLyrics]);

  const isLoading = cached?.isLoading || (!cached && isOpen && !!songId);
  const content = cached?.content;
  const language = cached?.language;
  const isNotFound = cached?.notFound || (!isLoading && !content);

  // Tách lời bài hát thành các dòng
  const lines = useMemo(() => {
    if (!content) return [];
    return content.split("\n");
  }, [content]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-24 right-4 w-[420px] max-w-[calc(100vw-32px)] max-h-[600px] bg-[#121212]/95 backdrop-blur-2xl border border-neutral-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-neutral-700/50 shadow-sm">
            <CoverImage
              src={currentSong?.coverUrl || currentSong?.coverImage}
              alt={currentSong?.title || "Song Cover"}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Mic2 size={14} className="text-[#fa2d48] flex-shrink-0" />
              <h5 className="text-sm font-bold text-white truncate">
                {currentSong?.title || "Lời bài hát"}
              </h5>
            </div>
            <p className="text-xs text-spotify-sub truncate mt-0.5">
              {currentSong?.artist || currentSong?.ownerName || currentSong?.artistName}
            </p>
          </div>
        </div>

        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer flex-shrink-0 ml-2"
          title="Đóng"
        >
          <X size={18} />
        </button>
      </div>

      {/* ── NỘI DUNG LỜI BÀI HÁT ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6 select-text">
        {isLoading ? (
          /* TRẠNG THÁI ĐANG TẢI (Chỉ xuất hiện đúng 1 lần khi fetch) */
          <div className="space-y-4 py-8 animate-pulse">
            <div className="h-4 bg-white/10 rounded-full w-3/4 mx-auto" />
            <div className="h-4 bg-white/10 rounded-full w-5/6 mx-auto" />
            <div className="h-4 bg-white/10 rounded-full w-2/3 mx-auto" />
            <div className="h-4 bg-white/10 rounded-full w-4/5 mx-auto" />
            <div className="h-4 bg-white/10 rounded-full w-1/2 mx-auto" />
            <div className="h-4 bg-white/10 rounded-full w-3/4 mx-auto" />
          </div>
        ) : isNotFound || !content || lines.length === 0 ? (
          /* TRẠNG THÁI CHƯA CÓ LỜI BÀI HÁT (Được lưu lại để không gọi lại API) */
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3">
            <div className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-500 shadow-inner">
              <MicOff size={24} />
            </div>
            <div className="space-y-1">
              <h6 className="text-sm font-bold text-white">Chưa có lời bài hát</h6>
              <p className="text-xs text-spotify-sub max-w-[240px]">
                Lời bài hát cho ca khúc này hiện đang được cập nhật.
              </p>
            </div>
          </div>
        ) : (
          /* DANH SÁCH LỜI BÀI HÁT ĐẦY ĐỦ */
          <div className="space-y-3 text-center sm:text-left">
            {lines.map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={idx} className="h-4" />;
              }
              return (
                <p
                  key={idx}
                  className="text-base sm:text-lg font-medium text-neutral-300 hover:text-white transition-colors leading-relaxed tracking-wide"
                >
                  {trimmed}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER NHẸ ── */}
      {language && (
        <div className="px-5 py-2.5 bg-black/40 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
          <span className="flex items-center gap-1">
            <Music size={12} className="text-[#fa2d48]" />
            Ngôn ngữ: {language.toUpperCase()}
          </span>
          <span>MC Music Catalog</span>
        </div>
      )}
    </div>
  );
};
