import React from "react";
import { Play } from "lucide-react";

export const SongCard = ({
  title,
  subtitle,
  imageUrl,
  onClick,
  onPlayClick,
}) => {
  return (
    <div
      className="bg-transparent hover:bg-spotify-hover transition-all p-3 rounded-md cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative mb-4">
        <img
          src={
            imageUrl || "https://placehold.co/400x400/181818/ffffff?text=Cover"
          }
          alt={title}
          className="w-full aspect-square object-cover rounded-md shadow-lg"
        />
        {/* Nút Play sẽ hiển thị hiệu ứng trượt lên và sáng lên khi hover vào thẻ card */}
        <button
          onClick={(e) => {
            e.stopPropagation(); // Ngăn kích hoạt sự kiện click của cả thẻ div cha
            if (onPlayClick) onPlayClick();
          }}
          className="absolute bottom-2 right-2 w-12 h-12 bg-spotify-primary text-white rounded-full flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 hover:scale-105 hover:bg-spotify-primary-hover"
        >
          <Play size={24} fill="currentColor" strokeWidth={0} />
        </button>
      </div>
      <h3 className="text-white truncate text-sm">
        {title}
      </h3>
      <p className="text-spotify-sub text-xs mt-1 line-clamp-2">{subtitle}</p>
    </div>
  );
};
