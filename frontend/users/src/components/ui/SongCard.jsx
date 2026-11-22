import React from "react";
import { useNavigate } from "react-router";
import { Play } from "lucide-react";
import { Button } from "./Button";
import { CoverImage } from "./CoverImage";
import { getSongById, getAlbumById } from "../../api/catalog/public";

export const SongCard = ({
  id,
  songId,
  artistId,
  ownerId,
  albumId,
  title,
  subtitle,
  imageUrl,
  type = "song", // "artist", "album", "song", "playlist"
  artistName,
  onClick,
  onPlayClick,
}) => {
  const navigate = useNavigate();
  const isArtist = type === "artist";
  const isAlbum = type === "album";
  const isSong = type === "song";

  const targetSongId = songId || (isSong ? id : null);
  const targetAlbumId = albumId || (isAlbum ? id : null);
  const targetArtistId = artistId || ownerId || (isArtist ? id : null);

  let displaySubtitle = subtitle;
  let albumPrefix = "";
  if (!displaySubtitle) {
    if (isArtist) {
      displaySubtitle = "Nghệ sĩ";
    } else if (isAlbum && artistName) {
      albumPrefix = "Album • ";
      displaySubtitle = artistName;
    } else if (artistName) {
      displaySubtitle = artistName;
    }
  } else if (isAlbum && displaySubtitle.includes(" • ")) {
    const parts = displaySubtitle.split(" • ");
    albumPrefix = parts[0] + " • ";
    displaySubtitle = parts.slice(1).join(" • ");
  }

  const handleCardClick = (e) => {
    if (onPlayClick) {
      onPlayClick();
    } else if (onClick) {
      onClick();
    }
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    if (isSong && targetSongId) {
      navigate(`/song/${targetSongId}`);
    } else if (isAlbum && targetAlbumId) {
      navigate(`/album/${targetAlbumId}`);
    } else if (isArtist && targetArtistId) {
      navigate(`/artist/${targetArtistId}`);
    } else if (type === "playlist" && id) {
      navigate(`/playlist/${id}`);
    } else if (onClick) {
      onClick();
    }
  };

  const handleArtistClick = async (e) => {
    e.stopPropagation();
    if (targetArtistId) {
      navigate(`/artist/${targetArtistId}`);
      return;
    }

    // Tự động resolve artistId từ songId hoặc albumId nếu chưa được truyền qua props
    if (isSong && targetSongId) {
      try {
        const res = await getSongById(targetSongId);
        const resolvedId = res?.data?.ownerId;
        if (resolvedId) {
          navigate(`/artist/${resolvedId}`);
          return;
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin nghệ sĩ của bài hát:", err);
      }
    } else if (isAlbum && targetAlbumId) {
      try {
        const res = await getAlbumById(targetAlbumId);
        const resolvedId = res?.data?.ownerId;
        if (resolvedId) {
          navigate(`/artist/${resolvedId}`);
          return;
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin nghệ sĩ của album:", err);
      }
    }
  };

  return (
    <div
      className="bg-transparent hover:bg-spotify-hover transition-all p-3 rounded-md cursor-pointer group"
      onClick={handleCardClick}
    >
      <div className="relative mb-4">
        <CoverImage
          src={imageUrl}
          alt={title}
          isArtist={isArtist}
          className={`w-full aspect-square object-cover shadow-lg ${
            isArtist ? "rounded-full" : "rounded-md"
          }`}
        />

        {/* Nút Play sẽ hiển thị hiệu ứng trượt lên và sáng lên khi hover vào thẻ card */}
        <Button
          variant="primary"
          size="md"
          iconOnly
          onClick={(e) => {
            e.stopPropagation();
            if (onPlayClick) onPlayClick();
            else if (onClick) onClick();
          }}
          className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-[0_8px_16px_rgba(250,45,72,0.4)]"
        >
          <Play size={24} className="fill-white text-white ml-1" />
        </Button>
      </div>

      {/* Tên bài hát / Album / Nghệ sĩ */}
      <h3
        onClick={handleTitleClick}
        title={title}
        className="text-white truncate text-sm font-semibold hover:underline cursor-pointer transition-colors block"
      >
        {title}
      </h3>

      {/* Subtitle / Nghệ sĩ */}
      {isArtist ? (
        <p className="text-spotify-sub text-xs mt-1 truncate">{displaySubtitle}</p>
      ) : isAlbum ? (
        <p className="text-spotify-sub text-xs mt-1 truncate">
          {albumPrefix && <span>{albumPrefix}</span>}
          <span
            onClick={handleArtistClick}
            className="hover:underline hover:text-white cursor-pointer transition-colors"
            title={displaySubtitle || artistName}
          >
            {displaySubtitle || artistName}
          </span>
        </p>
      ) : (
        <p className="text-spotify-sub text-xs mt-1 truncate">
          <span
            onClick={handleArtistClick}
            className="hover:underline hover:text-white cursor-pointer transition-colors"
            title={displaySubtitle || artistName}
          >
            {displaySubtitle || artistName}
          </span>
        </p>
      )}
    </div>
  );
};

export default SongCard;
