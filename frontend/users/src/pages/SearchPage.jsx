import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Music2 } from "lucide-react";
import {
  searchCatalogApi,
  getPublicGenres,
  getSongById,
} from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { CoverImage } from "../components/ui/CoverImage";
import { Button } from "../components/ui/Button";
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";

// ─── Màu gradient ngẫu nhiên cho card thể loại ─────────────────────────────
const GENRE_GRADIENTS = [
  "from-[#1a53ff] to-[#0d2aa3]",
  "from-[#e91429] to-[#8c0c19]",
  "from-[#1db954] to-[#0f6b30]",
  "from-[#ff5a00] to-[#a33600]",
  "from-[#9b59b6] to-[#5e2f8e]",
  "from-[#00bcd4] to-[#006e80]",
  "from-[#e91e8c] to-[#9b0055]",
  "from-[#ff9800] to-[#b36200]",
  "from-[#607d8b] to-[#37474f]",
  "from-[#795548] to-[#4e342e]",
  "from-[#2196f3] to-[#0d47a1]",
  "from-[#4caf50] to-[#1b5e20]",
];

// ─── FilterTab chips ─────────────────────────────────────────────────────────
const FILTER_TABS = [
  { id: "all", label: "Tất cả" },
  { id: "songs", label: "Bài hát" },
  { id: "artists", label: "Nghệ sĩ" },
  { id: "albums", label: "Album" },
];

// ─── Skeleton components ─────────────────────────────────────────────────────
const SkeletonGenreCard = () => (
  <div className="rounded-xl overflow-hidden h-24 animate-pulse bg-neutral-800" />
);

const SkeletonResultRow = () => (
  <div className="flex items-center gap-3 px-2 py-2 animate-pulse">
    <div className="w-10 h-10 rounded bg-neutral-800 flex-shrink-0" />
    <div className="flex flex-col gap-1.5 flex-1">
      <div className="h-3 bg-neutral-800 rounded w-2/3" />
      <div className="h-2.5 bg-neutral-800/70 rounded w-1/3" />
    </div>
  </div>
);

// ─── Format duration ─────────────────────────────────────────────────────────
const formatDuration = (seconds) => {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const keyword = searchParams.get("q") || "";

  const [activeFilter, setActiveFilter] = useState("all");
  const [loadingSongId, setLoadingSongId] = useState(null);

  const { currentSong, isPlaying, setIsPlaying, playSongWithContext } = usePlayerStore();
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  // Reset filter khi keyword thay đổi
  useEffect(() => {
    setActiveFilter("all");
  }, [keyword]);

  // ── 1. Fetch thể loại (luôn fetch để dùng ở Browse Mode) ──────────────────
  const { data: genresData, isLoading: isLoadingGenres } = useQuery({
    queryKey: ["publicGenres"],
    queryFn: getPublicGenres,
    staleTime: 1000 * 60 * 10, // 10 phút
  });

  const genres = useMemo(() => genresData?.data || [], [genresData]);

  // ── 2. Fetch kết quả tìm kiếm (chỉ khi có keyword) ───────────────────────
  const { data: searchData, isLoading: isLoadingSearch } = useQuery({
    queryKey: ["unifiedSearch", keyword],
    queryFn: () => searchCatalogApi(keyword, 8),
    enabled: keyword.trim().length > 0,
    staleTime: 1000 * 30, // 30 giây
  });

  const searchResult = useMemo(() => searchData?.data || null, [searchData]);
  const topResult = searchResult?.topResult || null;
  const songs = searchResult?.songs || [];
  const albums = searchResult?.albums || [];
  const artists = searchResult?.artists || [];

  const hasAnyResult = songs.length > 0 || albums.length > 0 || artists.length > 0 || topResult;

  // ── 3. Phát nhạc ──────────────────────────────────────────────────────────
  const handlePlaySong = async (song, pool = []) => {
    const songId = song?.id || song?.songId;
    if (!songId) return;

    // Nếu đang phát bài này rồi thì toggle
    if (currentSong?.id === songId) {
      setIsPlaying(!isPlaying);
      return;
    }

    try {
      setLoadingSongId(songId);
      const res = await getSongById(songId);
      const fullSong = res?.data;
      if (fullSong) {
        const contextPool = pool.length > 0 ? pool : [fullSong];
        const idx = contextPool.findIndex((s) => (s.id || s.songId) === songId);
        playSongWithContext(fullSong, contextPool, Math.max(0, idx));
      }
    } catch (err) {
      console.error("Lỗi phát bài hát từ kết quả tìm kiếm:", err);
    } finally {
      setLoadingSongId(null);
    }
  };

  // ── 4. Pool bài hát cho play-all context ─────────────────────────────────
  const songsPool = useMemo(() =>
    songs.map((s) => ({
      id: s.id,
      title: s.title,
      artistName: s.ownerName,
      coverImage: s.coverImage,
    })), [searchResult]); // eslint-disable-line react-hooks/exhaustive-deps

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: BROWSE MODE (chưa nhập keyword)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!keyword.trim()) {
    return (
      <div className="flex flex-col pb-24 min-h-full px-6 pt-6">
        <h1 className="text-3xl font-black text-white mb-6">Duyệt tìm tất cả</h1>

        {isLoadingGenres ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonGenreCard key={i} />
            ))}
          </div>
        ) : genres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {genres.map((genre, i) => (
              <div
                key={genre.id}
                onClick={() => navigate(`/search?genreId=${genre.id}&genreName=${encodeURIComponent(genre.name)}`)}
                className={`relative rounded-lg overflow-hidden cursor-pointer group transition-all hover:scale-[1.03] active:scale-[0.97] shadow-md bg-gradient-to-br ${GENRE_GRADIENTS[i % GENRE_GRADIENTS.length]}`}
                style={{ height: '160px' }}
              >
                {/* Tên thể loại ở góc trên bên trái */}
                <div className="absolute top-0 left-0 p-4 z-10">
                  <span className="text-white font-black text-base leading-snug line-clamp-2 drop-shadow">
                    {genre.name}
                  </span>
                </div>

                {/* Ảnh bìa góc dưới bên phải, xoay 25°, tràn ra ngoài */}
                {genre.coverImage && (
                  <img
                    src={genre.coverImage}
                    alt={genre.name}
                    className="absolute bottom-0 right-0 w-[90px] h-[90px] object-cover rounded-md shadow-2xl rotate-[25deg] translate-x-4 translate-y-4 transition-transform duration-300 group-hover:rotate-[20deg] group-hover:translate-x-3 group-hover:translate-y-3"
                  />
                )}

                {/* Tối ảnh nhẹ khi hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-spotify-sub text-sm text-center py-16">
            Chưa có thể loại nào.
          </div>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: RESULTS MODE (có keyword)
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col pb-24 min-h-full px-6 pt-6">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all cursor-pointer ${
              activeFilter === tab.id
                ? "bg-white text-black"
                : "bg-neutral-800 text-white hover:bg-neutral-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {isLoadingSearch && (
        <div className="space-y-6">
          <div className="flex gap-6">
            <div className="w-56 h-56 rounded-xl bg-neutral-800 animate-pulse flex-shrink-0" />
            <div className="flex-1 flex flex-col gap-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonResultRow key={i} />)}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoadingSearch && !hasAnyResult && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Music2 size={64} className="text-neutral-600" />
          <h2 className="text-xl font-bold text-white">
            Không tìm thấy kết quả cho "{keyword}"
          </h2>
          <p className="text-spotify-sub text-sm max-w-sm">
            Hãy kiểm tra lại chính tả hoặc thử tìm kiếm với từ khóa khác.
          </p>
        </div>
      )}

      {/* Results */}
      {!isLoadingSearch && hasAnyResult && (
        <div className="flex flex-col gap-10">

          {/* ── Section: Kết quả hàng đầu + Bài hát ─────────────────────── */}
          {(activeFilter === "all" || activeFilter === "songs" || activeFilter === "artists") && (
            <div className={`flex flex-col ${activeFilter === "all" ? "lg:flex-row" : ""} gap-6`}>

              {/* Top Result Card */}
              {topResult && (activeFilter === "all" || (activeFilter === "artists" && topResult.type === "ARTIST")) && (
                <div className="flex flex-col gap-3 lg:w-[280px] flex-shrink-0">
                  <h2 className="text-xl font-bold text-white">Kết quả hàng đầu</h2>
                  <TopResultCard
                    topResult={topResult}
                    loadingSongId={loadingSongId}
                    onPlay={handlePlaySong}
                    onNavigate={navigate}
                    isPlaying={isPlaying}
                    currentSong={currentSong}
                  />
                </div>
              )}

              {/* Bài hát */}
              {songs.length > 0 && (activeFilter === "all" || activeFilter === "songs") && (
                <div className="flex flex-col gap-3 flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-white">Bài hát</h2>
                  <div className="flex flex-col">
                    {songs.slice(0, activeFilter === "all" ? 5 : songs.length).map((song) => {
                      const isCurrentSong = currentSong?.id === song.id;
                      const isLoading = loadingSongId === song.id;
                      const isLiked = isFavoriteSong(song.id);

                      return (
                        <div
                          key={song.id}
                          onClick={() => handlePlaySong(song, songsPool)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer group transition-colors ${
                            isCurrentSong ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
                          }`}
                        >
                          {/* Ảnh bìa */}
                          <div className="w-10 h-10 flex-shrink-0 relative">
                            <CoverImage
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover rounded"
                            />
                            {isLoading && (
                              <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                            {!isLoading && (
                              <div className="absolute inset-0 bg-black/60 rounded opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                {isCurrentSong && isPlaying ? (
                                  <Pause size={14} fill="white" className="text-white" />
                                ) : (
                                  <Play size={14} fill="white" className="text-white ml-0.5" />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Thông tin bài hát */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className={`text-sm font-medium truncate ${isCurrentSong ? "text-[#fa2d48]" : "text-white"}`}>
                              {song.title}
                            </span>
                            <span className="text-xs text-spotify-sub truncate">
                              {song.ownerName}
                            </span>
                          </div>

                          {/* Thời lượng + Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Like */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteSong(song);
                              }}
                              className={`p-1.5 rounded-full transition-all opacity-0 group-hover:opacity-100 ${isLiked ? "opacity-100 text-[#fa2d48]" : "text-spotify-sub hover:text-white"}`}
                              title={isLiked ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16"
                                fill={isLiked ? "#fa2d48" : "none"} stroke={isLiked ? "#fa2d48" : "currentColor"}
                                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                              </svg>
                            </button>

                            <span className="text-xs text-spotify-sub w-10 text-right">
                              {formatDuration(song.durationSeconds)}
                            </span>

                            {/* Add to playlist */}
                            <div onClick={(e) => e.stopPropagation()}>
                              <AddToPlaylistMenu song={song} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Section: Nghệ sĩ ─────────────────────────────────────────── */}
          {artists.length > 0 && (activeFilter === "all" || activeFilter === "artists") && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Nghệ sĩ</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {artists.map((artist) => (
                  <div
                    key={artist.id}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    className="bg-transparent hover:bg-spotify-hover transition-all p-3 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-3">
                      <CoverImage
                        src={artist.avatarUrl}
                        alt={artist.stageName}
                        isArtist={true}
                        className="w-full aspect-square object-cover rounded-full shadow-lg"
                      />
                      <Button
                        variant="primary"
                        size="md"
                        iconOnly
                        onClick={(e) => { e.stopPropagation(); }}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                      >
                        <Play size={20} className="fill-white text-white ml-0.5" />
                      </Button>
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{artist.stageName}</p>
                    <p className="text-spotify-sub text-xs mt-0.5 truncate">Nghệ sĩ</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Section: Album ─────────────────────────────────────────────── */}
          {albums.length > 0 && (activeFilter === "all" || activeFilter === "albums") && (
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Album</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => navigate(`/album/${album.id}`)}
                    className="bg-transparent hover:bg-spotify-hover transition-all p-3 rounded-lg cursor-pointer group"
                  >
                    <div className="relative mb-3">
                      <CoverImage
                        src={album.coverImage}
                        alt={album.title}
                        className="w-full aspect-square object-cover rounded-md shadow-lg"
                      />
                      <Button
                        variant="primary"
                        size="md"
                        iconOnly
                        onClick={(e) => { e.stopPropagation(); }}
                        className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg"
                      >
                        <Play size={20} className="fill-white text-white ml-0.5" />
                      </Button>
                    </div>
                    <p className="text-white font-semibold text-sm truncate">{album.title}</p>
                    <p className="text-spotify-sub text-xs mt-0.5 truncate">
                      {album.releaseDate ? new Date(album.releaseDate).getFullYear() : ""} • Album
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

// ─── TopResult Card Component ────────────────────────────────────────────────
const TopResultCard = ({ topResult, loadingSongId, onPlay, onNavigate, isPlaying, currentSong }) => {
  if (!topResult?.item) return null;

  const { type, item } = topResult;

  const isArtist = type === "ARTIST";
  const isSong = type === "SONG";
  const isAlbum = type === "ALBUM";

  const name = isArtist ? item.stageName : item.title;
  const image = isArtist ? item.avatarUrl : item.coverImage;
  const subtitle = isArtist ? "Nghệ sĩ" : isSong ? `Bài hát • ${item.ownerName || ""}` : `Album • ${item.ownerName || ""}`;

  const handleCardClick = () => {
    if (isArtist) onNavigate(`/artist/${item.id}`);
    else if (isAlbum) onNavigate(`/album/${item.id}`);
    else onPlay(item, []);
  };

  const isCurrentPlaying = isSong && currentSong?.id === item.id && isPlaying;
  const isLoading = loadingSongId === item.id;

  return (
    <div
      onClick={handleCardClick}
      className="relative bg-[#181818] hover:bg-[#282828] transition-colors rounded-xl p-5 cursor-pointer group h-full min-h-[200px] flex flex-col justify-between shadow-lg"
    >
      {/* Ảnh */}
      <div className={`w-24 h-24 shadow-2xl flex-shrink-0 mb-4 ${isArtist ? "rounded-full" : "rounded-lg"} overflow-hidden`}>
        <CoverImage
          src={image}
          alt={name}
          isArtist={isArtist}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thông tin */}
      <div>
        <h3 className="text-2xl font-black text-white truncate leading-tight">{name}</h3>
        <p className="text-sm text-spotify-sub mt-1">{subtitle}</p>
      </div>

      {/* Nút Play nổi */}
      <Button
        variant="primary"
        size="lg"
        iconOnly
        onClick={(e) => {
          e.stopPropagation();
          if (isSong) onPlay(item, []);
          else handleCardClick();
        }}
        className="absolute bottom-5 right-5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-[0_8px_20px_rgba(250,45,72,0.5)]"
      >
        {isLoading ? (
          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : isCurrentPlaying ? (
          <Pause size={28} fill="white" className="text-white" />
        ) : (
          <Play size={28} fill="white" className="text-white ml-1" />
        )}
      </Button>
    </div>
  );
};
