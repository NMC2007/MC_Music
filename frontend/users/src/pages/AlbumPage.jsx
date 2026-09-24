import React, { useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  MoreHorizontal,
  Clock,
  ArrowLeft,
} from "lucide-react";

import { getAlbumSongs } from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { Button } from "../components/ui/Button";
import { SongRow } from "../components/ui/SongRow";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow } from "../components/ui/Skeleton";

export const AlbumPage = () => {
  const { id: albumId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // Lấy metadata album được truyền qua React Router state
  const album = location.state?.album;

  const { currentSong, isPlaying, setIsPlaying, setCurrentSong } =
    usePlayerStore();

  // ─── Fetch danh sách bài hát ─────────────────────────────────────────────
  const { data: songsData, isLoading } = useQuery({
    queryKey: ["albumSongs", albumId],
    queryFn: () => getAlbumSongs(albumId, { size: 50, sort: "createdAt,asc" }),
    enabled: !!albumId,
  });

  const songs = songsData?.data?.content || [];

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
    setCurrentSong(songs[0]);
    setIsPlaying(true);
  };

  const handleShufflePlay = () => {
    if (songs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * songs.length);
    setCurrentSong(songs[randomIndex]);
    setIsPlaying(true);
  };

  // Màu gradient ngẫu nhiên từ ảnh bìa — dùng fallback nếu không có
  const gradientFallback =
    "from-[#4a1a1a] via-[#1a1a2e] to-spotify-black";

  return (
    <div className="flex flex-col min-h-full">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div
        className={`relative flex flex-col sm:flex-row items-end gap-6 px-6 pt-16 pb-8 bg-gradient-to-b ${gradientFallback}`}
      >
        {/* Ảnh bìa Album */}
        <div className="flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 shadow-2xl self-center sm:self-end">
          <CoverImage
            src={album?.coverImage}
            alt={album?.title || "Album"}
            className="w-full h-full object-cover rounded-md"
          />
        </div>

        {/* Thông tin Album */}
        <div className="flex flex-col gap-2 pb-2">
          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
            {formatAlbumType(album?.albumType)}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white leading-none">
            {album?.title || "Đang tải..."}
          </h1>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-sm font-bold text-white">
              {album?.ownerName}
            </span>
            {album?.releaseDate && (
              <>
                <span className="text-spotify-sub text-sm">•</span>
                <span className="text-sm text-spotify-sub">
                  {album.releaseDate.slice(0, 4)}
                </span>
              </>
            )}
            {songs.length > 0 && (
              <>
                <span className="text-spotify-sub text-sm">•</span>
                <span className="text-sm text-spotify-sub">
                  {songs.length} bài hát
                </span>
                <span className="text-spotify-sub text-sm">•</span>
                <span className="text-sm text-spotify-sub">{totalDuration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-b from-[#1a0a0a]/60 to-transparent">
        {/* Nút Play chính */}
        <button
          onClick={handlePlayAlbum}
          disabled={songs.length === 0 && !isLoading}
          className="w-14 h-14 rounded-full bg-spotify-primary hover:bg-spotify-primary-hover flex items-center justify-center shadow-[0_8px_16px_rgba(250,45,72,0.3)] transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
        >
          {isAlbumPlaying ? (
            <Pause size={24} fill="white" className="text-white" />
          ) : (
            <Play size={24} fill="white" className="text-white ml-1" />
          )}
        </button>

        {/* Nút Trộn bài */}
        <Button variant="ghost" size="md" iconOnly tooltip="Trộn bài" tooltipPosition="top" onClick={handleShufflePlay}>
          <Shuffle size={22} />
        </Button>

        {/* Nút thêm */}
        <Button variant="ghost" size="md" iconOnly tooltip="Thêm tùy chọn" tooltipPosition="top">
          <MoreHorizontal size={22} />
        </Button>
      </div>

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
                onPlayClick={() => setCurrentSong(song)}
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
