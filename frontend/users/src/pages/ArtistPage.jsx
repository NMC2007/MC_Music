import React, { useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { getArtistDetail } from "../api/artists/public";
import {
  getArtistSongs,
  getArtistAlbums,
} from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFollowArtists } from "../hooks/useFollowArtists";
import { useFavorites } from "../hooks/useFavorites";
import { usePlaybackActions } from "../hooks/usePlaybackActions";
import { SongRow } from "../components/ui/SongRow";
import { SongCard } from "../components/ui/SongCard";
import { SectionCarousel } from "../components/ui/SectionCarousel";
import { SkeletonRow, SkeletonCard } from "../components/ui/Skeleton";
import { DetailActionBar } from "../components/ui/DetailActionBar";
import { FilterChipsBar } from "../components/ui/FilterChipsBar";

export const ArtistPage = () => {
  const { id: artistId } = useParams();
  const navigate = useNavigate();
  const { isFollowing, toggleFollowArtist } = useFollowArtists();
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();
  const { playAlbum: handlePlayAlbumCard } = usePlaybackActions();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);

  const isFollowed = isFollowing(artistId);

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
  const allSongs = useMemo(() => songsData?.data?.content || [], [songsData]);
  const allAlbums = albumsData?.data?.content || [];

  const handlePlayRow = useCallback(
    (song, idx) => {
      playSongWithContext(song, allSongs, idx);
    },
    [playSongWithContext, allSongs]
  );

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
    playSongWithContext(allSongs[0], allSongs, 0);
  };

  const handleShufflePlay = () => {
    if (allSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * allSongs.length);
    playSongWithContext(allSongs[randomIndex], allSongs, randomIndex);
  };

  const handleFollow = () => {
    if (!artist) return;
    toggleFollowArtist({
      artistId,
      id: artistId,
      artistName: artist.stageName,
      stageName: artist.stageName,
      avatar: artist.avatarUrl,
      avatarUrl: artist.avatarUrl,
    });
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
        <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-6">
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-lg leading-tight">
            {artist.stageName}
          </h1>
          <p className="mt-1.5 sm:mt-3 text-xs sm:text-sm text-white/80">
            {formatFollowers(artist.followerCount)} người theo dõi
          </p>
        </div>
      </div>

      {/* ── ACTION BAR ─────────────────────────────────────────────────────── */}
      <DetailActionBar
        isPlaying={isArtistPlaying}
        onPlay={handlePlayArtist}
        disabled={allSongs.length === 0 && !isLoadingSongs}
        onShuffle={handleShufflePlay}
        isFollowed={isFollowed}
        onFollow={handleFollow}
        gradientFrom="from-spotify-black/60"
      />

      {/* ── NỘI DUNG ────────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 pb-10 flex flex-col gap-8 sm:gap-10">
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
                    isLiked={isFavoriteSong(song.id)}
                    onToggleLike={toggleFavoriteSong}
                    onPlayClick={handlePlayRow}
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
          <FilterChipsBar
            items={filterButtons.map((f) => ({ key: f.value, label: f.label }))}
            selectedKey={albumFilter}
            onSelect={setAlbumFilter}
            activeVariant="white"
            className="mb-4"
          />

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
                    id={album.id}
                    albumId={album.id}
                    artistId={artistId || album.ownerId}
                    artistName={artist?.stageName || album.ownerName}
                    title={album.title}
                    subtitle={`${
                      album.albumType === "ALBUM"
                        ? "Album"
                        : album.albumType === "EP"
                          ? "EP"
                          : "Đĩa đơn"
                    } • ${artist?.stageName || album.ownerName || album.releaseDate?.slice(0, 4) || ""}`}
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
