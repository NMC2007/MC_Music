import React, { useState } from "react";
import { Play, Heart } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { useFavorites } from "../../hooks/useFavorites";
import { AddToPlaylistMenu } from "../playlist/AddToPlaylistMenu";

/**
 * Component hiển thị 1 dòng bài hát trong danh sách ngang (Album Detail, Artist Profile, Playlist Detail).
 */
export const SongRow = ({
  index,
  song,
  onPlayClick,
  isPlaying,
  currentPlaylistId = null,
  onRemove = null,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  const isLiked = isFavoriteSong(song?.id || song?.songId);

  // Xử lý hiển thị thời lượng (ms -> mm:ss)
  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleLike = (e) => {
    e.stopPropagation(); // Ngăn sự kiện click lan ra ngoài (gây play nhạc)
    toggleFavoriteSong(song);
  };

  return (
    <div
      className="flex items-center gap-4 py-2 px-4 rounded-md hover:bg-[#2a2a2a] group cursor-pointer transition-colors"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onPlayClick}
    >
      {/* Cột STT / Nút Play */}
      <div className="w-6 text-right flex justify-end">
        {isHovered ? (
          <button className="text-white hover:scale-110 active:scale-95 transition-transform cursor-pointer">
            <Play size={16} fill="currentColor" />
          </button>
        ) : (
          <span
            className={`text-sm ${
              isPlaying ? "text-[#fa2d48] font-bold" : "text-spotify-sub"
            }`}
          >
            {index}
          </span>
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-10 h-10 flex-shrink-0">
        <CoverImage
          src={song.coverImage || song.coverUrl}
          alt={song.title}
          className="w-full h-full object-cover rounded shadow-sm"
        />
      </div>

      {/* Thông tin bài hát */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <span
          className={`text-base truncate ${
            isPlaying ? "text-[#fa2d48] font-bold" : "text-white"
          }`}
        >
          {song.title}
        </span>
        <span className="text-sm text-spotify-sub group-hover:text-white transition-colors truncate">
          {song.artistName || song.ownerName}
        </span>
      </div>

      {/* Hành động (Like) - Hiện khi đã like hoặc khi hover */}
      <div
        className={`w-10 flex items-center justify-center transition-opacity ${
          isLiked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        }`}
      >
        <button
          className={`p-1.5 rounded-full hover:scale-110 active:scale-95 transition-all cursor-pointer ${
            isLiked
              ? "text-[#fa2d48]"
              : "text-spotify-sub hover:text-white"
          }`}
          onClick={handleLike}
          title={isLiked ? "Xóa khỏi danh sách yêu thích" : "Thêm vào danh sách yêu thích"}
        >
          <Heart
            size={18}
            className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : "currentColor"}
          />
        </button>
      </div>

      {/* Thời lượng */}
      <div className="w-12 text-sm text-spotify-sub text-right">
        {formatDuration(song.durationMs || (song.durationSeconds ? song.durationSeconds * 1000 : 0))}
      </div>

      {/* Tùy chọn khác (Thêm vào playlist / Gỡ khỏi playlist) */}
      <div className="w-8 flex items-center justify-end">
        <AddToPlaylistMenu
          song={song}
          currentPlaylistId={currentPlaylistId}
          onRemove={onRemove}
        />
      </div>
    </div>
  );
};
