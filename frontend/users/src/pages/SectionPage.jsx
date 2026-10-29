import React, { useMemo, useEffect } from "react";
import { useParams, useNavigate, useLocation, useSearchParams } from "react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SongCard } from "../components/ui/SongCard";
import { SkeletonCard } from "../components/ui/Skeleton";
import { useAuthStore } from "../store/useAuthStore";
import { usePlayerStore } from "../store/usePlayerStore";
import {
  getPublicSongs,
  getPublicAlbums,
  getArtistSongs,
  getAlbumSongs,
  getSongById,
  getPublicGenres,
} from "../api/catalog/public";
import { getPublicArtists } from "../api/artists/public";
import { getUserPlayHistoryApi } from "../api/users/history";
import { useFavorites } from "../hooks/useFavorites";
import { useFollowArtists } from "../hooks/useFollowArtists";

export const SectionPage = () => {
  const { id: sectionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { playSongWithContext } = usePlayerStore();
  const { favoriteSongs, isLoadingSongs: isLoadingFavorites } = useFavorites();
  const { followedArtists, isLoadingFollowed } = useFollowArtists();

  // Kiểm tra nếu là trang thể loại
  const isGenre =
    location.pathname.startsWith("/genre/") ||
    sectionId?.startsWith("genre-") ||
    Boolean(location.state?.genreId);

  const genreId = isGenre
    ? location.state?.genreId ||
      (sectionId?.startsWith("genre-") ? sectionId.replace("genre-", "") : sectionId)
    : null;

  // Đọc số trang từ URL (1-indexed), API nhận 0-indexed
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const apiPage = currentPage - 1;

  // Đảm bảo luôn cuộn lên đầu trang khi mở mục mới hoặc chuyển trang
  useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector("main");
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [sectionId, genreId, currentPage]);

  // 1. Những bài hát thịnh hành (size: 20)
  const isTrending = sectionId === "trending-songs";
  const { data: trendingData, isLoading: isLoadingTrending } = useQuery({
    queryKey: ["publicSongs", "trending-all", 20],
    queryFn: () => getPublicSongs({ page: 0, size: 20, sort: "playCount,desc" }),
    enabled: isTrending,
  });

  // 2. Nghệ sĩ phổ biến (size: 20)
  const isArtists = sectionId === "popular-artists";
  const { data: artistsData, isLoading: isLoadingArtists } = useQuery({
    queryKey: ["publicArtists", "popular-all", 20],
    queryFn: () => getPublicArtists({ page: 0, size: 20, sort: "followerCount,desc" }),
    enabled: isArtists,
  });

  // 3. Album và đĩa đơn nổi tiếng (size: 20)
  const isAlbums = sectionId === "popular-albums";
  const { data: albumsData, isLoading: isLoadingAlbums } = useQuery({
    queryKey: ["publicAlbums", "popular-all", 20],
    queryFn: () => getPublicAlbums({ page: 0, size: 20, sort: "likeCount,desc" }),
    enabled: isAlbums,
  });

  // 4. Nghe gần đây (size: 50 -> lọc trùng -> lấy 20)
  const isHistory = sectionId === "recent-history";
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["userPlayHistory", "section-all", 50],
    queryFn: () => getUserPlayHistoryApi({ page: 0, size: 50 }),
    enabled: isHistory && !!isAuthenticated,
  });

  // 5. Bài hát yêu thích
  const isFavorites = sectionId === "favorite-songs";

  // 6. Nghệ sĩ bạn theo dõi
  const isFollowed = sectionId === "followed-artists";

  // 7. Lọc bài hát theo thể loại với 30 item mỗi trang
  const { data: genresData } = useQuery({
    queryKey: ["publicGenres"],
    queryFn: getPublicGenres,
    enabled: isGenre && !location.state?.title,
    staleTime: 1000 * 60 * 10,
  });

  const fallbackGenreName = useMemo(() => {
    if (!isGenre || !genresData?.data) return "";
    const matched = genresData.data.find((g) => g.id === genreId);
    return matched ? matched.name : "";
  }, [isGenre, genresData, genreId]);

  const { data: genreSongsData, isLoading: isLoadingGenreSongs } = useQuery({
    queryKey: ["publicSongs", "genre", genreId, apiPage, 30],
    queryFn: () =>
      getPublicSongs({
        genreId,
        page: apiPage,
        size: 30,
        sort: "createdAt,desc",
      }),
    enabled: isGenre && Boolean(genreId),
    placeholderData: keepPreviousData,
  });

  const formatAlbumType = (type) => {
    if (!type) return "Album";
    if (type.toUpperCase() === "EP") return "EP";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const handlePlayHistoryCard = async (historyItem) => {
    try {
      const res = await getSongById(historyItem.songId);
      const song = res?.data;
      if (song) {
        playSongWithContext(song, [song]);
      }
    } catch (err) {
      console.error("Lỗi khi phát bài hát từ lịch sử:", err);
    }
  };

  const handlePlayFavoriteCard = async (favItem) => {
    try {
      const res = await getSongById(favItem.songId);
      const song = res?.data;
      if (song) {
        playSongWithContext(song, [song]);
      }
    } catch (err) {
      console.error("Lỗi khi phát bài hát từ danh sách yêu thích:", err);
    }
  };

  const handlePlayArtistCard = async (artistId) => {
    try {
      const res = await getArtistSongs(artistId, {
        size: 50,
        sort: "likeCount,desc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        playSongWithContext(songs[randomIndex], songs, randomIndex);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlayAlbumCard = async (albumId) => {
    try {
      const res = await getAlbumSongs(albumId, {
        size: 50,
        sort: "createdAt,asc",
      });
      const songs = res.data?.content || [];
      if (songs.length > 0) {
        playSongWithContext(songs[0], songs, 0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Lọc trùng lặp bài hát gần đây
  const recentHistorySongs = useMemo(() => {
    const rawHistory = historyData?.data?.content || [];
    const seenSongIds = new Set();
    const uniqueList = [];

    for (const item of rawHistory) {
      const sId = item.songId || item.id;
      if (sId && !seenSongIds.has(sId)) {
        seenSongIds.add(sId);
        uniqueList.push(item);
      }
    }

    return uniqueList.slice(0, 20);
  }, [historyData]);

  // Xử lý chuyển trang
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage === currentPage) return;
    setSearchParams({ page: newPage.toString() });
  };

  // Tạo danh sách số trang cho component phân trang
  const getPageNumbers = (current, total) => {
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    const pages = [];
    if (current <= 4) {
      pages.push(1, 2, 3, 4, 5, "...", total);
    } else if (current >= total - 3) {
      pages.push(1, "...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      pages.push(1, "...", current - 1, current, current + 1, "...", total);
    }
    return pages;
  };

  // Xác định dữ liệu hiển thị theo sectionId hoặc genreId
  let title = location.state?.title || "";
  let itemType = "song"; // "song" | "artist" | "album"
  let items = [];
  let isLoading = false;
  let emptyMessage = "Chưa có nội dung để hiển thị.";
  let totalPages = 0;
  let totalElements = 0;

  if (isGenre) {
    title = title || fallbackGenreName || "Thể loại";
    itemType = "song";
    items = genreSongsData?.data?.content || [];
    totalPages = genreSongsData?.data?.totalPages || 0;
    totalElements = genreSongsData?.data?.totalElements || 0;
    isLoading = isLoadingGenreSongs;
    emptyMessage = "Chưa có bài hát nào thuộc thể loại này.";
  } else if (isTrending) {
    title = title || "Những bài hát thịnh hành";
    itemType = "song";
    items = trendingData?.data?.content || [];
    isLoading = isLoadingTrending;
    emptyMessage = "Chưa có bài hát nào thịnh hành.";
  } else if (isArtists) {
    title = title || "Nghệ sĩ phổ biến";
    itemType = "artist";
    items = artistsData?.data?.content || [];
    isLoading = isLoadingArtists;
    emptyMessage = "Chưa có nghệ sĩ nào để hiển thị.";
  } else if (isAlbums) {
    title = title || "Album và đĩa đơn nổi tiếng";
    itemType = "album";
    items = albumsData?.data?.content || [];
    isLoading = isLoadingAlbums;
    emptyMessage = "Chưa có album nào để hiển thị.";
  } else if (isHistory) {
    title = title || "Nghe gần đây";
    itemType = "song";
    items = recentHistorySongs;
    isLoading = isLoadingHistory;
    emptyMessage = "Bạn chưa có bài hát nào trong lịch sử nghe gần đây.";
  } else if (isFavorites) {
    title = title || "Bài hát yêu thích";
    itemType = "song";
    items = (favoriteSongs || []).slice(0, 20);
    isLoading = isLoadingFavorites;
    emptyMessage = "Bạn chưa có bài hát nào trong danh sách yêu thích.";
  } else if (isFollowed) {
    title = title || "Nghệ sĩ bạn theo dõi";
    itemType = "artist";
    items = (followedArtists || []).slice(0, 20);
    isLoading = isLoadingFollowed;
    emptyMessage = "Bạn chưa theo dõi nghệ sĩ nào.";
  }

  const renderCard = (item, idx) => {
    if (itemType === "artist") {
      const artistId = item.artistId || item.id;
      const stageName = item.artistName || item.stageName;
      const avatarUrl = item.avatar || item.avatarUrl;

      return (
        <SongCard
          key={artistId || idx}
          type="artist"
          title={stageName}
          subtitle="Nghệ sĩ"
          artistName={stageName}
          imageUrl={avatarUrl}
          onClick={() => navigate(`/artist/${artistId}`)}
          onPlayClick={() => handlePlayArtistCard(artistId)}
        />
      );
    }

    if (itemType === "album") {
      return (
        <SongCard
          key={item.id || idx}
          type="album"
          title={item.title}
          subtitle={`${formatAlbumType(item.albumType)} • ${item.ownerName}`}
          artistName={item.ownerName}
          imageUrl={item.coverImage}
          onClick={() =>
            navigate(`/album/${item.id}`, { state: { album: item } })
          }
          onPlayClick={() => handlePlayAlbumCard(item.id)}
        />
      );
    }

    if (isHistory) {
      return (
        <SongCard
          key={item.id || item.songId || idx}
          type="song"
          title={item.songTitle}
          subtitle={item.artistName}
          artistName={item.artistName}
          imageUrl={item.coverImage}
          onClick={() => handlePlayHistoryCard(item)}
          onPlayClick={() => handlePlayHistoryCard(item)}
        />
      );
    }

    if (isFavorites) {
      return (
        <SongCard
          key={item.songId || idx}
          type="song"
          title={item.songTitle}
          subtitle={item.artistName}
          artistName={item.artistName}
          imageUrl={item.coverImage}
          onClick={() => handlePlayFavoriteCard(item)}
          onPlayClick={() => handlePlayFavoriteCard(item)}
        />
      );
    }

    // Mặc định: bài hát thịnh hành hoặc bài hát theo thể loại
    return (
      <SongCard
        key={item.id || idx}
        type="song"
        title={item.title}
        subtitle={item.ownerName}
        artistName={item.ownerName}
        imageUrl={item.coverImage}
        onClick={() => playSongWithContext(item, items, idx)}
        onPlayClick={() => playSongWithContext(item, items, idx)}
      />
    );
  };

  return (
    <div className="flex flex-col gap-6 pb-16 min-h-full">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          {title}
        </h1>
        {isGenre && totalElements > 0 && (
          <span className="text-xs sm:text-sm text-spotify-sub">
            {totalElements} bài hát
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: isGenre ? 30 : 20 }).map((_, idx) => (
            <SkeletonCard key={idx} isArtist={itemType === "artist"} />
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {items.map((item, idx) => renderCard(item, idx))}
        </div>
      ) : (
        <div className="py-20 text-center text-spotify-sub flex flex-col items-center justify-center gap-2">
          <p className="text-base">{emptyMessage}</p>
        </div>
      )}

      {/* Phân trang khi có nhiều hơn 1 trang */}
      {isGenre && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 pt-6 border-t border-white/5">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentPage <= 1
                ? "opacity-30 cursor-not-allowed text-neutral-500"
                : "hover:bg-neutral-800 text-white cursor-pointer"
            }`}
          >
            <ChevronLeft size={16} />
            <span>Trước</span>
          </button>

          <div className="flex items-center gap-1.5">
            {getPageNumbers(currentPage, totalPages).map((p, idx) => {
              if (p === "...") {
                return (
                  <span
                    key={`dots-${idx}`}
                    className="px-2 text-neutral-500 text-sm select-none"
                  >
                    ...
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  type="button"
                  key={p}
                  onClick={() => handlePageChange(p)}
                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-all cursor-pointer flex items-center justify-center ${
                    isActive
                      ? "bg-[#fa2d48] text-white shadow-md shadow-[#fa2d48]/30"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              currentPage >= totalPages
                ? "opacity-30 cursor-not-allowed text-neutral-500"
                : "hover:bg-neutral-800 text-white cursor-pointer"
            }`}
          >
            <span>Sau</span>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
