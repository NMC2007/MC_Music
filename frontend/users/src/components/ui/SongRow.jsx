import React, { useState } from "react";
import { Play, Heart } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { useAuthStore } from "../../store/useAuthStore";
import { showLoginToast } from "../../utils/toastUtils";

/**
 * Component hiển thị 1 dòng bài hát trong danh sách ngang (Album Detail, Artist Profile).
 */
export const SongRow = ({ index, song, onPlayClick, isPlaying }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [isHovered, setIsHovered] = useState(false);

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
    if (!isAuthenticated) {
      showLoginToast("thêm bài hát vào danh sách yêu thích");
      return;
    }
    // TODO: Gọi API thả tim
    console.log("Liked song:", song.id);
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
          <button className="text-white">
            <Play size={16} fill="currentColor" />
          </button>
        ) : (
          <span
            className={`text-sm ${
              isPlaying ? "text-spotify-primary font-bold" : "text-spotify-sub"
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
            isPlaying ? "text-spotify-primary font-bold" : "text-white"
          }`}
        >
          {song.title}
        </span>
        <span className="text-sm text-spotify-sub group-hover:text-white transition-colors truncate">
          {song.artistName || song.ownerName}
        </span>
      </div>

      {/* Hành động (Like) - Chỉ hiện khi hover */}
      <div className="w-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="text-spotify-sub hover:text-white"
          onClick={handleLike}
        >
          <Heart size={18} />
        </button>
      </div>

      {/* Thời lượng */}
      <div className="w-12 text-sm text-spotify-sub text-right">
        {formatDuration(song.durationMs || song.durationSeconds * 1000)}
      </div>
    </div>
  );
};
