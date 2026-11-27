import React, { memo, useEffect, useMemo } from "react";
import { Mic2, MicOff, X, Music } from "lucide-react";
import { usePlayerStore } from "../../store/usePlayerStore";
import { CoverImage } from "../ui/CoverImage";
import { Button } from "../ui/Button";
import { BottomSheet } from "../ui/BottomSheet";
import { Z_INDEX } from "../../constants/layout";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * Nội dung chi tiết của LyricsModal - chỉ mount khi isOpen = true để tránh chạy hooks/render thừa lúc đóng.
 */
const LyricsModalContent = memo(({ onClose, currentSong }) => {
  const isMobile = useIsMobile();
  const songId = currentSong?.id;

  const cached = usePlayerStore((state) => (songId ? state.lyricsCache[songId] : null));
  const fetchLyrics = usePlayerStore((state) => state.fetchLyrics);

  // Khi modal mở và bài hát chưa có trong cache thì chỉ gọi 1 lần duy nhất
  useEffect(() => {
    if (songId && !cached) {
      fetchLyrics(songId);
    }
  }, [songId, cached, fetchLyrics]);

  const isLoading = cached?.isLoading || (!cached && !!songId);
  const content = cached?.content;
  const language = cached?.language;
  const isNotFound = cached?.notFound || (!isLoading && !content);

  // Tách lời bài hát thành các dòng
  const lines = useMemo(() => {
    if (!content) return [];
    return content.split("\n");
  }, [content]);

  const songTitle = currentSong?.title || "Lời bài hát";
  const artistName =
    currentSong?.artist || currentSong?.ownerName || currentSong?.artistName || "MC Music";

  // Hàm render nội dung lời bài hát dùng chung cho cả Mobile và Desktop
  const renderLyricsBody = (mobileLayout = false) => (
    <div className={`flex-1 overflow-y-auto scrollbar-thin select-text ${mobileLayout ? "px-4 sm:px-6 py-4" : "px-6 py-5"}`}>
      {isLoading ? (
        /* TRẠNG THÁI ĐANG TẢI (Skeleton Loading) */
        <div className="space-y-4 py-8 animate-pulse max-w-md mx-auto">
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-3/4 mx-auto`} />
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-5/6 mx-auto`} />
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-2/3 mx-auto`} />
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-4/5 mx-auto`} />
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-1/2 mx-auto`} />
          <div className={`${mobileLayout ? "h-5" : "h-4"} bg-white/10 rounded-full w-3/4 mx-auto`} />
        </div>
      ) : isNotFound || !content || lines.length === 0 ? (
        /* TRẠNG THÁI CHƯA CÓ LỜI BÀI HÁT */
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
        <div className={`space-y-3 ${mobileLayout ? "text-center py-2 max-w-lg mx-auto" : "text-left"}`}>
          {lines.map((line, idx) => {
            const trimmed = line.trim();
            if (!trimmed) {
              return <div key={idx} className={mobileLayout ? "h-5" : "h-4"} />;
            }
            return (
              <p
                key={idx}
                className={`transition-colors leading-relaxed tracking-wide ${
                  mobileLayout
                    ? "text-lg sm:text-xl font-semibold text-neutral-200 hover:text-white active:text-[#fa2d48]"
                    : "text-base font-medium text-neutral-300 hover:text-white"
                }`}
              >
                {trimmed}
              </p>
            );
          })}
        </div>
      )}
    </div>
  );

  // Footer hiển thị ngôn ngữ nếu có
  const renderLyricsFooter = () =>
    language ? (
      <div className="px-5 py-2.5 bg-black/40 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400 flex-shrink-0">
        <span className="flex items-center gap-1.5">
          <Music size={12} className="text-[#fa2d48]" />
          Ngôn ngữ: <strong className="text-neutral-200">{language.toUpperCase()}</strong>
        </span>
        <span>MC Music Catalog</span>
      </div>
    ) : null;

  if (isMobile) {
    return (
      /* ── GIAO DIỆN MOBILE (< 768px): BOTTOM SHEET CHUẨN CÔNG THÁI HỌC ── */
      <BottomSheet
        isOpen
        onClose={onClose}
        heightClass="h-[88dvh] max-h-[88dvh]"
        showDragHandle
        showCloseButton
        zIndexClass={Z_INDEX.MODAL}
        ariaLabel="Lời bài hát"
        className="bg-[#121212] border-t border-neutral-800/80"
        headerLeft={
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-neutral-700/50 shadow-sm">
              <CoverImage
                src={currentSong?.coverUrl || currentSong?.coverImage}
                alt={songTitle}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <Mic2 size={13} className="text-[#fa2d48] flex-shrink-0" />
                <h5 className="text-xs sm:text-sm font-bold text-white truncate max-w-[160px] sm:max-w-[220px]">
                  {songTitle}
                </h5>
              </div>
              <p className="text-[11px] text-spotify-sub truncate max-w-[160px] sm:max-w-[220px] mt-0.5">
                {artistName}
              </p>
            </div>
          </div>
        }
      >
        {renderLyricsBody(true)}
        {renderLyricsFooter()}
      </BottomSheet>
    );
  }

  return (
    /* ── GIAO DIỆN DESKTOP (>= 768px): CỬA SỔ FLOATING GLASSMORPHISM ── */
    <div className="fixed bottom-24 right-4 w-[420px] max-w-[calc(100vw-32px)] max-h-[600px] bg-[#141414]/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 flex flex-col overflow-hidden animate-popup-up">
      {/* Header Desktop */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800/80 bg-neutral-900/60 flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 relative border border-neutral-700/50 shadow-sm">
            <CoverImage
              src={currentSong?.coverUrl || currentSong?.coverImage}
              alt={songTitle}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <Mic2 size={14} className="text-[#fa2d48] flex-shrink-0" />
              <h5 className="text-sm font-bold text-white truncate max-w-[250px]">
                {songTitle}
              </h5>
            </div>
            <p className="text-xs text-spotify-sub truncate max-w-[250px] mt-0.5">
              {artistName}
            </p>
          </div>
        </div>

        {/* Nút đóng chuẩn Button component */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          onClick={onClose}
          aria-label="Đóng"
          className="text-neutral-400 hover:text-white hover:bg-white/10 flex-shrink-0 ml-2"
          tooltip="Đóng"
          tooltipPosition="bottom"
        >
          <X size={18} />
        </Button>
      </div>

      {/* Nội dung Desktop */}
      {renderLyricsBody(false)}

      {/* Footer Desktop */}
      {renderLyricsFooter()}
    </div>
  );
});

LyricsModalContent.displayName = "LyricsModalContent";

/**
 * Component hiển thị Lời bài hát (Lyrics Modal / BottomSheet)
 */
export const LyricsModal = memo(({ isOpen, onClose, currentSong }) => {
  if (!isOpen) return null;
  return <LyricsModalContent onClose={onClose} currentSong={currentSong} />;
});

LyricsModal.displayName = "LyricsModal";
