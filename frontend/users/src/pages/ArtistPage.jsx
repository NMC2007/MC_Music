import React, { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  MoreHorizontal,
  UserPlus,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getArtistDetail } from "../api/artists/public";
import {
  getArtistSongs,
  getArtistAlbums,
  getAlbumSongs,
} from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { showLoginToast } from "../utils/toastUtils";
import { Button } from "../components/ui/Button";
import { SongRow } from "../components/ui/SongRow";
import { SongCard } from "../components/ui/SongCard";
import { SectionCarousel } from "../components/ui/SectionCarousel";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow, SkeletonCard } from "../components/ui/Skeleton";

export const ArtistPage = () => {
  const { id: artistId } = useParams();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { currentSong, isPlaying, setIsPlaying, setCurrentSong } =
    usePlayerStore();

  const [showAllSongs, setShowAllSongs] = useState(false);
  // Filter: null = tất cả, "ALBUM" = album, "EP" = ep
  const [albumFilter, setAlbumFilter] = useState(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────────
  const { data: artistData, isLoading: isLoadingArtist } = useQuery({
    queryKey: ["artistDetail", artistId],
    queryFn: () => getArtistDetail(artistId),
    enabled: !!artistId,
  });

  const { data: songsData, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["artistSongs", artistId],
    queryFn: () =>
      getArtistSongs(artistId, { size: 10, sort: "likeCount,desc" }),
    enabled: !!artistId,
  });

  const { data: albumsData, isLoading: isLoadingAlbums } = useQuery({
    queryKey: ["artistAlbums", artistId],
    queryFn: () => getArtistAlbums(artistId, { size: 20 }),
    enabled: !!artistId,
  });

  // ─── Dữ liệu ──────────────────────────────────────────────────────────────
  const artist = artistData?.data;
  const allSongs = songsData?.data?.content || [];
  const allAlbums = albumsData?.data?.content || [];

  // Lọc album theo loại
  const filteredAlbums = albumFilter
    ? allAlbums.filter((a) => a.albumType?.toUpperCase() === albumFilter)
    : allAlbums;

  // Hiển thị 5 bài đầu, hoặc tất cả nếu đã bấm "Xem thêm"
  const visibleSongs = showAllSongs ? allSongs : allSongs.slice(0, 5);

  // ─── Kiểm tra bài hát đang phát ───────────────────────────────────────────
  const isArtistPlaying =
    isPlaying && currentSong && allSongs.some((s) => s.id === currentSong.id);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const formatFollowers = (count) => {
    if (!count && count !== 0) return "";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)} triệu`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)} nghìn`;
    return count.toLocaleString("vi-VN");
  };

  const handlePlayArtist = () => {
    if (allSongs.length === 0) return;
    if (isArtistPlaying) {
      setIsPlaying(false);
      return;
    }
    setCurrentSong(allSongs[0]);
    setIsPlaying(true);
  };

  const handleShufflePlay = () => {
    if (allSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    setCurrentSong(allSongs[randomIndex]);
    setIsPlaying(true);
  };

  const handleFollow = () => {
    if (!isAuthenticated) {
      showLoginToast("theo dõi nghệ sĩ");
      return;
    }
    // TODO: Gọi API follow nghệ sĩ
  };

  const handlePlayAlbumCard = async (albumId) => {
    try {
      const res = await getAlbumSongs(albumId, {
        size: 50,
        sort: "createdAt,asc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        setCurrentSong(songs[randomIndex]);
        setIsPlaying(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filterButtons = [
    { label: "Tất cả", value: null },
    { label: "Album", value: "ALBUM" },
    { label: "EP", value: "EP" },
  ];

  // ─── Loading State (Header) ───────────────────────────────────────────────
  if (isLoadingArtist) {
    return (
      <div>
        {/* Header Skeleton */}
        <div className="relative h-[340px] bg-spotify-card animate-pulse rounded-t-lg" />
        <div className="px-6 py-6 flex flex-col gap-8">
          {/* Skeleton rows */}
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="flex items-center justify-center h-64 text-spotify-sub">
        Không tìm thấy nghệ sĩ.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* ── HEADER: Cover image toàn chiều rộng ─────────────────────────────── */}
      <div className="relative w-full h-[280px] sm:h-[340px] overflow-hidden flex-shrink-0 rounded-t-lg">
        {/* Ảnh bìa */}
        {artist.coverUrl ? (
          <img
            src={artist.coverUrl}
            alt={artist.stageName}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-spotify-hover to-spotify-black" />
        )}

        {/* Gradient che phía dưới để text dễ đọc */}
        <div className="absolute inset-0 bg-gradient-to-t from-spotify-black via-spotify-black/40 to-transparent" />

        {/* Tên nghệ sĩ */}
        <div className="absolute bottom-6 left-6 right-6">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-lg leading-none">
            {artist.stageName}
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {formatFollowers(artist.followerCount)} người theo dõi
          </p>
        </div>
      </div>

      {/* ── ACTION BAR ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-5 bg-gradient-to-b from-spotify-black/60 to-transparent">
        {/* Nút Play chính */}
        <button
          onClick={handlePlayArtist}
          className="w-14 h-14 rounded-full bg-spotify-primary hover:bg-spotify-primary-hover flex items-center justify-center shadow-[0_8px_16px_rgba(250,45,72,0.3)] transition-all hover:scale-105 flex-shrink-0"
        >
          {isArtistPlaying ? (
            <Pause size={24} fill="white" className="text-white" />
          ) : (
            <Play size={24} fill="white" className="text-white ml-1" />
          )}
        </button>

        {/* Nút Trộn bài */}
        <Button
          variant="ghost"
          size="md"
          iconOnly
          tooltip="Trộn bài"
          tooltipPosition="top"
          onClick={handleShufflePlay}
        >
          <Shuffle size={22} />
        </Button>

        {/* Nút Follow */}
        <Button
          variant="secondary"
          size="md"
          onClick={handleFollow}
          className="flex items-center gap-2"
        >
          <UserPlus size={18} />
          Theo dõi
        </Button>

        {/* Nút thêm */}
        <Button variant="ghost" size="md" iconOnly>
          <MoreHorizontal size={22} />
        </Button>
      </div>

      {/* ── NỘI DUNG ────────────────────────────────────────────────────────── */}
      <div className="px-6 pb-10 flex flex-col gap-10">
        {/* ── SECTION: PHỔ BIẾN ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-2xl font-bold text-white mb-4">Phổ biến</h2>

          {isLoadingSongs ? (
            <div className="flex flex-col gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </div>
          ) : allSongs.length === 0 ? (
            <p className="text-spotify-sub py-4">
              Nghệ sĩ chưa có bài hát nào.
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                {visibleSongs.map((song, idx) => (
                  <SongRow
                    key={song.id}
                    index={idx + 1}
                    song={song}
                    isPlaying={isPlaying && currentSong?.id === song.id}
                    onPlayClick={() => setCurrentSong(song)}
                  />
                ))}
              </div>

              {/* Nút Xem thêm / Ẩn bớt */}
              {allSongs.length > 5 && (
                <button
                  onClick={() => setShowAllSongs(!showAllSongs)}
                  className="mt-3 flex items-center gap-1 text-sm font-bold text-spotify-sub hover:text-white transition-colors"
                >
                  {showAllSongs ? (
                    <>
                      <ChevronUp size={16} /> Ẩn bớt
                    </>
                  ) : (
                    <>
                      <ChevronDown size={16} /> Xem thêm
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </section>

        {/* ── SECTION: ALBUM ──────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Album & Đĩa đơn</h2>
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-2 mb-4">
            {filterButtons.map((f) => (
              <button
                key={f.label}
                onClick={() => setAlbumFilter(f.value)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
                  albumFilter === f.value
                    ? "bg-white text-black"
                    : "bg-spotify-hover text-white hover:bg-spotify-card-hover"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {isLoadingAlbums ? (
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-[160px] sm:w-[180px] flex-shrink-0">
                  <SkeletonCard />
                </div>
              ))}
            </div>
          ) : filteredAlbums.length === 0 ? (
            <p className="text-spotify-sub py-4">Không có album nào.</p>
          ) : (
            <SectionCarousel title="">
              {filteredAlbums.map((album) => (
                <div
                  key={album.id}
                  className="w-[140px] sm:w-[160px] md:w-[180px] flex-shrink-0"
                >
                  <SongCard
                    type="album"
                    title={album.title}
                    subtitle={`${
                      album.albumType === "ALBUM"
                        ? "Album"
                        : album.albumType === "EP"
                          ? "EP"
                          : "Đĩa đơn"
                    } • ${album.releaseDate?.slice(0, 4) || ""}`}
                    imageUrl={album.coverImage}
                    onClick={() =>
                      navigate(`/album/${album.id}`, {
                        state: { album },
                      })
                    }
                    onPlayClick={() => handlePlayAlbumCard(album.id)}
                  />
                </div>
              ))}
            </SectionCarousel>
          )}
        </section>

        {/* ── SECTION: TIỂU SỬ ─────────────────────────────────────────────── */}
        {artist.biography && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">Tiểu sử</h2>
            <div className="relative rounded-lg overflow-hidden">
              {artist.avatarUrl && (
                <img
                  src={artist.avatarUrl}
                  alt={artist.stageName}
                  className="w-full max-h-60 object-cover rounded-lg mb-4"
                />
              )}
              <p className="text-spotify-sub leading-relaxed whitespace-pre-line">
                {artist.biography}
              </p>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
