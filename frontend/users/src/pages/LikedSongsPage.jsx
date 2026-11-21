import React, { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  Heart,
  HeartOff,
  Clock,
  Search,
  List,
  Check,
  Music2,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { useFavorites } from "../hooks/useFavorites";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { getSongById, getPublicGenres } from "../api/catalog/public";
import { CoverImage } from "../components/ui/CoverImage";
import { Button } from "../components/ui/Button";
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";

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
    isLoadingSongs,
    toggleFavoriteSong,
  } = useFavorites();

  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    playSongWithContext,
    isShuffle,
    toggleShuffle,
  } = usePlayerStore();

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

      if (matched) {
        return {
          id: matched.id,
          name: popular.name,
        };
      }
      return {
        id: popular.id,
        name: popular.name,
      };
    });
  }, [genresData]);

  // State bộ lọc thể loại (null = Tất cả)
  const [selectedGenre, setSelectedGenre] = useState(null);

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

  // --- Ray trượt ngang cho dải bộ lọc Chip Pills ---
  const chipsScrollRef = useRef(null);
  const [showChipsLeft, setShowChipsLeft] = useState(false);
  const [showChipsRight, setShowChipsRight] = useState(false);

  const handleChipsScroll = () => {
    if (!chipsScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = chipsScrollRef.current;
    setShowChipsLeft(scrollLeft > 4);
    setShowChipsRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 4);
  };

  useEffect(() => {
    handleChipsScroll();

    const observer = new ResizeObserver(() => {
      handleChipsScroll();
    });

    if (chipsScrollRef.current) {
      observer.observe(chipsScrollRef.current);
    }

    window.addEventListener("resize", handleChipsScroll);
    return () => {
      window.removeEventListener("resize", handleChipsScroll);
      observer.disconnect();
    };
  }, []);

  const scrollChips = (direction) => {
    if (!chipsScrollRef.current) return;
    const scrollAmount = direction === direction ? (direction === "left" ? -240 : 240) : 240;
    chipsScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

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
    if (selectedGenre) {
      const target = selectedGenre.toLowerCase();
      result = result.filter((s) => {
        if (!s.genres || s.genres.length === 0) return false;
        return s.genres.some((g) => {
          const gId = (g.id || "").toLowerCase();
          const gName = (g.name || "").toLowerCase();
          const cleanGName = gName.replace(/[^a-z0-9]/g, "");
          const cleanTarget = target.replace(/[^a-z0-9]/g, "");

          if (gId === target || cleanGName === cleanTarget) return true;
          // Alias Rap & Hip-Hop (khớp bài hát gắn thẻ Rap hoặc Hip-Hop)
          if (
            (cleanTarget.includes("rap") || cleanTarget.includes("hiphop")) &&
            (cleanGName.includes("rap") || cleanGName.includes("hiphop"))
          ) {
            return true;
          }
          // Alias Lofi & Lo-Fi
          if (cleanTarget.includes("lofi") && cleanGName.includes("lofi")) {
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
  }, [favoriteSongs, searchQuery, selectedGenre, sortBy]);

  // Format ngày thêm (Ví dụ: "4 thg 7, 2026")
  const formatDateAdded = (dateStr) => {
    if (!dateStr) return "Gần đây";
    try {
      const d = new Date(dateStr);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day} thg ${month}, ${year}`;
    } catch {
      return "Gần đây";
    }
  };

  // Format thời lượng hiển thị giả định hoặc từ giây
  const formatDuration = (seconds) => {
    if (!seconds) return "3:15";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Kiểm tra bài hát đang phát có nằm trong danh sách bài hát đã thích không
  const isCurrentPlaylistPlaying =
    isPlaying &&
    currentSong &&
    favoriteSongs.some((s) => s.songId === currentSong.id);

  // Xử lý phát 1 bài hát cụ thể khi bấm vào dòng
  const handlePlaySong = async (favItem, index) => {
    try {
      setLoadingSongId(favItem.songId);
      const res = await getSongById(favItem.songId);
      const fullSong = res?.data;

      if (fullSong) {
        // Tạo pool từ danh sách đã thích
        const pool = favoriteSongs.map((f) =>
          f.songId === fullSong.id ? fullSong : { id: f.songId, title: f.songTitle, artist: f.artistName, coverImage: f.coverImage }
        );
        playSongWithContext(fullSong, pool, index);
      }
    } catch (err) {
      console.error("Lỗi khi phát bài hát yêu thích:", err);
    } finally {
      setLoadingSongId(null);
    }
  };

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
    <div className="flex flex-col min-h-full -mx-6 -mt-20">
      {/* ── 1. HEADER BANNER GRADIENT TÍM ĐẶC TRƯNG ────────────────────── */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-8 pt-24 pb-8 bg-gradient-to-b from-[#491b70] via-[#241038] to-[#121212] select-none">
        {/* Cover Art vuông lớn với Trái Tim trắng */}
        <div className="flex-shrink-0 w-44 h-44 sm:w-56 sm:h-56 rounded-lg bg-gradient-to-br from-[#450af5] via-[#6136f6] to-[#8e8ee5] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.6)] group">
          <Heart
            size={76}
            className="text-white fill-white drop-shadow-md group-hover:scale-110 transition-transform duration-300"
          />
        </div>

        {/* Thông tin Playlist */}
        <div className="flex flex-col gap-2 min-w-0 flex-1 text-center sm:text-left">
          <span className="text-xs font-bold text-white/90 uppercase tracking-widest">
            Playlist
          </span>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-none py-1 truncate">
            Bài hát đã thích
          </h1>

          {/* User metadata row */}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-white/90 font-medium mt-2 flex-wrap">
            <div className="w-6 h-6 rounded-full overflow-hidden bg-neutral-700 flex items-center justify-center flex-shrink-0 border border-white/20">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || "User"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs font-bold text-white">
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
      <div className="flex items-center justify-between px-8 py-5 bg-[#121212] flex-wrap gap-4">
        <div className="flex items-center gap-6">
          {/* Nút Play chính (Màu Primary đỏ) */}
          <button
            onClick={handlePlayAll}
            disabled={favoriteSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#fa2d48] hover:bg-[#ff4b63] hover:scale-105 active:scale-95 flex items-center justify-center shadow-[0_8px_24px_rgba(250,45,72,0.4)] transition-all text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            title="Phát danh sách bài hát đã thích"
          >
            {isCurrentPlaylistPlaying ? (
              <Pause size={26} fill="white" className="text-white" />
            ) : (
              <Play size={26} fill="white" className="text-white ml-1" />
            )}
          </button>

          {/* Nút Trộn bài (Shuffle) */}
          <button
            onClick={toggleShuffle}
            className={`transition-colors cursor-pointer ${
              isShuffle ? "text-[#fa2d48]" : "text-spotify-sub hover:text-white"
            }`}
            title={isShuffle ? "Tắt phát ngẫu nhiên" : "Bật phát ngẫu nhiên"}
          >
            <Shuffle size={24} />
          </button>
        </div>

        {/* Cụm Tìm kiếm & Sắp xếp bên phải */}
        <div className="flex items-center gap-3 text-spotify-sub ml-auto">
          {/* Ô Tìm kiếm */}
          <div className="relative flex items-center">
            {isSearchOpen ? (
              <div className="relative flex items-center bg-[#242424] rounded-full px-3 py-1.5 border border-white/10 w-44 sm:w-60 transition-all duration-200">
                <Search size={16} className="text-spotify-sub flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm trong danh sách..."
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
                <Search size={19} />
              </button>
            )}
          </div>

          {/* Dropdown Sắp xếp: Kích thước cố định w-44 tránh thanh tìm kiếm bị thụt thò khi đổi chữ */}
          <div ref={sortDropdownRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsSortOpen((prev) => !prev)}
              className="w-44 flex items-center justify-between gap-2 text-sm hover:text-white transition-colors cursor-pointer py-1.5 px-3 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 flex-shrink-0 select-none"
              title="Sắp xếp danh sách"
            >
              <span className="truncate font-medium text-neutral-300 text-left">
                {SORT_OPTIONS.find((opt) => opt.id === sortBy)?.label || "Mới thêm gần đây"}
              </span>
              <List size={18} className="text-neutral-400 flex-shrink-0 ml-1" />
            </button>

            {/* Menu Dropdown Popup */}
            {isSortOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#282828] border border-neutral-700/80 shadow-[0_12px_32px_rgba(0,0,0,0.8)] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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

      {/* ── 3. BỘ LỌC CHIP PILLS THEO THIẾT KẾ THAM KHẢO (RAY TRƯỢT NGANG GIỐNG TRANG CHỦ) ──── */}
      <div className="px-8 pb-4 bg-[#121212]">
        <div className="relative group/chips">
          {/* Fade trái và Nút Prev */}
          {showChipsLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#121212] via-[#121212]/90 to-transparent z-[5] pointer-events-none rounded-l-full" />
              <Button
                variant="glass"
                size="sm"
                iconOnly
                onClick={() => scrollChips("left")}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-90 group-hover/chips:opacity-100 hover:scale-110 active:scale-95 transition-all"
                title="Cuộn sang trái"
              >
                <ChevronLeft size={18} />
              </Button>
            </>
          )}

          {/* Dải cuộn Chips - Thể loại nhạc */}
          <div
            ref={chipsScrollRef}
            onScroll={handleChipsScroll}
            className="flex items-center gap-2 overflow-x-auto py-1 px-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {/* Nút Tất cả */}
            <button
              type="button"
              onClick={() => setSelectedGenre(null)}
              className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer flex-shrink-0 border select-none ${
                selectedGenre === null
                  ? "bg-[#fa2d48] text-white border-[#fa2d48] font-bold shadow-[0_2px_10px_rgba(250,45,72,0.3)]"
                  : "bg-[#242424]/90 hover:bg-[#323232] text-white border-transparent hover:border-white/10"
              }`}
            >
              Tất cả
            </button>

            {genres.map((genre) => {
              const genreKey = genre.id || genre.name;
              const isSelected = selectedGenre === genreKey;
              return (
                <button
                  key={genreKey}
                  type="button"
                  onClick={() => setSelectedGenre(isSelected ? null : genreKey)}
                  className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer flex-shrink-0 border select-none ${
                    isSelected
                      ? "bg-[#fa2d48] text-white border-[#fa2d48] font-bold shadow-[0_2px_10px_rgba(250,45,72,0.3)]"
                      : "bg-[#242424]/90 hover:bg-[#323232] text-white border-transparent hover:border-white/10"
                  }`}
                >
                  {genre.name}
                </button>
              );
            })}
          </div>

          {/* Fade phải và Nút Next */}
          {showChipsRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#121212] via-[#121212]/90 to-transparent z-[5] pointer-events-none rounded-r-full" />
              <Button
                variant="glass"
                size="sm"
                iconOnly
                onClick={() => scrollChips("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 shadow-lg opacity-90 group-hover/chips:opacity-100 hover:scale-110 active:scale-95 transition-all"
                title="Cuộn sang phải"
              >
                <ChevronRight size={18} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── 4. DANH SÁCH BÀI HÁT DẠNG BẢNG (TRACKS TABLE) ──────────────── */}
      <div className="flex-1 px-8 pb-12 bg-[#121212]">
        {/* Table Header */}
        <div className="grid grid-cols-[16px_1fr_120px] md:grid-cols-[16px_4fr_3fr_120px] lg:grid-cols-[16px_6fr_4fr_3fr_120px] gap-4 px-4 py-2.5 text-xs font-bold text-spotify-sub border-b border-neutral-800/80 uppercase tracking-wider items-center select-none">
          <span className="text-center">#</span>
          <span>Tiêu đề</span>
          <span className="hidden md:block">Album</span>
          <span className="hidden lg:block">Ngày thêm</span>
          <div className="flex items-center justify-end pr-2">
            <Clock size={16} />
          </div>
        </div>

        {/* Table Body */}
        <div className="flex flex-col mt-2">
          {isLoadingSongs ? (
            // Skeleton Loading Rows
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[16px_1fr_120px] md:grid-cols-[16px_4fr_3fr_120px] lg:grid-cols-[16px_6fr_4fr_3fr_120px] gap-4 px-4 py-2.5 items-center animate-pulse"
              >
                <div className="w-4 h-4 bg-neutral-800 rounded" />
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-neutral-800 rounded-md" />
                  <div className="flex flex-col gap-1.5 flex-1">
                    <div className="w-36 h-3.5 bg-neutral-800 rounded" />
                    <div className="w-24 h-3 bg-neutral-800 rounded" />
                  </div>
                </div>
                <div className="hidden md:block w-28 h-3.5 bg-neutral-800 rounded" />
                <div className="hidden lg:block w-20 h-3.5 bg-neutral-800 rounded" />
                <div className="w-10 h-3.5 bg-neutral-800 rounded ml-auto" />
              </div>
            ))
          ) : filteredSongs.length > 0 ? (
            filteredSongs.map((song, idx) => {
              const isSongActive = currentSong?.id === song.songId;
              const isSongLoadingThis = loadingSongId === song.songId;

              return (
                <div
                  key={song.songId}
                  onClick={() => handlePlaySong(song, idx)}
                  className={`grid grid-cols-[16px_1fr_120px] md:grid-cols-[16px_4fr_3fr_120px] lg:grid-cols-[16px_6fr_4fr_3fr_120px] gap-4 px-4 py-2.5 rounded-md hover:bg-white/10 group cursor-pointer transition-colors items-center ${
                    isSongActive ? "bg-white/5" : ""
                  }`}
                >
                  {/* Cột 1: STT / Play Button / Loading */}
                  <div className="text-center flex items-center justify-center">
                    {isSongLoadingThis ? (
                      <Loader2
                        size={16}
                        className="animate-spin text-[#fa2d48]"
                      />
                    ) : (
                      <>
                        <span
                          className={`text-sm group-hover:hidden ${
                            isSongActive
                              ? "text-[#fa2d48] font-bold"
                              : "text-spotify-sub"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <Play
                          size={16}
                          fill="white"
                          className="text-white hidden group-hover:block"
                        />
                      </>
                    )}
                  </div>

                  {/* Cột 2: Thumbnail + Tên bài hát + Nghệ sĩ */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 relative border border-white/5 shadow-sm">
                      <CoverImage
                        src={song.coverImage}
                        alt={song.songTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span
                        className={`text-sm font-medium truncate transition-colors ${
                          isSongActive
                            ? "text-[#fa2d48] font-bold"
                            : "text-white group-hover:text-white"
                        }`}
                      >
                        {song.songTitle}
                      </span>
                      <span className="text-xs text-spotify-sub truncate hover:underline hover:text-white mt-0.5">
                        {song.artistName || "Nghệ sĩ"}
                      </span>
                    </div>
                  </div>

                  {/* Cột 3: Album (Ẩn trên mobile) */}
                  <div className="hidden md:block min-w-0">
                    <span className="text-sm text-spotify-sub truncate hover:underline hover:text-white block">
                      {song.songTitle}
                    </span>
                  </div>

                  {/* Cột 4: Ngày thêm (Ẩn trên tablet/mobile) */}
                  <div className="hidden lg:block min-w-0">
                    <span className="text-sm text-spotify-sub truncate">
                      {formatDateAdded(song.createdAt)}
                    </span>
                  </div>

                  {/* Cột 5: Thời lượng + Menu ... chứa lựa chọn Bỏ khỏi yêu thích */}
                  <div className="flex items-center justify-end gap-3 text-spotify-sub relative">
                    <span className="text-xs text-spotify-sub w-10 text-right">
                      {formatDuration(song.durationSeconds)}
                    </span>

                    {/* Nút ... More Menu (Thêm vào playlist / Bỏ khỏi yêu thích) */}
                    <div className="relative">
                      <AddToPlaylistMenu
                        song={song}
                        extraActions={
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteSong(song);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-neutral-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <HeartOff
                              size={15}
                              className="text-[#fa2d48] flex-shrink-0"
                            />
                            <span className="truncate">Xóa khỏi Bài hát đã thích</span>
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            // Trạng thái danh sách rỗng
            <div className="py-20 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-16 h-16 rounded-full bg-neutral-800/80 flex items-center justify-center text-spotify-sub mb-2">
                <Music2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-white">
                {searchQuery
                  ? `Không tìm thấy kết quả cho "${searchQuery}"`
                  : selectedGenre
                  ? "Không có bài hát yêu thích nào thuộc thể loại này"
                  : "Những bài hát bạn yêu thích sẽ xuất hiện ở đây"}
              </h3>
              <p className="text-sm text-spotify-sub max-w-md">
                {selectedGenre
                  ? "Hãy thử chọn thể loại khác hoặc bấm để xem lại toàn bộ bài hát đã thích."
                  : "Lưu các bài hát bạn yêu thích bằng cách nhấn vào biểu tượng trái tim trên thanh phát nhạc hoặc danh sách bài hát."}
              </p>
              {selectedGenre ? (
                <Button
                  variant="glass"
                  size="md"
                  className="mt-2 text-white font-bold rounded-full px-6"
                  onClick={() => setSelectedGenre(null)}
                >
                  Xem tất cả thể loại
                </Button>
              ) : (
                <Button
                  variant="white"
                  size="md"
                  className="mt-2 text-black font-bold rounded-full px-6"
                  onClick={() => navigate("/")}
                >
                  Khám phá bài hát
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
