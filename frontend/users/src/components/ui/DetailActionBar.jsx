import React from "react";
import { Play, Pause, Shuffle, Heart, Share2 } from "lucide-react";
import { Button } from "./Button";

/**
 * Component thanh điều khiển phát nhạc và tương tác dùng chung cho các trang chi tiết
 * (SongPage, AlbumPage, PlaylistPage, ArtistPage)
 * Không bị dính cứng (sticky) trên đỉnh trang, cuộn tự nhiên theo nội dung trang.
 */
export const DetailActionBar = ({
  isPlaying = false,
  onPlay,
  isLoading = false,
  disabled = false,
  onShuffle,
  isLiked = undefined, // boolean nếu có nút Like, undefined nếu không hiển thị
  onLike,
  likeTooltip,
  isFollowed = undefined, // boolean nếu có nút Follow
  onFollow,
  menuComponent, // ReactNode (ví dụ: <AddToPlaylistMenu />)
  onShare,
  children, // Các thành phần phụ bên phải (ví dụ search box, filter chips)
  gradientFrom = "from-[#1a0a0a]/60",
  className = "",
}) => {
  return (
    <div
      className={`flex items-center justify-between gap-4 px-6 md:px-10 py-5 bg-gradient-to-b ${gradientFrom} to-transparent ${className}`}
    >
      <div className="flex items-center gap-4 flex-wrap">
        {/* Nút Play chính to tròn */}
        {onPlay && (
          <button
            type="button"
            onClick={onPlay}
            disabled={disabled || isLoading}
            className="w-14 h-14 rounded-full bg-[#fa2d48] hover:bg-[#ff4b63] hover:scale-105 active:scale-95 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(250,45,72,0.35)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title={isPlaying ? "Tạm dừng" : "Phát"}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause size={24} fill="white" className="text-white" />
            ) : (
              <Play size={24} fill="white" className="text-white ml-1" />
            )}
          </button>
        )}

        {/* Nút Trộn bài (nếu có) */}
        {onShuffle && (
          <Button
            variant="ghost"
            size="md"
            iconOnly
            tooltip="Trộn bài"
            tooltipPosition="top"
            onClick={onShuffle}
            disabled={disabled}
            className="hover:scale-110 active:scale-95 transition-transform"
          >
            <Shuffle size={22} />
          </Button>
        )}

        {/* Nút Yêu thích (nếu có isLiked hoặc onLike) */}
        {onLike && (
          <button
            type="button"
            onClick={onLike}
            className={`w-11 h-11 rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer ${
              isLiked
                ? "text-[#fa2d48] hover:bg-white/10"
                : "text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
            title={
              likeTooltip ||
              (isLiked
                ? "Xóa khỏi danh sách yêu thích"
                : "Thêm vào danh sách yêu thích")
            }
          >
            <Heart
              size={26}
              className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : "currentColor"}
            />
          </button>
        )}

        {/* Nút Theo dõi (nếu là Artist) */}
        {onFollow && (
          <button
            type="button"
            onClick={onFollow}
            className={`px-5 py-2 rounded-full text-xs font-bold border transition-all cursor-pointer select-none ${
              isFollowed
                ? "bg-white/10 text-white border-white/40 hover:bg-white/20 hover:border-white"
                : "border-neutral-500 hover:border-white text-white bg-transparent hover:scale-105 active:scale-95"
            }`}
          >
            {isFollowed ? "Đang theo dõi" : "Theo dõi"}
          </button>
        )}

        {/* Component menu phụ (ví dụ: AddToPlaylistMenu) */}
        {menuComponent && (
          <div className="flex items-center justify-center hover:scale-110 active:scale-95 transition-transform">
            {menuComponent}
          </div>
        )}

        {/* Nút Chia sẻ (nếu có onShare) */}
        {onShare && (
          <button
            type="button"
            onClick={onShare}
            className="w-11 h-11 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Sao chép liên kết chia sẻ"
          >
            <Share2 size={24} />
          </button>
        )}
      </div>

      {/* Children bên phải (nếu có các control lọc, tìm kiếm, v.v.) */}
      {children && (
        <div className="flex items-center gap-3">{children}</div>
      )}
    </div>
  );
};

export default DetailActionBar;

