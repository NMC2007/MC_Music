import React, { useState, useMemo, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Pause, Music2, Heart, Search, X } from "lucide-react";
import {
  searchCatalogApi,
  getPublicGenres,
  getSongById,
} from "../api/catalog/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { useFollowArtists } from "../hooks/useFollowArtists";
import { usePlaybackActions } from "../hooks/usePlaybackActions";
import { CoverImage } from "../components/ui/CoverImage";
import { SongCard } from "../components/ui/SongCard";
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

  const [filterState, setFilterState] = useState({ keyword, filter: "all" });
  const [searchDraft, setSearchDraft] = useState({ keyword, value: keyword });
  const [loadingSongId, setLoadingSongId] = useState(null);

  const activeFilter = filterState.keyword === keyword ? filterState.filter : "all";
  const setActiveFilter = useCallback(
    (filter) => setFilterState({ keyword, filter }),
    [keyword]
  );

  const mobileSearchText = searchDraft.keyword === keyword ? searchDraft.value : keyword;
  const setMobileSearchText = useCallback(
    (value) => setSearchDraft({ keyword, value }),
    [keyword]
  );

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const { playAlbum: handlePlayAlbumCard, playArtist: handlePlayArtistCard } = usePlaybackActions();
  const {
    isFavoriteSong,
    toggleFavoriteSong,
    isFavoriteAlbum,
    toggleFavoriteAlbum,
  } = useFavorites();
  const { isFollowing, toggleFollowArtist } = useFollowArtists();

  const handleMobileSearchSubmit = (e) => {
    e.preventDefault();
    if (mobileSearchText.trim()) {
      navigate(`/search?q=${encodeURIComponent(mobileSearchText.trim())}`);
    } else {
      navigate("/search");
    }
  };

  const handleClearMobileSearch = () => {
    setMobileSearchText("");
    navigate("/search");
  };

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
  const songs = useMemo(() => searchResult?.songs || [], [searchResult]);
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
    })), [songs]);

  // Mobile Search Bar Component
  const renderMobileSearchBar = () => (
    <form onSubmit={handleMobileSearchSubmit} className="md:hidden mb-5">
      <div className="relative flex items-center bg-[#242424] focus-within:bg-[#2c2c2c] rounded-full px-3.5 py-2.5 border border-white/10 focus-within:border-white/30 transition-all shadow-inner">
        <Search size={18} className="text-neutral-400 flex-shrink-0" />
        <input
          type="text"
          value={mobileSearchText}
          onChange={(e) => setMobileSearchText(e.target.value)}
          placeholder="Bạn muốn nghe gì?"
          className="w-full bg-transparent border-none outline-none text-white text-sm ml-2.5 placeholder-neutral-400"
        />
        {mobileSearchText && (
          <button
            type="button"
            onClick={handleClearMobileSearch}
            className="p-1 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </form>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER: BROWSE MODE (chưa nhập keyword)
  // ═══════════════════════════════════════════════════════════════════════════
  if (!keyword.trim()) {
    return (
      <div className="flex flex-col pb-24 min-h-full px-4 sm:px-6 pt-4 sm:pt-6">
        {renderMobileSearchBar()}

        <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 sm:mb-6">Duyệt tìm tất cả</h1>

        {isLoadingGenres ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <SkeletonGenreCard key={i} />
            ))}
          </div>
        ) : genres.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {genres.map((genre, i) => (
              <div
                key={genre.id}
                onClick={() =>
                  navigate(`/genre/${genre.id}`, {
                    state: { genreId: genre.id, title: genre.name },
                  })
                }
                className={`relative rounded-xl overflow-hidden cursor-pointer group transition-all hover:scale-[1.03] active:scale-[0.97] shadow-md bg-gradient-to-br h-28 sm:h-36 md:h-40 ${GENRE_GRADIENTS[i % GENRE_GRADIENTS.length]}`}
              >
                {/* Tên thể loại ở góc trên bên trái */}
                <div className="absolute top-0 left-0 p-3 sm:p-4 z-10">
                  <span className="text-white font-black text-sm sm:text-base leading-snug line-clamp-2 drop-shadow">
                    {genre.name}
                  </span>
                </div>

                {/* Ảnh bìa góc dưới bên phải, xoay 25°, tràn ra ngoài */}
                {genre.coverImage && (
                  <img
                    src={genre.coverImage}
                    alt={genre.name}
                    className="absolute bottom-0 right-0 w-16 h-16 sm:w-20 sm:h-20 md:w-[90px] md:h-[90px] object-cover rounded-md shadow-2xl rotate-[25deg] translate-x-3 translate-y-3 sm:translate-x-4 sm:translate-y-4 transition-transform duration-300 group-hover:rotate-[20deg] group-hover:translate-x-2 group-hover:translate-y-2"
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
    <div className="flex flex-col pb-24 min-h-full px-4 sm:px-6 pt-4 sm:pt-6">
      {renderMobileSearchBar()}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-5 sm:mb-6 overflow-x-auto scrollbar-none pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id)}
            className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex-shrink-0 select-none ${
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
          <div className="w-full h-48 rounded-2xl bg-neutral-800 animate-pulse" />
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonResultRow key={i} />)}
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

          {/* ── 1. Kết quả hàng đầu (Hiển thị to rõ, trải rộng toàn chiều ngang) ── */}
          {topResult && (activeFilter === "all" || (activeFilter === "artists" && topResult.type === "ARTIST") || (activeFilter === "songs" && topResult.type === "SONG") || (activeFilter === "albums" && topResult.type === "ALBUM")) && (
            <section className="flex flex-col gap-3.5 w-full">
              <h2 className="text-2xl font-black text-white">Kết quả hàng đầu</h2>
              <TopResultCard
                topResult={topResult}
                loadingSongId={loadingSongId}
                onPlay={handlePlaySong}
                onPlayAlbum={handlePlayAlbumCard}
                onPlayArtist={handlePlayArtistCard}
                onNavigate={navigate}
                isPlaying={isPlaying}
                currentSong={currentSong}
                isFavoriteSong={isFavoriteSong}
                toggleFavoriteSong={toggleFavoriteSong}
                isFavoriteAlbum={isFavoriteAlbum}
                toggleFavoriteAlbum={toggleFavoriteAlbum}
                isFollowing={isFollowing}
                toggleFollowArtist={toggleFollowArtist}
              />
            </section>
          )}

          {/* ── 2. Bài hát liên quan (Dời xuống dưới Kết quả hàng đầu) ── */}
          {songs.length > 0 && (activeFilter === "all" || activeFilter === "songs") && (
            <section className="flex flex-col gap-3.5 w-full">
              <h2 className="text-2xl font-black text-white">Bài hát</h2>
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
                      <div className="w-11 h-11 flex-shrink-0 relative">
                        <CoverImage
                          src={song.coverImage}
                          alt={song.title}
                          className="w-full h-full object-cover rounded-md"
                        />
                        {isLoading && (
                          <div className="absolute inset-0 bg-black/60 rounded-md flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                        {!isLoading && (
                          <div className="absolute inset-0 bg-black/60 rounded-md opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                            {isCurrentSong && isPlaying ? (
                              <Pause size={16} fill="white" className="text-white" />
                            ) : (
                              <Play size={16} fill="white" className="text-white ml-0.5" />
                            )}
                          </div>
                        )}
                      </div>

                      {/* Thông tin bài hát */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/song/${song.id}`);
                          }}
                          title={song.title}
                          className={`text-sm font-semibold truncate hover:underline cursor-pointer transition-colors ${
                            isCurrentSong ? "text-[#fa2d48]" : "text-white"
                          }`}
                        >
                          {song.title}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (song.ownerId) navigate(`/artist/${song.ownerId}`);
                          }}
                          title={song.ownerName}
                          className="text-xs text-spotify-sub hover:underline hover:text-white transition-colors truncate mt-0.5 cursor-pointer"
                        >
                          {song.ownerName}
                        </span>
                      </div>

                      {/* Thời lượng + Actions */}
                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        {/* Like */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteSong(song);
                          }}
                          className={`p-2 sm:p-1.5 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer ${isLiked ? "text-[#fa2d48]" : "text-spotify-sub hover:text-white"}`}
                          title={isLiked ? "Xóa khỏi yêu thích" : "Thêm vào yêu thích"}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18"
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
            </section>
          )}

          {/* ── 3. Toàn bộ phần Album rời xuống dưới ── */}
          {albums.length > 0 && (activeFilter === "all" || activeFilter === "albums") && (
            <section>
              <h2 className="text-2xl font-black text-white mb-4">Album</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {albums.map((album) => (
                  <SongCard
                    key={album.id}
                    type="album"
                    id={album.id}
                    albumId={album.id}
                    artistId={album.ownerId}
                    title={album.title}
                    subtitle={`${album.releaseDate ? new Date(album.releaseDate).getFullYear() : "Album"} • ${album.ownerName || "Album"}`}
                    artistName={album.ownerName}
                    imageUrl={album.coverImage}
                    onClick={() => navigate(`/album/${album.id}`, { state: { album } })}
                    onPlayClick={() => handlePlayAlbumCard(album.id)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* ── 4. Phần Nghệ sĩ liên quan ── */}
          {artists.length > 0 && (activeFilter === "all" || activeFilter === "artists") && (
            <section>
              <h2 className="text-2xl font-black text-white mb-4">Nghệ sĩ</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {artists.map((artist) => (
                  <SongCard
                    key={artist.id}
                    type="artist"
                    id={artist.id}
                    artistId={artist.id}
                    title={artist.stageName}
                    subtitle="Nghệ sĩ"
                    artistName={artist.stageName}
                    imageUrl={artist.avatarUrl}
                    onClick={() => navigate(`/artist/${artist.id}`)}
                    onPlayClick={() => handlePlayArtistCard(artist.id)}
                  />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );
};

// ─── TopResult Card Component (Hiển thị to rõ, ảnh vuông trái, chữ phải) ──────
const TopResultCard = ({
  topResult,
  loadingSongId,
  onPlay,
  onPlayAlbum,
  onPlayArtist,
  onNavigate,
  isPlaying,
  currentSong,
  isFavoriteSong,
  toggleFavoriteSong,
  isFavoriteAlbum,
  toggleFavoriteAlbum,
  isFollowing,
  toggleFollowArtist,
}) => {
  if (!topResult?.item) return null;

  const { type, item } = topResult;

  const isArtist = type === "ARTIST";
  const isSong = type === "SONG";
  const isAlbum = type === "ALBUM";

  const name = isArtist ? item.stageName : item.title;
  const image = isArtist ? item.avatarUrl : item.coverImage;

  const handleCardClick = () => {
    if (isArtist) onNavigate(`/artist/${item.id}`);
    else if (isAlbum) onNavigate(`/album/${item.id}`);
    else if (isSong) onNavigate(`/song/${item.id}`);
  };

  const isCurrentPlaying = isSong && currentSong?.id === item.id && isPlaying;
  const isLoading = loadingSongId === item.id;

  const isSongLiked = isSong ? isFavoriteSong(item.id) : false;
  const isAlbumLiked = isAlbum ? isFavoriteAlbum(item.id) : false;
  const isArtistFollowed = isArtist ? isFollowing(item.id) : false;

  const handlePlayClick = (e) => {
    e.stopPropagation();
    if (isSong) {
      onPlay(item, [item]);
    } else if (isAlbum && onPlayAlbum) {
      onPlayAlbum(item.id);
    } else if (isArtist && onPlayArtist) {
      onPlayArtist(item.id);
    } else {
      handleCardClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="relative w-full bg-gradient-to-r from-[#1c1c1c] via-[#161616] to-[#121212] hover:from-[#242424] hover:via-[#1a1a1a] hover:to-[#161616] border border-white/5 hover:border-white/10 transition-all duration-300 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col sm:flex-row items-center sm:items-stretch gap-4 sm:gap-6 group cursor-pointer"
    >
      {/* ── Ảnh hiển thị hình vuông bên trái ── */}
      <div className="w-32 h-32 sm:w-44 sm:h-44 md:w-52 md:h-52 aspect-square flex-shrink-0 shadow-[0_16px_36px_rgba(0,0,0,0.7)] overflow-hidden rounded-2xl border border-white/10 relative">
        <CoverImage
          src={image}
          alt={name}
          isArtist={isArtist}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* ── Phần chữ hiển thị bên phải ── */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1 w-full text-center sm:text-left">
        <div>
          {/* Type Badge */}
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-white/10 text-white border border-white/10 shadow-sm">
              {isArtist ? "Nghệ sĩ" : isSong ? "Bài hát" : "Album"}
            </span>
            {(isSong || isAlbum) && item.ownerName && (
              <span className="text-xs text-neutral-400 truncate">
                bởi{" "}
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    if (item.ownerId) onNavigate(`/artist/${item.ownerId}`);
                  }}
                  className="text-neutral-200 font-semibold hover:underline hover:text-white cursor-pointer"
                >
                  {item.ownerName}
                </span>
              </span>
            )}
          </div>

          {/* Tên to rõ */}
          <h3
            onClick={(e) => {
              e.stopPropagation();
              if (isArtist) onNavigate(`/artist/${item.id}`);
              else if (isAlbum) onNavigate(`/album/${item.id}`);
              else if (isSong) onNavigate(`/song/${item.id}`);
            }}
            className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight line-clamp-2 my-1 hover:underline cursor-pointer group-hover:text-[#fa2d48] transition-colors"
            title={name}
          >
            {name}
          </h3>

          {/* Metadata phụ */}
          <p className="text-xs sm:text-sm text-spotify-sub mt-2 line-clamp-2">
            {isArtist
              ? (item.followerCount ? `${Number(item.followerCount).toLocaleString("vi-VN")} người theo dõi` : "Nghệ sĩ chính thức trên MC Music")
              : isSong
              ? (item.durationSeconds ? `Thời lượng: ${formatDuration(item.durationSeconds)} • Bản thu âm chính thức` : "Bản thu âm chất lượng cao")
              : (item.releaseDate ? `Năm phát hành: ${new Date(item.releaseDate).getFullYear()}` : "Tuyển tập album chính thức")}
          </p>
        </div>

        {/* Các nút hành động bên phải */}
        <div
          className="flex items-center justify-center sm:justify-start gap-2.5 sm:gap-3.5 mt-4 sm:mt-6 pt-2 flex-wrap"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Nút Play */}
          <button
            type="button"
            onClick={handlePlayClick}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#fa2d48] hover:bg-[#ff4b63] hover:scale-105 active:scale-95 flex items-center justify-center text-white shadow-[0_8px_20px_rgba(250,45,72,0.45)] transition-all cursor-pointer flex-shrink-0"
            title={isCurrentPlaying ? "Tạm dừng" : "Phát"}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isCurrentPlaying ? (
              <Pause size={24} fill="white" className="text-white" />
            ) : (
              <Play size={24} fill="white" className="text-white ml-0.5" />
            )}
          </button>

          {/* Nút Theo dõi (cho Nghệ sĩ) */}
          {isArtist && (
            <button
              type="button"
              onClick={() => toggleFollowArtist(item)}
              className={`px-5 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer select-none ${
                isArtistFollowed
                  ? "bg-white/10 text-white border-white/40 hover:bg-white/20 hover:border-white"
                  : "border-neutral-500 hover:border-white text-white bg-transparent hover:scale-105 active:scale-95"
              }`}
            >
              {isArtistFollowed ? "Đang theo dõi" : "Theo dõi"}
            </button>
          )}

          {/* Nút Yêu thích (cho Bài hát) */}
          {isSong && (
            <button
              type="button"
              onClick={() => toggleFavoriteSong(item)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer select-none ${
                isSongLiked
                  ? "border-[#fa2d48]/40 bg-[#fa2d48]/15 text-[#fa2d48]"
                  : "border-neutral-700 hover:border-white text-neutral-300 hover:text-white bg-transparent hover:scale-105"
              }`}
              title={isSongLiked ? "Xóa khỏi Bài hát đã thích" : "Thêm vào Bài hát đã thích"}
            >
              <Heart
                size={18}
                className={isSongLiked ? "fill-[#fa2d48] text-[#fa2d48]" : "currentColor"}
              />
              <span>{isSongLiked ? "Đã thích" : "Yêu thích"}</span>
            </button>
          )}

          {/* Nút Yêu thích (cho Album) */}
          {isAlbum && (
            <button
              type="button"
              onClick={() => toggleFavoriteAlbum({ ...item, albumId: item.id, id: item.id })}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold border transition-all cursor-pointer select-none ${
                isAlbumLiked
                  ? "border-[#fa2d48]/40 bg-[#fa2d48]/15 text-[#fa2d48]"
                  : "border-neutral-700 hover:border-white text-neutral-300 hover:text-white bg-transparent hover:scale-105"
              }`}
              title={isAlbumLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"}
            >
              <Heart
                size={18}
                className={isAlbumLiked ? "fill-[#fa2d48] text-[#fa2d48]" : "currentColor"}
              />
              <span>{isAlbumLiked ? "Đã lưu vào Thư viện" : "Lưu vào Thư viện"}</span>
            </button>
          )}

          {/* Add to Playlist menu (cho Bài hát) */}
          {isSong && (
            <div className="flex-shrink-0">
              <AddToPlaylistMenu song={item} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
