import React, { useState, useEffect } from "react";
import {
  Search,
  Library,
  Plus,
  List,
  Pin,
  Heart,
  Play,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { FilterChipsBar } from "../components/ui/FilterChipsBar";
import { useAuthStore } from "../store/useAuthStore";
import { useLibrary } from "../hooks/useLibrary";
import { LIBRARY_FILTERS } from "../constants/navigation";
import { CreatePlaylistModal } from "../components/playlist/CreatePlaylistModal";
import { showLoginToast } from "../utils/toastUtils";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const {
    selectedFilter,
    setSelectedFilter,
    searchQuery,
    setSearchQuery,
    libraryItems,
    shouldShowLikedSongs,
    favoriteSongsCount,
    handlePlayLikedSongs,
    handlePlayArtist,
    handlePlayAlbum,
    handlePlayPlaylist,
  } = useLibrary();

  const isLikedActive = location.pathname === "/collection/tracks";

  const [width, setWidth] = useState(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      return 240;
    }
    return 300;
  }); // Tự động thích ứng tablet (240px) vs desktop (300px)
  const [isResizing, setIsResizing] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
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
      const minW = window.innerWidth < 1024 ? 200 : 240;
      const maxW = Math.min(420, Math.floor(window.innerWidth * 0.42));
      if (newWidth < minW) newWidth = minW;
      if (newWidth > maxW) newWidth = maxW;
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

  // Tự động điều chỉnh độ rộng Sidebar khi kích thước viewport thay đổi giữa tablet & desktop
  useEffect(() => {
    const handleViewportResize = () => {
      const windowW = window.innerWidth;
      if (windowW >= 768 && windowW < 1024) {
        setWidth((prev) => (prev > 260 ? 240 : prev));
      }
    };
    window.addEventListener("resize", handleViewportResize);
    return () => window.removeEventListener("resize", handleViewportResize);
  }, []);

  return (
    <aside
      className="hidden md:flex flex-shrink-0 flex-col gap-2 h-full z-10 relative group"
      style={{ width: `${width}px`, maxWidth: "38vw" }}
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
          <FilterChipsBar
            items={LIBRARY_FILTERS}
            selectedKey={selectedFilter}
            onSelect={setSelectedFilter}
            toggleable
            activeVariant="white"
            fadeColorClass="from-spotify-base"
            scrollContainerClassName="px-4 py-2"
            className="flex-shrink-0"
          />
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
                        Danh sách phát • {favoriteSongsCount} bài hát
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
