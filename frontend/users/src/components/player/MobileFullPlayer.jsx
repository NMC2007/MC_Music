import React from "react";
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  Mic2,
  ListMusic,
} from "lucide-react";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { CoverImage } from "../ui/CoverImage";
import { MarqueeText } from "../ui/MarqueeText";
import { TouchSlider } from "../ui/TouchSlider";
import { AddToPlaylistMenu } from "../playlist/AddToPlaylistMenu";
import { Z_INDEX } from "../../constants/layout";

/**
 * Trình phát nhạc toàn màn hình cho thiết bị di động (Mobile Fullscreen Player).
 * - Tái sử dụng component nền tảng BottomSheet với chế độ fullScreen và hỗ trợ vuốt xuống từ thanh tiêu đề để thu nhỏ.
 * - Nút Play/Pause sử dụng màu đỏ neon #fa2d48 chuẩn Spotify Red Theme.
 */
export const MobileFullPlayer = React.memo(({
  isOpen,
  onClose,
  currentSong,
  isPlaying,
  onTogglePlay,
  onNext,
  onPrevious,
  isShuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  currentTime,
  duration,
  onSeek,
  formatTime,
  isLiked,
  onToggleLike,
  queueCount = 0,
  isLyricsOpen,
  isQueueOpen,
  onOpenLyrics,
  onOpenQueue,
  onSongClick,
  onArtistClick,
}) => {
  if (!currentSong) return null;

  const songTitle = currentSong.title || "Chưa có bài hát";
  const artistName =
    currentSong.artist || currentSong.ownerName || currentSong.artistName || "Nghệ sĩ";

  const handleNavigateSong = () => {
    onClose?.();
    onSongClick?.();
  };

  const handleNavigateArtist = () => {
    onClose?.();
    onArtistClick?.();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      fullScreen
      showDragHandle={false}
      showCloseButton={false}
      zIndexClass={Z_INDEX.FULL_PLAYER}
      ariaLabel="Trình phát nhạc toàn màn hình"
      className="bg-gradient-to-b from-[#2a1215] via-[#121212] to-[#0a0a0a] px-5 sm:px-8 pt-[max(10px,env(safe-area-inset-top))] pb-[max(16px,env(safe-area-inset-bottom))]"
      headerClassName="pt-1"
      headerLeft={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          iconOnly
          aria-label="Thu nhỏ trình phát"
          onClick={onClose}
          className="!w-10 !h-10 text-white hover:bg-white/10"
        >
          <ChevronDown size={26} />
        </Button>
      }
      title={
        <div className="flex flex-col items-center text-center min-w-0">
          <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-spotify-sub">
            Đang phát
          </span>
          {currentSong.albumTitle && (
            <span className="text-xs font-semibold text-white truncate max-w-[210px] mt-0.5">
              {currentSong.albumTitle}
            </span>
          )}
        </div>
      }
      headerRight={
        <AddToPlaylistMenu
          song={currentSong}
          align="bottom-end"
          buttonClassName="!w-10 !h-10 text-white hover:bg-white/10"
        />
      }
    >
      <div className="flex-1 flex flex-col justify-between min-h-0 overflow-y-auto scrollbar-thin">
        {/* Vùng ảnh bìa trung tâm co giãn thông minh theo cả chiều ngang và dọc */}
        <div className="flex-1 flex items-center justify-center py-4 min-h-0">
          <div
            onClick={handleNavigateSong}
            className="w-[min(78vw,38dvh)] sm:w-[min(70vw,42dvh)] max-w-[360px] aspect-square rounded-2xl overflow-hidden shadow-[0_14px_45px_rgba(250,45,72,0.18)] border border-white/10 bg-spotify-card cursor-pointer transition-transform duration-300 active:scale-[0.98]"
          >
            <CoverImage
              src={currentSong.coverUrl || currentSong.coverImage}
              alt={songTitle}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Khu vực thông tin và bảng điều khiển cảm ứng bên dưới */}
        <div className="flex-shrink-0 flex flex-col gap-4 pb-2">
          {/* Tên bài hát, nghệ sĩ & nút Thả tim */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1 overflow-hidden">
              <MarqueeText
                as="h2"
                text={songTitle}
                onClick={handleNavigateSong}
                className="text-xl sm:text-2xl font-bold text-white cursor-pointer hover:underline"
              />
              <MarqueeText
                as="p"
                text={artistName}
                onClick={handleNavigateArtist}
                className="text-sm sm:text-base text-spotify-sub hover:text-white mt-0.5 cursor-pointer transition-colors"
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="md"
              iconOnly
              aria-label={isLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"}
              onClick={onToggleLike}
              className={`!w-11 !h-11 flex-shrink-0 hover:bg-white/10 ${
                isLiked ? "!text-[#fa2d48] scale-105" : "text-spotify-sub hover:text-white"
              }`}
            >
              <Heart
                size={24}
                className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : ""}
              />
            </Button>
          </div>

          {/* Thanh trượt tua nhạc cảm ứng (Touch Seekbar) */}
          <div className="flex flex-col gap-0.5">
            <TouchSlider
              value={currentTime}
              min={0}
              max={duration || 100}
              onChange={onSeek}
              trackHeight="h-1.5"
              trackBg="bg-white/15"
              activeColor="bg-[#fa2d48]"
              thumbSize="h-3.5 w-3.5"
              alwaysShowThumb
              hitAreaClass="py-2.5"
              ariaLabel="Tua thời gian bài hát"
            />
            <div className="flex items-center justify-between text-xs font-medium text-spotify-sub tabular-nums">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Cụm nút điều khiển phát nhạc cỡ lớn */}
          <div className="flex items-center justify-between px-1">
            {/* Trộn bài */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
              onClick={onToggleShuffle}
              className={`!w-11 !h-11 relative hover:bg-white/10 ${
                isShuffle ? "!text-[#fa2d48]" : "text-spotify-sub hover:text-white"
              }`}
            >
              <Shuffle size={20} />
              {isShuffle && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full shadow-[0_0_8px_rgba(250,45,72,0.9)]" />
              )}
            </Button>

            {/* Lùi bài */}
            <Button
              type="button"
              variant="ghost"
              size="md"
              iconOnly
              aria-label="Bài trước"
              onClick={onPrevious}
              className="!w-12 !h-12 text-white hover:bg-white/10"
            >
              <SkipBack size={26} fill="currentColor" />
            </Button>

            {/* Play / Pause đỏ Neon #fa2d48 */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              iconOnly
              aria-label={isPlaying ? "Tạm dừng" : "Phát"}
              onClick={onTogglePlay}
              className="!w-16 !h-16 shadow-[0_8px_24px_rgba(250,45,72,0.45)]"
            >
              {isPlaying ? (
                <Pause size={28} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play
                  size={28}
                  fill="currentColor"
                  strokeWidth={0}
                  className="translate-x-[2px]"
                />
              )}
            </Button>

            {/* Tiếp theo */}
            <Button
              type="button"
              variant="ghost"
              size="md"
              iconOnly
              aria-label="Bài tiếp theo"
              onClick={onNext}
              className="!w-12 !h-12 text-white hover:bg-white/10"
            >
              <SkipForward size={26} fill="currentColor" />
            </Button>

            {/* Lặp lại */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              iconOnly
              aria-label="Chế độ lặp lại"
              onClick={onToggleRepeat}
              className={`!w-11 !h-11 relative hover:bg-white/10 ${
                repeatMode !== "off" ? "!text-[#fa2d48]" : "text-spotify-sub hover:text-white"
              }`}
            >
              {repeatMode === "one" ? <Repeat1 size={20} /> : <Repeat size={20} />}
              {repeatMode !== "off" && (
                <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full shadow-[0_0_8px_rgba(250,45,72,0.9)]" />
              )}
            </Button>
          </div>

          {/* Thanh hành động đáy: Lời bài hát (Lyrics) & Hàng đợi (Queue) */}
          <div className="flex items-center justify-between pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenLyrics}
              className={`!h-10 px-3 text-xs font-semibold ${
                isLyricsOpen ? "!text-[#fa2d48]" : "text-spotify-sub hover:text-white"
              }`}
            >
              <Mic2 size={18} />
              <span>Lời bài hát</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onOpenQueue}
              className={`!h-10 px-3 text-xs font-semibold ${
                isQueueOpen ? "!text-[#fa2d48]" : "text-spotify-sub hover:text-white"
              }`}
            >
              <ListMusic size={18} />
              <span>Hàng đợi{queueCount > 0 ? ` (${queueCount})` : ""}</span>
            </Button>
          </div>
        </div>
      </div>
    </BottomSheet>
  );
});
