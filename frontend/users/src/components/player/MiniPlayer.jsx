import React from "react";
import { Play, Pause, Heart } from "lucide-react";
import { Button } from "../ui/Button";
import { CoverImage } from "../ui/CoverImage";
import { MarqueeText } from "../ui/MarqueeText";
import { LAYOUT_CONFIG, Z_INDEX } from "../../constants/layout";

/**
 * Trình phát nhạc thu gọn nổi phía trên thanh điều hướng đáy (Dành riêng cho Mobile < 768px).
 * - Hiển thị ảnh bìa, tên bài hát (tự động cuộn nếu dài), nghệ sĩ và các nút Thả tim / Play / Next.
 * - Có thanh tiến trình siêu mỏng 2px màu đỏ neon #fa2d48 sát mép trên.
 * - Chạm vào phần thân sẽ mở trình phát toàn màn hình (MobileFullPlayer).
 */
export const MiniPlayer = React.memo(({
  currentSong,
  isPlaying,
  isLiked,
  progressPercent = 0,
  onTogglePlay,
  onToggleLike,
  onExpand,
}) => {
  if (!currentSong) return null;

  const songTitle = currentSong.title || "Chưa có bài hát";
  const artistName =
    currentSong.artist || currentSong.ownerName || currentSong.artistName || "Nghệ sĩ";

  return (
    <div
      role="region"
      aria-label="Trình phát nhạc thu gọn"
      onClick={onExpand}
      className={`fixed left-2 right-2 md:hidden ${LAYOUT_CONFIG.MINI_PLAYER_BOTTOM_OFFSET} ${LAYOUT_CONFIG.MINI_PLAYER_HEIGHT} ${Z_INDEX.MINI_PLAYER} bg-[#242424]/95 backdrop-blur-md shadow-[0_8px_32px_rgba(0,0,0,0.65)] border border-white/10 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ease-in-out active:scale-[0.99]`}
    >
      {/* Thanh tiến trình siêu mỏng 2px sát mép trên */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/10 pointer-events-none">
        <div
          className="h-full bg-[#fa2d48] shadow-[0_0_6px_rgba(250,45,72,0.85)] transition-[width] duration-200 ease-linear"
          style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
        />
      </div>

      <div className="h-full px-2.5 flex items-center justify-between gap-2">
        {/* Thông tin bài hát bên trái */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <CoverImage
            src={currentSong.coverUrl || currentSong.coverImage}
            alt={songTitle}
            className="w-10 h-10 rounded-lg object-cover shadow-sm flex-shrink-0"
          />
          <div className="min-w-0 flex-1 flex flex-col justify-center overflow-hidden">
            <MarqueeText
              as="h4"
              text={songTitle}
              className="text-[13px] font-bold text-white leading-tight"
            />
            <p className="text-[11px] text-spotify-sub truncate leading-tight mt-0.5">
              {artistName}
            </p>
          </div>
        </div>

        {/* Cụm nút điều khiển bên phải (chỉ gồm nút Tim và Play) */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={isLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike();
            }}
            className={`!w-10 !h-10 hover:bg-white/10 ${
              isLiked ? "!text-[#fa2d48]" : "text-spotify-sub hover:text-white"
            }`}
          >
            <Heart
              size={19}
              className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : ""}
            />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            aria-label={isPlaying ? "Tạm dừng" : "Phát"}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay();
            }}
            className="!w-10 !h-10 text-white hover:bg-white/10"
          >
            {isPlaying ? (
              <Pause size={20} fill="currentColor" strokeWidth={0} />
            ) : (
              <Play
                size={20}
                fill="currentColor"
                strokeWidth={0}
                className="translate-x-[1px]"
              />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
});
