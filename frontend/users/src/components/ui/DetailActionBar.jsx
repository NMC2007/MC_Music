import React from "react";
import { Play, Pause, Shuffle, Heart, Share2 } from "lucide-react";
import { Button } from "./Button";

/**
 * Component thanh điều khiển phát nhạc và tương tác dùng chung cho các trang chi tiết
 * (SongPage, AlbumPage, PlaylistPage, ArtistPage)
 * - Mobile (< 768px): Layout chuẩn Spotify Mobile (Nút Tim / Follow / Menu ở bên TRÁI; Nút Trộn bài & Nút Play to ở bên PHẢI).
 * - Desktop (>= 768px): Layout chuẩn Spotify Desktop (Play -> Shuffle -> Like -> Follow -> Menu -> Share).
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
  // Nút Play chính to tròn
  const renderPlayButton = (size = "lg") =>
    onPlay && (
      <Button
        type="button"
        variant="primary"
        size={size}
        iconOnly
        onClick={onPlay}
        disabled={disabled || isLoading}
        aria-label={isPlaying ? "Tạm dừng" : "Phát"}
        className={`${
          size === "lg" ? "!w-14 !h-14" : "!w-12 !h-12"
        } shadow-[0_8px_20px_rgba(250,45,72,0.4)] flex-shrink-0`}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isPlaying ? (
          <Pause size={size === "lg" ? 24 : 20} fill="white" className="text-white" />
        ) : (
          <Play size={size === "lg" ? 24 : 20} fill="white" className="text-white translate-x-[2px]" />
        )}
      </Button>
    );

  // Nút Trộn bài
  const renderShuffleButton = () =>
    onShuffle && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        tooltip="Trộn bài"
        tooltipPosition="top"
        aria-label="Trộn bài"
        onClick={onShuffle}
        disabled={disabled}
        className="!w-10 !h-10 text-neutral-300 hover:text-white hover:bg-white/10 flex-shrink-0 hover:scale-110 active:scale-95 transition-transform"
      >
        <Shuffle size={20} />
      </Button>
    );

  // Nút Yêu thích (Tim Album / Bài hát)
  const renderLikeButton = () =>
    onLike && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        aria-label={
          likeTooltip ||
          (isLiked
            ? "Xóa khỏi danh sách yêu thích"
            : "Thêm vào danh sách yêu thích")
        }
        onClick={onLike}
        className={`!w-10 !h-10 flex-shrink-0 hover:bg-white/10 transition-colors ${
          isLiked
            ? "!text-[#fa2d48] hover:!text-[#ff4b63]"
            : "text-neutral-300 hover:text-white"
        }`}
        tooltip={
          likeTooltip ||
          (isLiked
            ? "Xóa khỏi danh sách yêu thích"
            : "Thêm vào danh sách yêu thích")
        }
        tooltipPosition="top"
      >
        <Heart
          size={24}
          className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : ""}
        />
      </Button>
    );

  // Nút Theo dõi nghệ sĩ
  const renderFollowButton = () =>
    onFollow && (
      <Button
        type="button"
        variant={isFollowed ? "secondary" : "white"}
        size="sm"
        onClick={onFollow}
        className="!h-9 px-4 text-xs font-bold flex-shrink-0 shadow-sm"
      >
        {isFollowed ? "Đang theo dõi" : "Theo dõi"}
      </Button>
    );

  // Nút Chia sẻ
  const renderShareButton = () =>
    onShare && (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        iconOnly
        onClick={onShare}
        aria-label="Sao chép liên kết chia sẻ"
        className="!w-10 !h-10 text-neutral-400 hover:text-white hover:bg-white/10 flex-shrink-0"
        tooltip="Sao chép liên kết chia sẻ"
        tooltipPosition="top"
      >
        <Share2 size={20} />
      </Button>
    );

  return (
    <div
      className={`bg-gradient-to-b ${gradientFrom} to-transparent ${className}`}
    >
      {/* ── BỐ CỤC MOBILE (< 768px): CHUẨN SPOTIFY MOBILE ── */}
      <div className="flex md:hidden items-center justify-between gap-3 px-4 py-3 w-full">
        {/* Nhóm bên Trái: Nút Tim / Theo dõi / Menu / Chia sẻ */}
        <div className="flex items-center gap-2 flex-wrap">
          {renderLikeButton()}
          {renderFollowButton()}
          {menuComponent && (
            <div className="flex items-center justify-center flex-shrink-0">
              {menuComponent}
            </div>
          )}
          {renderShareButton()}
        </div>

        {/* Nhóm bên Phải: Nút Trộn bài & Nút Play to */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          {renderShuffleButton()}
          {renderPlayButton("md")}
        </div>
      </div>

      {/* ── BỐ CỤC DESKTOP (>= 768px): CHUẨN SPOTIFY DESKTOP ── */}
      <div className="hidden md:flex items-center justify-between gap-4 px-6 md:px-10 py-5 w-full">
        <div className="flex items-center gap-4 flex-wrap">
          {renderPlayButton("lg")}
          {renderShuffleButton()}
          {renderLikeButton()}
          {renderFollowButton()}
          {menuComponent && (
            <div className="flex items-center justify-center hover:scale-110 active:scale-95 transition-transform flex-shrink-0">
              {menuComponent}
            </div>
          )}
          {renderShareButton()}
        </div>

        {children && (
          <div className="flex items-center gap-3 flex-shrink-0">{children}</div>
        )}
      </div>
    </div>
  );
};

export default DetailActionBar;
