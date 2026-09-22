import React from "react";
import { Play } from "lucide-react";
import { Button } from "./Button";
import { CoverImage } from "./CoverImage";

export const SongCard = ({
  title,
  subtitle,
  imageUrl,
  type = "song", // "artist", "album", "song", "playlist"
  artistName,
  onClick,
  onPlayClick,
}) => {
  const isArtist = type === "artist";
  const isAlbum = type === "album";

  let displaySubtitle = subtitle;
  if (!displaySubtitle) {
    if (isArtist) {
      displaySubtitle = "Nghệ sĩ";
    } else if (isAlbum && artistName) {
      displaySubtitle = `Album • ${artistName}`;
    } else if (artistName) {
      displaySubtitle = artistName;
    }
  }

  return (
    <div
      className="bg-transparent hover:bg-spotify-hover transition-all p-3 rounded-md cursor-pointer group"
      onClick={onClick}
    >
      <div className="relative mb-4">
        <CoverImage
          src={imageUrl}
          alt={title}
          isArtist={isArtist}
          className={`w-full aspect-square object-cover shadow-lg ${isArtist ? "rounded-full" : "rounded-md"}`}
        />
        {/* Nút Play sẽ hiển thị hiệu ứng trượt lên và sáng lên khi hover vào thẻ card */}
        <Button
          variant="primary" size="md" iconOnly
          onClick={(e) => {
            e.stopPropagation();
            if (onPlayClick) onPlayClick();
          }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0"
        >
          <Play size={24} className="fill-white text-white ml-1" />
        </Button>
      </div>
      <h3 className="text-white truncate text-sm font-semibold">
        {title}
      </h3>
      <p className="text-spotify-sub text-xs mt-1 truncate">{displaySubtitle}</p>
    </div>
  );
};
