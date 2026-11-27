import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Play, Volume2 } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { FavoriteButton } from "./FavoriteButton";
import { AddToPlaylistMenu } from "../playlist/AddToPlaylistMenu";

/**
 * Component hiển thị 1 dòng bài hát trong danh sách ngang (Album Detail, Artist Profile, Song Detail).
 */
export const SongRow = React.memo(({
  index,
  song,
  onPlayClick,
  isPlaying,
  isLiked = false,
  onToggleLike,
  currentPlaylistId = null,
  onRemove = null,
}) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleLike = (e) => {
    e.stopPropagation();
    onToggleLike?.(song);
  };

  const handleRowClick = () => {
    onPlayClick?.(song, index - 1);
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    const targetSongId = song?.id || song?.songId;
    if (targetSongId) {
      navigate(`/song/${targetSongId}`);
    }
  };

  const handleArtistClick = (e) => {
    e.stopPropagation();
    const targetArtistId = song?.ownerId || song?.artistId;
    if (targetArtistId) {
      navigate(`/artist/${targetArtistId}`);
    }
  };

  return (
    <div
      className="flex items-center gap-2.5 sm:gap-4 py-1.5 sm:py-2 px-2 sm:px-4 rounded-lg hover:bg-white/[0.08] active:bg-white/[0.12] group cursor-pointer transition-colors min-h-[48px] select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleRowClick}
    >
      {/* Cột STT / Nút Play / Playing Indicator */}
      <div className="w-5 sm:w-6 text-right flex justify-end items-center flex-shrink-0">
        {isHovered ? (
          <button
            type="button"
            aria-label="Phát bài này"
            className="text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              handleRowClick();
            }}
          >
            <Play size={16} fill="currentColor" />
          </button>
        ) : isPlaying ? (
          <Volume2 size={16} className="text-[#fa2d48] animate-pulse flex-shrink-0" />
        ) : (
          <span className="text-xs sm:text-sm text-spotify-sub font-medium tabular-nums">
            {index}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden relative shadow-sm">
        <CoverImage
          src={song.coverImage || song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thông tin bài hát: Tiêu đề tầng 1, Nghệ sĩ tầng 2 */}
      <div className="flex-1 flex flex-col justify-center min-w-0 pr-1">
        <span
          onClick={handleTitleClick}
          title={song.title}
          className={`text-xs sm:text-sm md:text-base font-semibold truncate hover:underline cursor-pointer transition-colors leading-tight ${
            isPlaying ? "text-[#fa2d48]" : "text-white"
          }`}
        >
          {song.title}
        </span>
        <span
          onClick={handleArtistClick}
          title={song.artistName || song.ownerName}
          className="text-[11px] sm:text-xs text-spotify-sub hover:underline hover:text-white transition-colors truncate cursor-pointer mt-0.5 leading-tight"
        >
          {song.artistName || song.ownerName || "MC Music"}
        </span>
      </div>

      {/* Nút Thả tim (Like) - Luôn hiển thị trên Mobile, hover trên Desktop */}
      <div className="w-8 sm:w-10 flex items-center justify-center flex-shrink-0">
        <FavoriteButton
          isLiked={isLiked}
          onToggle={handleLike}
          size={18}
          revealOnGroupHover
          tooltipLike="Lưu vào Thư viện"
          tooltipUnlike="Xóa khỏi danh sách yêu thích"
        />
      </div>

      {/* Thời lượng */}
      <div className="w-10 sm:w-12 text-xs sm:text-sm text-spotify-sub text-right flex-shrink-0 tabular-nums">
        {formatDuration(song.durationMs || (song.durationSeconds ? song.durationSeconds * 1000 : 0))}
      </div>

      {/* Tùy chọn khác (Thêm vào playlist / Gỡ khỏi playlist) */}
      <div className="w-7 sm:w-8 flex items-center justify-end flex-shrink-0">
        <AddToPlaylistMenu
          song={song}
          currentPlaylistId={currentPlaylistId}
          onRemove={onRemove}
          iconSize={18}
          buttonClassName="!w-7 !h-7 sm:!w-8 sm:!h-8 text-neutral-400 hover:text-white"
        />
      </div>
    </div>
  );
});
