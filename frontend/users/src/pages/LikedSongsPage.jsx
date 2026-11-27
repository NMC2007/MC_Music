import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  HeartOff,
  Search,
  List,
  Check,
  Music2,
} from "lucide-react";

import { useFavorites } from "../hooks/useFavorites";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { getSongById, getPublicGenres } from "../api/catalog/public";
import { EmptyState } from "../components/ui/EmptyState";
import { FilterChipsBar } from "../components/ui/FilterChipsBar";
import { TrackTable } from "../components/ui/TrackTable";

// Danh sách các thể loại âm nhạc thịnh hành & nổi tiếng (Curated Popular Genres)
const POPULAR_GENRES = [
  { id: "rap", name: "Rap" },
  { id: "hip-hop", name: "Hip-Hop" },
  { id: "pop", name: "Pop" },
  { id: "ballad", name: "Ballad" },
  { id: "rb", name: "R&B" },
  { id: "indie", name: "Indie" },
  { id: "edm", name: "EDM" },
  { id: "acoustic", name: "Acoustic" },
  { id: "lofi", name: "Lofi" },
  { id: "rock", name: "Rock" },
];

// Danh sách các tiêu chí sắp xếp
const SORT_OPTIONS = [
  { id: "recent", label: "Mới thêm gần đây" },
  { id: "oldest", label: "Cũ nhất" },
  { id: "title_asc", label: "Tên bài hát (A - Z)" },
  { id: "artist_asc", label: "Nghệ sĩ (A - Z)" },
  { id: "duration_desc", label: "Thời lượng giảm dần" },
];

export const LikedSongsPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const {
    favoriteSongs,
    favoriteSongIds,
    isLoadingSongs,
    toggleFavoriteSong,
  } = useFavorites();

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [loadingSongId, setLoadingSongId] = useState(null);
  const [openMenuSongId, setOpenMenuSongId] = useState(null);

  // Fetch danh sách thể loại từ Catalog Service
  const { data: genresData } = useQuery({
    queryKey: ["publicGenres"],
    queryFn: getPublicGenres,
    staleTime: 1000 * 60 * 10,
  });

  // Lọc chỉ giữ lại các thể loại nổi tiếng & phổ biến, liên kết id với DB nếu có
  const genres = useMemo(() => {
    const dbGenres = genresData?.data || [];

    return POPULAR_GENRES.map((popular) => {
      const matched = dbGenres.find((dbG) => {
        const cleanDb = (dbG.name || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanPop = popular.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanDb === cleanPop;
      });

      return {
        id: matched?.id || popular.id,
        name: popular.name,
        key: popular.id,
        dbId: matched?.id || null,
      };
    });
  }, [genresData]);

  // State bộ lọc thể loại (null = Tất cả, hoặc key thể loại như "rap", "hip-hop"...)
  const [selectedGenreKey, setSelectedGenreKey] = useState(null);

  const activeGenreObj = useMemo(() => {
    if (!selectedGenreKey) return null;
    return genres.find((g) => g.key === selectedGenreKey) || null;
  }, [genres, selectedGenreKey]);

  // State sắp xếp
  const [sortBy, setSortBy] = useState("recent");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef(null);

  // Đóng dropdown sắp xếp khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSortOpen]);

  const genreFilterItems = useMemo(
    () => genres.map((g) => ({ key: g.key, label: g.name })),
    [genres]
  );

  // Tự động đóng menu tùy chọn khi click ra ngoài
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".more-menu-container")) {
        setOpenMenuSongId(null);
      }
    };
    if (openMenuSongId) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openMenuSongId]);

  // Lọc bài hát theo từ khóa tìm kiếm, thể loại và sắp xếp theo tiêu chí
  const filteredSongs = useMemo(() => {
    let result = [...favoriteSongs];

    // 1. Lọc theo từ khóa tìm kiếm
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.songTitle?.toLowerCase().includes(q) ||
          s.artistName?.toLowerCase().includes(q)
      );
    }

    // 2. Lọc theo thể loại
    if (activeGenreObj) {
      const targetKey = activeGenreObj.key.toLowerCase();
      const targetName = activeGenreObj.name.toLowerCase();
      const targetDbId = activeGenreObj.dbId ? activeGenreObj.dbId.toLowerCase() : null;
      const cleanTargetName = targetName.replace(/[^a-z0-9]/g, "");

      result = result.filter((s) => {
        if (!s.genres || s.genres.length === 0) return false;
        return s.genres.some((g) => {
          const gId = (g.id || "").toLowerCase();
          const gName = (g.name || "").toLowerCase();
          const cleanGName = gName.replace(/[^a-z0-9]/g, "");

          // 1. Khớp theo UUID thể loại từ DB
          if (targetDbId && gId && gId === targetDbId) return true;

          // 2. Khớp theo tên chuẩn hóa
          if (cleanGName && cleanTargetName && cleanGName === cleanTargetName) return true;

          // 3. Khớp theo key
          if (cleanGName && cleanGName === targetKey.replace(/[^a-z0-9]/g, "")) return true;

          // 4. Alias Rap & Hip-Hop (khớp bài hát gắn thẻ Rap hoặc Hip-Hop)
          if (
            (targetKey.includes("rap") || cleanTargetName.includes("rap") || targetKey.includes("hiphop") || cleanTargetName.includes("hiphop")) &&
            (cleanGName.includes("rap") || cleanGName.includes("hiphop"))
          ) {
            return true;
          }

          // 5. Alias Lofi & Lo-Fi & Chill
          if (
            (targetKey.includes("lofi") || cleanTargetName.includes("lofi")) &&
            (cleanGName.includes("lofi") || cleanGName.includes("chill"))
          ) {
            return true;
          }

          // 6. Alias R&B & Soul
          if (
            (targetKey.includes("rb") || cleanTargetName.includes("rb") || cleanTargetName.includes("rnb")) &&
            (cleanGName.includes("rb") || cleanGName.includes("rnb") || cleanGName.includes("soul"))
          ) {
            return true;
          }

          // 7. Alias EDM & Dance & Electronic
          if (
            (targetKey.includes("edm") || cleanTargetName.includes("edm")) &&
            (cleanGName.includes("edm") || cleanGName.includes("dance") || cleanGName.includes("electro"))
          ) {
            return true;
          }

          // 8. Alias Pop (Pop, V-Pop, K-Pop, US-UK)
          if (
            (targetKey === "pop" || cleanTargetName === "pop") &&
            cleanGName.includes("pop")
          ) {
            return true;
          }

          return false;
        });
      });
    }

    // 3. Sắp xếp danh sách
    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case "title_asc":
          return (a.songTitle || "").localeCompare(b.songTitle || "", "vi");
        case "artist_asc":
          return (a.artistName || "").localeCompare(b.artistName || "", "vi");
        case "duration_desc":
          return (b.durationSeconds || 0) - (a.durationSeconds || 0);
        case "recent":
        default:
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
    });

    return result;
  }, [favoriteSongs, searchQuery, activeGenreObj, sortBy]);

  // Kiểm tra bài hát đang phát có nằm trong danh sách bài hát đã thích không
  const isCurrentPlaylistPlaying =
    isPlaying &&
    currentSong &&
    favoriteSongs.some((s) => s.songId === currentSong.id);

  // Xử lý phát 1 bài hát cụ thể khi bấm vào dòng
  const handlePlaySong = useCallback(
    async (favItem, index) => {
      try {
        setLoadingSongId(favItem.songId);
        const res = await getSongById(favItem.songId);
        const fullSong = res?.data;

        if (fullSong) {
          const pool = favoriteSongs.map((f) =>
            f.songId === fullSong.id
              ? fullSong
              : {
                  id: f.songId,
                  title: f.songTitle,
                  artist: f.artistName,
                  coverImage: f.coverImage,
                }
          );
          playSongWithContext(fullSong, pool, index);
        }
      } catch (err) {
        console.error("Lỗi khi phát bài hát yêu thích:", err);
      } finally {
        setLoadingSongId(null);
      }
    },
    [favoriteSongs, playSongWithContext]
  );

  const renderExtraMenuActions = useCallback(
    (song) => (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          toggleFavoriteSong(song);
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
      >
        <HeartOff size={15} className="text-[#fa2d48] flex-shrink-0" />
        <span className="truncate">Xóa khỏi Bài hát đã thích</span>
      </button>
    ),
    [toggleFavoriteSong]
  );

  // Xử lý phát tất cả bài hát từ đầu
  const handlePlayAll = async () => {
    if (favoriteSongs.length === 0) return;

    if (isCurrentPlaylistPlaying) {
      setIsPlaying(false);
      return;
    }

    const firstItem = favoriteSongs[0];
    handlePlaySong(firstItem, 0);
  };

  return (
    <div className="flex flex-col min-h-full -mx-4 sm:-mx-6 -mt-16 sm:-mt-20">
      {/* ── 1. HEADER BANNER GRADIENT TÍM ĐẶC TRƯNG ────────────────────── */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 px-4 sm:px-8 pt-16 sm:pt-24 pb-6 sm:pb-8 bg-gradient-to-b from-[#491b70] via-[#241038] to-[#121212] select-none">
        {/* Cover Art vuông lớn với Trái Tim trắng */}
        <div className="flex-shrink-0 w-36 h-36 sm:w-52 sm:h-52 rounded-lg bg-gradient-to-br from-[#450af5] via-[#6136f6] to-[#8e8ee5] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
          <Heart
            size={56}
            className="sm:w-16 sm:h-16 text-white fill-white drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Thông tin Playlist */}
        <div className="flex flex-col gap-1.5 sm:gap-2 min-w-0 flex-1 text-center sm:text-left">
          <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
            Playlist
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tight leading-none py-1 line-clamp-2 sm:truncate">
            Bài hát đã thích
          </h1>

          {/* User metadata row */}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs sm:text-sm text-white/90 font-medium mt-1 sm:mt-2 flex-wrap">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0 border border-white/20">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-[10px] sm:text-xs font-bold text-white">
                  {(user?.fullName || user?.username || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <span className="font-bold text-white hover:underline cursor-pointer">
              {user?.fullName || user?.username || "Người dùng"}
            </span>
            <span>•</span>
            <span>{favoriteSongs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* ── 2. ACTION CONTROLS BAR ────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-5 bg-[#121212] flex-wrap gap-3 sm:gap-4">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Nút Play chính (Màu Primary đỏ) */}
          <button
            onClick={handlePlayAll}
            disabled={favoriteSongs.length === 0}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#fa2d48] hover:bg-[#ff4b63] hover:scale-105 active:scale-95 flex items-center justify-center shadow-[0_8px_24px_rgba(250,45,72,0.4)] transition-all text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Phát danh sách bài hát đã thích"
          >
            {isCurrentPlaylistPlaying ? (
              <Pause size={22} fill="white" className="text-white" />
            ) : (
              <Play size={22} fill="white" className="text-white ml-0.5" />
            )}
          </button>

          {/* Nút Trộn bài (Shuffle) */}
          <button
            onClick={toggleShuffle}
            className={`transition-colors cursor-pointer p-1.5 ${
              isShuffle ? "text-[#fa2d48]" : "text-spotify-sub hover:text-white"
            }`}
            title={isShuffle ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên"}
          >
            <Shuffle size={22} />
          </button>
        </div>

        {/* Cụm Tìm kiếm & Sắp xếp bên phải */}
        <div className="flex items-center gap-2 sm:gap-3 text-spotify-sub ml-auto">
          {/* Ô Tìm kiếm */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="relative flex items-center bg-[#242424] rounded-full px-3 py-1.5 border border-white/10 w-36 sm:w-60 transition-all duration-200">
                <Search size={15} className="text-spotify-sub flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onBlur={() => !searchQuery && setIsSearchOpen(false)}
                  className="bg-transparent border-none outline-none text-white text-xs ml-2 w-full placeholder-spotify-sub"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-white/10 hover:text-white transition-colors cursor-pointer text-spotify-sub"
                title="Tìm kiếm trong danh sách"
              >
                <Search size={18} />
              </button>
            )}
          </div>

          {/* Dropdown Sắp xếp */}
          <div ref={sortDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="w-36 sm:w-44 flex items-center justify-between gap-1.5 text-xs sm:text-sm hover:text-white transition-colors cursor-pointer py-1.5 px-2.5 sm:px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 flex-shrink-0 select-none"
              title="Sắp xếp danh sách"
            >
              <span className="truncate font-medium text-neutral-300 text-left">
                {SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Mới thêm gần đây"}
              </span>
              <List size={16} className="text-neutral-400 flex-shrink-0 ml-1" />
            </button>

            {/* Menu Dropdown Popup */}
            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-48 sm:w-52 rounded-xl bg-[#282828] border border-neutral-700/80 shadow-[0_12px_32px_rgba(0,0,0,0.8)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-neutral-400 tracking-wider">
                  Sắp xếp theo
                </div>
                {SORT_OPTIONS.map((opt) => {
                  const isSelected = sortBy === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSortBy(opt.id);
                        setIsSortOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold transition-colors cursor-pointer text-left ${
                        isSelected
                          ? "text-[#fa2d48] bg-white/5"
                          : "text-neutral-300 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <Check size={14} className="text-[#fa2d48] flex-shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 3. BỘ LỌC CHIP PILLS THEO THIẾT KẾ THAM KHẢO ──────────────── */}
      <div className="px-4 sm:px-8 pb-3 sm:pb-4 bg-[#121212]">
        <FilterChipsBar
          items={genreFilterItems}
          selectedKey={selectedGenreKey}
          onSelect={setSelectedGenreKey}
          allLabel="Tất cả"
          toggleable
          activeVariant="primary"
        />
      </div>

      {/* ── 4. DANH SÁCH BÀI HÁT DẠNG BẢNG (TRACKS TABLE) ──────────────── */}
      <div className="flex-1 px-3 sm:px-8 pb-12 bg-[#121212]">
        <TrackTable
          songs={filteredSongs}
          isLoading={isLoadingSongs}
          currentSongId={currentSong?.id}
          loadingSongId={loadingSongId}
          favoriteSongIds={favoriteSongIds}
          showAlbumColumn
          showDuration
          onPlaySong={handlePlaySong}
          onToggleFavorite={toggleFavoriteSong}
          renderExtraMenuActions={renderExtraMenuActions}
          emptyComponent={
            <EmptyState
              icon={<Music2 size={32} />}
              title={
                searchQuery
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : selectedGenreKey
                    ? "Không có bài hát yêu thích nào thuộc thể loại này"
                    : "Những bài hát bạn yêu thích sẽ xuất hiện ở đây"
              }
              description={
                selectedGenreKey
                  ? "Hãy thử chọn thể loại khác hoặc bấm để xem lại toàn bộ bài hát đã thích."
                  : "Lưu các bài hát bạn yêu thích bằng cách nhấn vào biểu tượng trái tim trên thanh phát nhạc hoặc danh sách bài hát."
              }
              actionLabel={selectedGenreKey ? "Xem tất cả thể loại" : "Khám phá bài hát"}
              actionVariant={selectedGenreKey ? "glass" : "white"}
              onAction={() =>
                selectedGenreKey ? setSelectedGenreKey(null) : navigate("/")
              }
              className="py-20"
            />
          }
        />
      </div>
    </div>
  );
};
