import React from "react";
import { Play, Clock, Calendar, Loader2, Trash2 } from "lucide-react";
import { CoverImage } from "./CoverImage";
import { FavoriteButton } from "./FavoriteButton";
import { SkeletonRow } from "./Skeleton";
import { AddToPlaylistMenu } from "../playlist/AddToPlaylistMenu";

const formatAddedDate = (dateStr) => {
  if (!dateStr) return "Gần đây";
  try {
    const d = new Date(dateStr);
    return `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
  } catch {
    return "Gần đây";
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return "3:15";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

const TrackTableRow = React.memo(({
  song,
  index,
  isCurrent,
  isLoadingThis,
  isLiked,
  showAlbumColumn,
  showFavoriteColumn,
  showDuration,
  gridClass,
  currentPlaylistId,
  onPlaySong,
  onToggleFavorite,
  onRemoveSong,
  renderExtraMenuActions,
}) => {
  const songId = song.songId || song.id;
  const title = song.songTitle || song.title;
  const artistName = song.artistName || song.artist || "Nghệ sĩ";

  const handleToggleLike = () => {
    onToggleFavorite?.({
      id: songId,
      songId,
      title,
      artistName,
      coverImage: song.coverImage,
    });
  };

  return (
    <div
      onClick={() => onPlaySong?.(song, index)}
      className={`${gridClass} items-center px-2 sm:px-4 py-2 sm:py-2.5 rounded-lg transition-colors group cursor-pointer ${
        isCurrent
          ? showAlbumColumn
            ? "bg-white/5"
            : "bg-[#282828]"
          : showAlbumColumn
            ? "hover:bg-white/10"
            : "hover:bg-[#1a1a1a]"
      }`}
    >
      {/* STT / Play / Loading */}
      <div className="flex items-center justify-end sm:justify-center">
        {isLoadingThis ? (
          <Loader2 size={15} className="animate-spin text-[#fa2d48]" />
        ) : (
          <>
            <span
              className={`text-xs sm:text-sm group-hover:hidden tabular-nums ${
                isCurrent ? "text-[#fa2d48] font-bold" : "text-spotify-sub"
              }`}
            >
              {index + 1}
            </span>
            <Play size={14} fill="white" className="text-white hidden group-hover:block" />
          </>
        )}
      </div>

      {/* Thumbnail + Tên bài hát + Nghệ sĩ */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-neutral-800 shadow-sm border border-white/5">
          <CoverImage
            src={song.coverImage || song.coverUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex flex-col min-w-0 flex-1 justify-center">
          <span
            className={`text-xs sm:text-sm font-medium truncate transition-colors ${
              isCurrent ? "text-[#fa2d48] font-bold" : "text-white"
            }`}
          >
            {title}
          </span>
          <span className="text-[11px] sm:text-xs text-spotify-sub group-hover:text-white transition-colors truncate mt-0.5">
            {artistName}
          </span>
        </div>
      </div>

      {/* Cột Album (hiển thị từ md trở lên nếu bật) */}
      {showAlbumColumn && (
        <div className="hidden md:block min-w-0">
          <span className="text-sm text-spotify-sub truncate hover:underline hover:text-white block">
            {song.albumTitle || title}
          </span>
        </div>
      )}

      {/* Ngày thêm */}
      <div
        className={`${
          showAlbumColumn ? "hidden lg:block" : "hidden sm:block"
        } text-xs text-spotify-sub truncate`}
      >
        {formatAddedDate(song.addedAt || song.createdAt)}
      </div>

      {/* Cột Nút Tim độc lập (dùng cho PlaylistPage) */}
      {showFavoriteColumn && (
        <div className="flex items-center justify-center">
          <FavoriteButton
            isLiked={isLiked}
            onToggle={handleToggleLike}
            size={18}
            revealOnGroupHover
          />
        </div>
      )}

      {/* Cột Thời lượng + Thao tác */}
      <div className="flex items-center justify-end gap-2 text-spotify-sub relative">
        {showDuration && (
          <span className="text-xs text-spotify-sub w-9 sm:w-10 text-right tabular-nums">
            {formatDuration(song.durationSeconds)}
          </span>
        )}

        {onRemoveSong && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveSong(song);
            }}
            className="hidden md:inline-flex p-1.5 rounded-full text-spotify-sub hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            title="Xóa bài hát khỏi playlist này"
          >
            <Trash2 size={16} />
          </button>
        )}

        <AddToPlaylistMenu
          song={{
            id: songId,
            songId,
            title,
            artistName,
            coverImage: song.coverImage,
          }}
          currentPlaylistId={currentPlaylistId}
          onRemove={onRemoveSong}
          extraActions={renderExtraMenuActions?.(song)}
        />
      </div>
    </div>
  );
});

/**
 * Bảng danh sách bài hát chuẩn Spotify dùng chung cho LikedSongsPage và PlaylistPage.
 */
export const TrackTable = ({
  songs = [],
  isLoading = false,
  currentSongId = null,
  loadingSongId = null,
  favoriteSongIds = null,
  showAlbumColumn = false,
  showFavoriteColumn = false,
  showDuration = false,
  currentPlaylistId = null,
  onPlaySong,
  onToggleFavorite,
  onRemoveSong,
  renderExtraMenuActions,
  emptyComponent = null,
  skeletonCount = 6,
}) => {
  const gridClass = showAlbumColumn
    ? "grid grid-cols-[16px_1fr_auto] md:grid-cols-[20px_4fr_3fr_120px] lg:grid-cols-[24px_6fr_4fr_3fr_120px] gap-2 sm:gap-4"
    : "grid grid-cols-[16px_1fr_36px_36px] sm:grid-cols-[24px_1fr_120px_36px_40px] md:grid-cols-[24px_1fr_160px_40px_80px] gap-2 sm:gap-4";

  return (
    <div className="flex flex-col flex-1">
      {/* Header Bảng */}
      <div
        className={`${gridClass} px-2 sm:px-4 py-2 sm:py-2.5 text-xs font-bold text-spotify-sub border-b border-neutral-800/80 uppercase tracking-wider items-center select-none`}
      >
        <span className="text-right sm:text-center">#</span>
        <span>Tiêu đề</span>
        {showAlbumColumn && <span className="hidden md:block">Album</span>}
        <div
          className={`${
            showAlbumColumn ? "hidden lg:flex" : "hidden sm:flex"
          } items-center gap-1.5`}
        >
          {!showAlbumColumn && <Calendar size={13} />}
          <span>Ngày thêm</span>
        </div>
        {showFavoriteColumn && <div />}
        <div className="flex items-center justify-end pr-2">
          <Clock size={showAlbumColumn ? 16 : 13} />
        </div>
      </div>

      {/* Nội dung Bảng */}
      {isLoading ? (
        <div className="flex flex-col gap-2 mt-2">
          {Array.from({ length: skeletonCount }).map((_, idx) =>
            showAlbumColumn ? (
              <div
                key={idx}
                className={`${gridClass} px-2 sm:px-4 py-2 sm:py-2.5 items-center animate-pulse`}
              >
                <div className="w-4 h-4 bg-neutral-800 rounded" />
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-md flex-shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <div className="w-32 sm:w-36 h-3.5 bg-neutral-800 rounded" />
                    <div className="w-20 sm:w-24 h-3 bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="hidden md:block w-28 h-3.5 bg-neutral-800 rounded" />
                <div className="hidden lg:block w-20 h-3.5 bg-neutral-800 rounded" />
                <div className="w-10 h-3.5 bg-neutral-800 rounded ml-auto" />
              </div>
            ) : (
              <SkeletonRow key={idx} />
            )
          )}
        </div>
      ) : songs.length > 0 ? (
        <div className="flex flex-col mt-1 sm:mt-2">
          {songs.map((song, idx) => {
            const songId = song.songId || song.id;
            return (
              <TrackTableRow
                key={`${songId}-${idx}`}
                song={song}
                index={idx}
                isCurrent={currentSongId === songId}
                isLoadingThis={loadingSongId === songId}
                isLiked={favoriteSongIds ? favoriteSongIds.has(songId) : false}
                showAlbumColumn={showAlbumColumn}
                showFavoriteColumn={showFavoriteColumn}
                showDuration={showDuration}
                gridClass={gridClass}
                currentPlaylistId={currentPlaylistId}
                onPlaySong={onPlaySong}
                onToggleFavorite={onToggleFavorite}
                onRemoveSong={onRemoveSong}
                renderExtraMenuActions={renderExtraMenuActions}
              />
            );
          })}
        </div>
      ) : (
        emptyComponent
      )}
    </div>
  );
};
