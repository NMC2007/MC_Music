import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Library,
  Plus,
  List,
  Pin,
  Heart,
  Play,
  ChevronLeft,
  ChevronRight,
  ListMusic,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { useAuthStore } from "../store/useAuthStore";
import { useFavorites } from "../hooks/useFavorites";
import { useFollowArtists } from "../hooks/useFollowArtists";
import { usePlaylists } from "../hooks/usePlaylists";
import { usePlayerStore } from "../store/usePlayerStore";
import { getArtistSongs, getAlbumSongs, getSongById } from "../api/catalog/public";
import { getPlaylistSongsApi } from "../api/users/playlists";
import { CreatePlaylistModal } from "../components/playlist/CreatePlaylistModal";
import { showLoginToast } from "../utils/toastUtils";

// Danh mục bộ lọc theo đúng thiết kế tham khảo
const FILTERS = ["Playlist", "EP", "Album", "Nghệ sĩ"];

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { favoriteSongs, favoriteAlbums } = useFavorites();
  const { followedArtists } = useFollowArtists();
  const { playlists } = usePlaylists();
  const { playSongWithContext } = usePlayerStore();

  const isLikedActive = location.pathname === "/collection/tracks";

  const [width, setWidth] = useState(320); // Mặc định w-80 = 320px
  const [isResizing, setIsResizing] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleProtectedAction = (actionName) => {
    if (!isAuthenticated) {
      showLoginToast(actionName);
      return false;
    }
    return true;
  };

  // --- Resizing Sidebar Logic ---
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      let newWidth = e.clientX - 8;
      if (newWidth < 280) newWidth = 280;
      if (newWidth > 420) newWidth = 420;
      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // --- Scroll Logic cho Filter Pills ---
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  useEffect(() => {
    handleScroll();
  }, [width]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -150 : 150;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  // --- Phát bài hát yêu thích ---
  const handlePlayLikedSongs = async (e) => {
    e.stopPropagation();
    if (favoriteSongs.length === 0) {
      navigate("/collection/tracks");
      return;
    }
    try {
      const firstSongId = favoriteSongs[0].songId;
      const res = await getSongById(firstSongId);
      const fullSong = res?.data;
      if (fullSong) {
        const pool = favoriteSongs.map((f) =>
          f.songId === fullSong.id
            ? fullSong
            : { id: f.songId, title: f.songTitle, artist: f.artistName, coverImage: f.coverImage }
        );
        playSongWithContext(fullSong, pool, 0);
      }
    } catch (err) {
      console.error("Lỗi phát bài hát yêu thích từ Sidebar:", err);
    }
  };

  // --- Phát nhạc nghệ sĩ ---
  const handlePlayArtist = async (e, artistId) => {
    e.stopPropagation();
    try {
      const res = await getArtistSongs(artistId, { size: 50, sort: "likeCount,desc" });
      const songs = res?.data?.content || [];
      if (songs.length > 0) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        playSongWithContext(songs[randomIndex], songs, randomIndex);
      }
    } catch (err) {
      console.error("Lỗi phát nhạc nghệ sĩ từ Sidebar:", err);
    }
  };

  // --- Phát album ---
  const handlePlayAlbum = async (e, albumId) => {
    e.stopPropagation();
    try {
      const res = await getAlbumSongs(albumId, { size: 50, sort: "createdAt,asc" });
      const songs = res?.data?.content || [];
      if (songs.length > 0) {
        playSongWithContext(songs[0], songs, 0);
      }
    } catch (err) {
      console.error("Lỗi phát album từ Sidebar:", err);
    }
  };

  // --- Phát danh sách phát (Playlist) ---
  const handlePlayPlaylist = async (e, playlistId) => {
    e.stopPropagation();
    try {
      const res = await getPlaylistSongsApi(playlistId, { size: 50 });
      const songs = res?.data?.content || [];
      if (songs.length > 0) {
        const pool = songs.map((s) => ({
          id: s.songId,
          title: s.songTitle,
          artist: s.artistName,
          artistName: s.artistName,
          coverImage: s.coverImage,
        }));
        const firstSongRes = await getSongById(songs[0].songId);
        if (firstSongRes?.data) {
          playSongWithContext(firstSongRes.data, pool, 0);
        } else {
          navigate(`/playlist/${playlistId}`);
        }
      } else {
        navigate(`/playlist/${playlistId}`);
      }
    } catch (err) {
      console.error("Lỗi phát playlist từ Sidebar:", err);
      navigate(`/playlist/${playlistId}`);
    }
  };

  // --- Tổng hợp và lọc danh sách Nghệ sĩ, Album & Playlist ---
  const libraryItems = useMemo(() => {
    let items = [];

    // 1. Thêm danh sách Nghệ sĩ đã theo dõi
    followedArtists.forEach((artist) => {
      items.push({
        id: artist.artistId || artist.id,
        title: artist.artistName || artist.stageName,
        subtitle: "Nghệ sĩ",
        image: artist.avatar || artist.avatarUrl,
        type: "artist",
        raw: artist,
      });
    });

    // 2. Thêm danh sách Album yêu thích
    favoriteAlbums.forEach((album) => {
      const albumTitle = album.albumTitle || album.title || "Album";
      const isEp =
        album.albumType?.toUpperCase() === "EP" ||
        albumTitle.toLowerCase().includes("ep");
      const displayType = isEp ? "EP" : "Album";

      items.push({
        id: album.albumId || album.id,
        title: albumTitle,
        subtitle: `${displayType} • ${album.artistName || album.ownerName || "Nghệ sĩ"}`,
        image: album.coverImage || album.coverUrl,
        type: "album",
        albumType: displayType,
        raw: {
          ...album,
          id: album.albumId || album.id,
          title: albumTitle,
          albumType: displayType,
        },
      });
    });

    // 3. Thêm danh sách Playlist của người dùng
    playlists.forEach((playlist) => {
      items.push({
        id: playlist.id,
        title: playlist.name,
        subtitle: `Danh sách phát • ${playlist.isPublic ? "Công khai" : "Riêng tư"}`,
        image: playlist.coverImage || null,
        type: "playlist",
        raw: playlist,
      });
    });

    // 4. Áp dụng bộ lọc danh mục
    if (selectedFilter) {
      if (selectedFilter === "Album") {
        items = items.filter((item) => item.type === "album" && item.albumType !== "EP");
      } else if (selectedFilter === "EP") {
        items = items.filter((item) => item.type === "album" && item.albumType === "EP");
      } else if (selectedFilter === "Nghệ sĩ") {
        items = items.filter((item) => item.type === "artist");
      } else if (selectedFilter === "Playlist") {
        items = items.filter((item) => item.type === "playlist");
      }
    }

    // 5. Áp dụng tìm kiếm theo từ khóa
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter(
        (item) =>
          item.title?.toLowerCase().includes(q) ||
          item.subtitle?.toLowerCase().includes(q)
      );
    }

    return items;
  }, [followedArtists, favoriteAlbums, playlists, selectedFilter, searchQuery]);

  // Kiểm tra hiển thị mục "Bài hát đã thích"
  const shouldShowLikedSongs =
    (!selectedFilter || selectedFilter === "Playlist") &&
    (!searchQuery.trim() ||
      "bài hát đã thích".includes(searchQuery.toLowerCase().trim()));

  return (
    <aside
      className="flex-shrink-0 flex flex-col gap-2 h-full z-10 relative group"
      style={{ width: `${width}px` }}
    >
      {/* Library */}
      <div className="bg-spotify-base rounded-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 text-spotify-sub font-bold">
          <div className="flex items-center gap-2 flex-1 min-w-0 hover:text-white transition cursor-pointer">
            <Library size={24} className="flex-shrink-0" />
            <span className="text-base truncate">Thư viện</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Button
              variant="dark"
              size="sm"
              tooltip="Tạo danh sách phát mới"
              tooltipPosition="bottom-right"
              onClick={() => {
                if (handleProtectedAction("tạo danh sách phát mới")) {
                  setIsCreateModalOpen(true);
                }
              }}
            >
              <Plus size={16} />
              Tạo
            </Button>
          </div>
        </div>

        {/* Filters */}
        {isAuthenticated && (
          <div className="relative group/filter flex-shrink-0">
            {showLeft && (
              <>
                <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-spotify-base from-30% to-transparent z-[5] pointer-events-none" />
                <Button
                  variant="glass"
                  size="sm"
                  iconOnly
                  onClick={() => scroll("left")}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronLeft size={20} />
                </Button>
              </>
            )}

            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex items-center gap-2 px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {FILTERS.map((filter) => {
                const isSelected = selectedFilter === filter;
                return (
                  <button
                    key={filter}
                    onClick={() =>
                      setSelectedFilter(isSelected ? null : filter)
                    }
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer flex-shrink-0 border ${
                      isSelected
                        ? "bg-white text-black border-white font-bold shadow-sm"
                        : "bg-[#232323] hover:bg-[#2a2a2a] text-white border-transparent"
                    }`}
                  >
                    {filter}
                  </button>
                );
              })}
            </div>

            {showRight && (
              <>
                <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-spotify-base from-30% to-transparent z-[5] pointer-events-none" />
                <Button
                  variant="glass"
                  size="sm"
                  iconOnly
                  onClick={() => scroll("right")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
                >
                  <ChevronRight size={20} />
                </Button>
              </>
            )}
          </div>
        )}

        {/* Sub-header (Search & Sort) */}
        {isAuthenticated && (
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 mt-1 h-10">
            {isSearchExpanded ? (
              <div className="relative flex items-center bg-[#2a2a2a] rounded-md h-8 px-2 flex-1 mr-2">
                <Search size={16} className="text-spotify-sub flex-shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Tìm kiếm trong Thư viện"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-white text-sm ml-2 w-full placeholder-spotify-sub"
                  onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                />
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                iconOnly
                onClick={() => setIsSearchExpanded(true)}
                tooltip="Tìm kiếm trong thư viện"
                tooltipPosition="bottom-left"
              >
                <Search size={18} />
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              className="px-2 hover:bg-transparent hover:scale-105 flex-shrink-0"
              tooltip="Sắp xếp"
              tooltipPosition="bottom-right"
            >
              {!isSearchExpanded && <span>Gần đây</span>}
              <List size={18} />
            </Button>
          </div>
        )}

        {/* List Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {isAuthenticated ? (
            <div className="flex flex-col gap-1">
              {/* 1. Mục cố định ghim mặc định trên đầu: Bài hát đã thích */}
              {shouldShowLikedSongs && (
                <div
                  onClick={() => navigate("/collection/tracks")}
                  className={`flex items-center gap-3 p-2 rounded-md cursor-pointer group transition-all duration-200 select-none ${
                    isLikedActive ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
                  }`}
                >
                  {/* Thumbnail vuông gradient xanh tím với trái tim trắng */}
                  <div
                    className="relative group/cover flex-shrink-0"
                    onClick={handlePlayLikedSongs}
                  >
                    <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-[#450af5] via-[#6136f6] to-[#8e8ee5] shadow-md group-hover:scale-105 transition-transform">
                      <Heart size={20} className="text-white fill-white" />
                    </div>

                    {/* Lớp phủ nút Play khi hover vào ảnh */}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity rounded-md">
                      <Play
                        size={18}
                        fill="white"
                        className="text-white ml-0.5 drop-shadow-md"
                      />
                    </div>

                    {/* Tippy Tooltip khi hover vào ảnh */}
                    <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#282828] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 delay-0 group-hover/cover:opacity-100 group-hover/cover:delay-[1500ms] transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.85)] border border-white/10">
                      Phát Bài hát đã thích
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="flex flex-col flex-1 min-w-0 justify-center">
                    <span
                      className={`text-sm font-semibold truncate transition-colors ${
                        isLikedActive
                          ? "text-[#fa2d48]"
                          : "text-white group-hover:text-white"
                      }`}
                    >
                      Bài hát đã thích
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-spotify-sub mt-0.5 overflow-hidden">
                      <Pin
                        size={12}
                        className="text-[#fa2d48] fill-[#fa2d48] flex-shrink-0 rotate-45"
                      />
                      <span className="truncate">
                        Danh sách phát • {favoriteSongs.length} bài hát
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Danh sách toàn bộ các Nghệ sĩ, Album & Playlist bên dưới */}
              {libraryItems.map((item) => {
                const isArtist = item.type === "artist";
                const isAlbum = item.type === "album";
                const isPlaylist = item.type === "playlist";
                const itemPath = isArtist
                  ? `/artist/${item.id}`
                  : isAlbum
                  ? `/album/${item.id}`
                  : `/playlist/${item.id}`;
                const isActive = location.pathname === itemPath;

                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    onClick={() => {
                      if (isArtist) {
                        navigate(itemPath);
                      } else if (isAlbum) {
                        navigate(itemPath, { state: { album: item.raw } });
                      } else if (isPlaylist) {
                        navigate(itemPath, { state: { playlist: item.raw } });
                      }
                    }}
                    className={`flex items-center gap-3 p-2 rounded-md cursor-pointer group transition-all duration-200 select-none ${
                      isActive ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
                    }`}
                  >
                    {/* Ảnh đại diện: Nghệ sĩ hình TRÒN, Album & Playlist hình VUÔNG */}
                    <div
                      className="relative group/cover flex-shrink-0"
                      onClick={(e) => {
                        if (isArtist) {
                          handlePlayArtist(e, item.id);
                        } else if (isAlbum) {
                          handlePlayAlbum(e, item.id);
                        } else if (isPlaylist) {
                          handlePlayPlaylist(e, item.id);
                        }
                      }}
                    >
                      <div
                        className={`w-12 h-12 overflow-hidden flex items-center justify-center bg-neutral-800 shadow-md ${
                          isArtist ? "rounded-full" : "rounded-md"
                        }`}
                      >
                        <CoverImage
                          src={item.image}
                          alt={item.title}
                          isArtist={isArtist}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Nút Play hiển thị đè lên ảnh khi hover */}
                      <div
                        className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/cover:opacity-100 transition-opacity duration-200 ${
                          isArtist ? "rounded-full" : "rounded-md"
                        }`}
                      >
                        <Play
                          size={18}
                          fill="white"
                          className="text-white ml-0.5 drop-shadow-md"
                        />
                      </div>

                      {/* Tippy / Tooltip hiển thị: "Phát [tên nghệ sĩ/album/playlist]" khi hover vào ảnh */}
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-[#282828] text-white text-xs font-semibold px-2.5 py-1.5 rounded-md opacity-0 delay-0 group-hover/cover:opacity-100 group-hover/cover:delay-[1500ms] transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap shadow-[0_8px_24px_rgba(0,0,0,0.85)] border border-white/10">
                        Phát {item.title || (isAlbum ? (item.raw?.albumTitle || "Album") : "Danh sách phát")}
                      </div>
                    </div>

                    {/* Thông tin Text */}
                    <div className="flex flex-col flex-1 min-w-0 justify-center">
                      <span
                        className={`text-sm font-medium truncate transition-colors ${
                          isActive
                            ? "text-[#fa2d48] font-bold"
                            : "text-white group-hover:text-white"
                        }`}
                      >
                        {item.title}
                      </span>
                      <span className="text-xs text-spotify-sub truncate mt-0.5">
                        {item.subtitle}
                      </span>
                    </div>
                  </div>
                );
              })}

              {/* Trạng thái trống khi chưa có nghệ sĩ/album nào và không hiện bài hát đã thích */}
              {libraryItems.length === 0 && !shouldShowLikedSongs && (
                <div className="py-8 text-center text-spotify-sub text-xs">
                  Không tìm thấy mục nào phù hợp trong thư viện.
                </div>
              )}
            </div>
          ) : (
            // Trạng thái khi chưa đăng nhập
            <div className="bg-[#242424] rounded-lg p-5 mt-2 flex flex-col gap-4 text-white">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-base">
                  Tạo danh sách phát đầu tiên của bạn
                </span>
                <span className="text-sm font-medium">
                  Rất dễ! Chúng tôi sẽ giúp bạn
                </span>
              </div>
              <div className="mt-1">
                <Button
                  variant="white"
                  size="sm"
                  className="font-bold text-black rounded-full px-4 w-max"
                  onClick={() => {
                    if (handleProtectedAction("tạo danh sách phát mới")) {
                      setIsCreateModalOpen(true);
                    }
                  }}
                >
                  Tạo danh sách phát
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tạo Playlist */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {/* Resizer Handle */}
      <div
        className="absolute top-0 -right-2 w-4 h-full cursor-col-resize z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div
          className={`h-full w-[2px] transition-colors ${
            isResizing ? "bg-white/60" : "hover:bg-white/30"
          }`}
        ></div>
      </div>
    </aside>
  );
};
