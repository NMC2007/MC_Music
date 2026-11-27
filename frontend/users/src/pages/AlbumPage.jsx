import React, { useMemo, useCallback } from "react";
import { useParams, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Clock } from "lucide-react";

import { getAlbumSongs, getAlbumById } from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { SongRow } from "../components/ui/SongRow";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow } from "../components/ui/Skeleton";
import { DetailActionBar } from "../components/ui/DetailActionBar";

const getRandomIndex = (len) => Math.floor(Math.random() * len);

export const AlbumPage = () => {
  const { id: albumId } = useParams();
  const location = useLocation();

  // Lấy metadata album qua state hoặc query API Catalog chi tiết
  const stateAlbum = location.state?.album;
  const { data: albumDetailData } = useQuery({
    queryKey: ["albumDetail", albumId],
    queryFn: () => getAlbumById(albumId),
    enabled: !!albumId,
    initialData: stateAlbum ? { data: stateAlbum } : undefined,
  });
  const album = albumDetailData?.data || stateAlbum;

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const { isFavoriteAlbum, toggleFavoriteAlbum, isFavoriteSong, toggleFavoriteSong } = useFavorites();

  const isAlbumLiked = isFavoriteAlbum(albumId || album?.id);

  // ─── Fetch danh sách bài hát ─────────────────────────────────────────────
  const { data: songsData, isLoading } = useQuery({
    queryKey: ["albumSongs", albumId],
    queryFn: () => getAlbumSongs(albumId, { size: 50, sort: "createdAt,asc" }),
    enabled: !!albumId,
  });

  const songs = useMemo(() => songsData?.data?.content || [], [songsData]);

  const handlePlayRow = useCallback(
    (song, idx) => {
      playSongWithContext(song, songs, idx);
    },
    [playSongWithContext, songs]
  );

  // ─── Tính tổng thời lượng album ──────────────────────────────────────────
  const totalDuration = useMemo(() => {
    const totalMs = songs.reduce((acc, s) => {
      const ms = s.durationMs ?? (s.durationSeconds ? s.durationSeconds * 1000 : 0);
      return acc + ms;
    }, 0);
    const totalSec = Math.floor(totalMs / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h} giờ ${m} phút`;
    if (m > 0) return `${m} phút ${s} giây`;
    return `${s} giây`;
  }, [songs]);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const formatAlbumType = (type) => {
    if (!type) return "Album";
    if (type.toUpperCase() === "EP") return "EP";
    if (type.toUpperCase() === "SINGLE") return "Đĩa đơn";
    return "Album";
  };

  const isAlbumPlaying =
    isPlaying && currentSong && songs.some((s) => s.id === currentSong.id);

  const handlePlayAlbum = () => {
    if (songs.length === 0) return;
    if (isAlbumPlaying) {
      setIsPlaying(false);
      return;
    }
    playSongWithContext(songs[0], songs, 0);
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const randomIndex = getRandomIndex(songs.length);
    playSongWithContext(songs[randomIndex], songs, randomIndex);
  };

  // Màu gradient ngẫu nhiên từ ảnh bìa — dùng fallback nếu không có
  const gradientFallback =
    "from-[#4a1a1a] via-[#1a1a2e] to-spotify-black";

  return (
    <div className="flex flex-col min-h-full">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col sm:flex-row items-center sm:items-end text-center sm:text-left gap-4 sm:gap-6 px-4 sm:px-6 pt-4 sm:pt-16 pb-4 sm:pb-8 bg-gradient-to-b ${gradientFallback}`}
      >
        {/* Ảnh bìa Album */}
        <div className="flex-shrink-0 w-36 h-36 sm:w-52 sm:h-52 shadow-2xl mx-auto sm:mx-0">
          <CoverImage
            src={album?.coverImage}
            alt={album?.title || "Album"}
            className="w-full h-full object-cover rounded-xl sm:rounded-md"
          />
        </div>

        {/* Thông tin Album */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pb-1 sm:pb-2 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-white/80 uppercase tracking-widest">
            {formatAlbumType(album?.albumType)}
          </span>
          <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white leading-tight break-words">
            {album?.title || "Đang tải..."}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 sm:mt-2 flex-wrap text-xs sm:text-sm">
            <span className="font-bold text-white">
              {album?.ownerName}
            </span>
            {album?.releaseDate && (
              <>
                <span className="text-spotify-sub">•</span>
                <span className="text-spotify-sub">
                  {album.releaseDate.slice(0, 4)}
                </span>
              </>
            )}
            {songs.length > 0 && (
              <>
                <span className="text-spotify-sub">•</span>
                <span className="text-spotify-sub">
                  {songs.length} bài hát
                </span>
                <span className="text-spotify-sub">•</span>
                <span className="text-spotify-sub">{totalDuration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ──────────────────────────────────────────────────────── */}
      <DetailActionBar
        isPlaying={isAlbumPlaying}
        onPlay={handlePlayAlbum}
        disabled={songs.length === 0 && !isLoading}
        onShuffle={handleShufflePlay}
        isLiked={isAlbumLiked}
        onLike={() =>
          toggleFavoriteAlbum(
            album
              ? { ...album, albumId: albumId || album.id, id: albumId || album.id }
              : { id: albumId, albumId }
          )
        }
        likeTooltip={isAlbumLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"}
        gradientFrom="from-[#1a0a0a]/60"
      />

      {/* ── TRACK LIST ──────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10">
        {/* Header bảng */}
        <div className="flex items-center gap-4 px-4 py-2 mb-2 border-b border-spotify-hover text-xs font-semibold text-spotify-sub uppercase tracking-wider">
          <div className="w-6 text-right">#</div>
          <div className="flex-1">Tiêu đề</div>
          <div className="w-10" /> {/* khoảng trống cho nút like */}
          <div className="flex items-center gap-1 w-12 justify-end">
            <Clock size={14} />
          </div>
        </div>

        {/* Danh sách bài hát */}
        {isLoading ? (
          <div className="flex flex-col gap-1 mt-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <p className="text-spotify-sub py-8 text-center">
            Album này chưa có bài hát nào.
          </p>
        ) : (
          <div className="flex flex-col gap-1 mt-1">
            {songs.map((song, idx) => (
              <SongRow
                key={song.id}
                index={idx + 1}
                song={song}
                isPlaying={isPlaying && currentSong?.id === song.id}
                isLiked={isFavoriteSong(song.id)}
                onToggleLike={toggleFavoriteSong}
                onPlayClick={handlePlayRow}
              />
            ))}
          </div>
        )}

        {/* Footer: thông tin bổ sung */}
        {album?.releaseDate && !isLoading && songs.length > 0 && (
          <div className="mt-8 pt-6 border-t border-spotify-hover">
            <p className="text-sm text-spotify-sub">
              {new Date(album.releaseDate).toLocaleDateString("vi-VN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
