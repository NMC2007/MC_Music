import React from "react";
import { useNavigate } from "react-router";
import { Play } from "lucide-react";
import { Button } from "./Button";
import { CoverImage } from "./CoverImage";
import { getSongById, getAlbumById } from "../../api/catalog/public";

/**
 * Thẻ hiển thị Bài hát / Album / Nghệ sĩ / Playlist trong Grid và Carousel.
 * Tuân thủ ui_ux_guidelines.md: Bo góc, hiệu ứng hover, nút Play nổi.
 */
export const SongCard = React.memo(({
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

  const navigateToDetail = () => {
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

  // Bấm vào thẻ luôn ưu tiên mở trang chi tiết (giống Spotify); chỉ phát nhạc khi bấm đúng nút Play
  const handleCardClick = () => {
    if (onClick && (isAlbum || isArtist || isSong || type === "playlist")) {
      navigateToDetail();
    } else if (onClick) {
      onClick();
    } else {
      navigateToDetail();
    }
  };

  const handleTitleClick = (e) => {
    e.stopPropagation();
    navigateToDetail();
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
      className="bg-transparent hover:bg-spotify-hover active:bg-spotify-hover/60 transition-all p-2 sm:p-3 rounded-lg cursor-pointer group select-none snap-start"
      onClick={handleCardClick}
    >
      <div className="relative mb-2.5 sm:mb-4">
        <CoverImage
          src={imageUrl}
          alt={title}
          isArtist={isArtist}
          className={`w-full aspect-square object-cover shadow-lg ${
            isArtist ? "rounded-full" : "rounded-md sm:rounded-lg"
          }`}
        />

        {/* Nút Play chỉ hiển thị khi hover trên desktop (md+); mobile ẩn để chạm thẻ mở chi tiết mượt mà */}
        <Button
          variant="primary"
          size="md"
          iconOnly
          aria-label={`Phát ${title}`}
          onClick={(e) => {
            e.stopPropagation();
            if (onPlayClick) onPlayClick();
            else navigateToDetail();
          }}
          className="hidden md:flex pointer-events-none group-hover:pointer-events-auto absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0 shadow-[0_8px_16px_rgba(250,45,72,0.4)] !w-10 !h-10 sm:!w-12 sm:!h-12 flex-shrink-0"
        >
          <Play size={20} className="fill-white text-white ml-0.5" />
        </Button>
      </div>

      {/* Tên bài hát / Album / Nghệ sĩ */}
      <h3
        onClick={handleTitleClick}
        title={title}
        className="text-white truncate text-xs sm:text-sm font-semibold hover:underline cursor-pointer transition-colors block leading-tight"
      >
        {title}
      </h3>

      {/* Subtitle / Nghệ sĩ */}
      {isArtist ? (
        <p className="text-spotify-sub text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate">{displaySubtitle}</p>
      ) : isAlbum ? (
        <p className="text-spotify-sub text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate">
          {albumPrefix && <span>{albumPrefix}</span>}
          <span
            onClick={handleArtistClick}
            className="hover:underline hover:text-white transition-colors cursor-pointer"
          >
            {displaySubtitle}
          </span>
        </p>
      ) : (
        <p
          onClick={handleArtistClick}
          className="text-spotify-sub text-[11px] sm:text-xs mt-0.5 sm:mt-1 truncate hover:underline hover:text-white transition-colors cursor-pointer"
        >
          {displaySubtitle}
        </p>
      )}
    </div>
  );
});

export default SongCard;
