import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Library, Plus, Search, Pin, Heart, Play, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";
import { useLibrary } from "../hooks/useLibrary";
import { LIBRARY_FILTERS } from "../constants/navigation";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { CreatePlaylistModal } from "../components/playlist/CreatePlaylistModal";
import { showLoginToast } from "../utils/toastUtils";

export const LibraryPage = () => {
  const navigate = useNavigate();
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

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleOpenCreateModal = () => {
    if (!isAuthenticated) {
      showLoginToast("tạo danh sách phát mới");
      return;
    }
    setIsCreateModalOpen(true);
  };

  return (
    <div className="flex flex-col min-h-full pb-24 px-1 sm:px-4">
      {/* ── 1. HEADER THƯ VIỆN ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
        <div className="flex items-center gap-2.5 min-w-0">
          <Library size={26} className="text-[#fa2d48] flex-shrink-0" />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight truncate">
            Thư viện
          </h1>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={() => {
                setIsSearchOpen((prev) => !prev);
                if (isSearchOpen) setSearchQuery("");
              }}
              className="text-neutral-300 hover:text-white"
              title="Tìm trong thư viện"
            >
              {isSearchOpen ? <X size={20} /> : <Search size={20} />}
            </Button>
          )}

          <Button
            variant="dark"
            size="sm"
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Tạo</span>
          </Button>
        </div>
      </div>

      {/* ── 2. THANH TÌM KIẾM TRONG THƯ VIỆN (KHI MỞ) ────────────────────── */}
      {isAuthenticated && isSearchOpen && (
        <div className="mb-3">
          <div className="relative flex items-center bg-[#242424] focus-within:bg-[#2c2c2c] rounded-full px-3.5 py-2 border border-white/10 focus-within:border-white/25 transition-all">
            <Search size={16} className="text-neutral-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nghệ sĩ, album, playlist..."
              className="w-full bg-transparent border-none outline-none text-white text-sm ml-2.5 placeholder-neutral-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="p-1 text-neutral-400 hover:text-white cursor-pointer"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 3. BỘ LỌC CHIP PILLS (PLAYLIST, EP, ALBUM, NGHỆ SĨ) ──────────── */}
      {isAuthenticated && (
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1.5 mb-3">
          {selectedFilter && (
            <button
              type="button"
              onClick={() => setSelectedFilter(null)}
              className="w-8 h-8 rounded-full bg-[#242424] hover:bg-[#323232] text-white flex items-center justify-center flex-shrink-0 transition-colors cursor-pointer"
              title="Xóa bộ lọc"
            >
              <X size={15} />
            </button>
          )}

          {LIBRARY_FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <button
                key={filter}
                type="button"
                onClick={() => setSelectedFilter(isSelected ? null : filter)}
                className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer flex-shrink-0 border select-none ${
                  isSelected
                    ? "bg-[#fa2d48] text-white border-[#fa2d48] font-bold shadow-[0_2px_10px_rgba(250,45,72,0.3)]"
                    : "bg-[#242424] hover:bg-[#323232] text-white border-transparent"
                }`}
              >
                {filter}
              </button>
            );
          })}
        </div>
      )}

      {/* ── 4. DANH SÁCH THƯ VIỆN ────────────────────────────────────────── */}
      {isAuthenticated ? (
        <div className="flex flex-col gap-1">
          {/* MỤC GHIM ĐẦU TIÊN: BÀI HÁT ĐÃ THÍCH */}
          {shouldShowLikedSongs && (
            <div
              onClick={() => navigate("/collection/tracks")}
              className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1a1a1a] active:bg-[#242424] cursor-pointer group transition-colors select-none"
            >
              {/* Thumbnail vuông gradient xanh tím với trái tim trắng */}
              <div
                onClick={handlePlayLikedSongs}
                className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#450af5] via-[#6136f6] to-[#8e8ee5] flex items-center justify-center shadow-md"
                title="Phát Bài hát đã thích"
              >
                <Heart size={24} className="text-white fill-white" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </div>
              </div>

              {/* Thông tin */}
              <div className="flex flex-col flex-1 min-w-0 justify-center">
                <span className="text-sm sm:text-base font-bold text-white truncate">
                  Bài hát đã thích
                </span>
                <div className="flex items-center gap-1.5 text-xs sm:text-sm text-spotify-sub mt-0.5">
                  <Pin
                    size={13}
                    className="text-[#fa2d48] fill-[#fa2d48] flex-shrink-0 rotate-45"
                  />
                  <span className="truncate">
                    Danh sách phát • {favoriteSongsCount} bài hát
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* DANH SÁCH NGHỆ SĨ, ALBUM & PLAYLIST TỰ TẠO */}
          {libraryItems.map((item) => {
            const isArtist = item.type === "artist";
            const isAlbum = item.type === "album";
            const isPlaylist = item.type === "playlist";
            const itemPath = isArtist
              ? `/artist/${item.id}`
              : isAlbum
              ? `/album/${item.id}`
              : `/playlist/${item.id}`;

            return (
              <div
                key={`${item.type}-${item.id}`}
                onClick={() => {
                  if (isArtist) navigate(itemPath);
                  else if (isAlbum) navigate(itemPath, { state: { album: item.raw } });
                  else if (isPlaylist) navigate(itemPath, { state: { playlist: item.raw } });
                }}
                className="flex items-center gap-3.5 p-2.5 rounded-xl hover:bg-[#1a1a1a] active:bg-[#242424] cursor-pointer group transition-colors select-none"
              >
                {/* Ảnh đại diện */}
                <div
                  onClick={(e) => {
                    if (isArtist) handlePlayArtist(e, item.id);
                    else if (isAlbum) handlePlayAlbum(e, item.id);
                    else if (isPlaylist) handlePlayPlaylist(e, item.id);
                  }}
                  className={`relative w-14 h-14 flex-shrink-0 overflow-hidden bg-neutral-800 shadow-md ${
                    isArtist ? "rounded-full" : "rounded-lg"
                  }`}
                >
                  <CoverImage
                    src={item.image}
                    alt={item.title}
                    isArtist={isArtist}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Play size={20} fill="white" className="text-white ml-0.5" />
                  </div>
                </div>

                {/* Thông tin */}
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <span className="text-sm sm:text-base font-semibold text-white truncate">
                    {item.title}
                  </span>
                  <span className="text-xs sm:text-sm text-spotify-sub truncate mt-0.5">
                    {item.subtitle}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Trạng thái trống khi lọc không có kết quả */}
          {libraryItems.length === 0 && !shouldShowLikedSongs && (
            <div className="py-16 text-center text-spotify-sub text-sm">
              Không tìm thấy mục nào phù hợp trong thư viện.
            </div>
          )}
        </div>
      ) : (
        /* Trạng thái khi chưa đăng nhập */
        <div className="bg-[#181818] border border-white/5 rounded-2xl p-6 mt-4 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#fa2d48]/15 text-[#fa2d48] flex items-center justify-center">
            <Library size={28} />
          </div>
          <div className="flex flex-col gap-1.5 max-w-xs">
            <h2 className="text-lg font-bold text-white">
              Thưởng thức thư viện của bạn
            </h2>
            <p className="text-xs sm:text-sm text-spotify-sub leading-relaxed">
              Đăng nhập để xem bài hát đã thích, nghệ sĩ theo dõi, album và các
              playlist của riêng bạn.
            </p>
          </div>
          <Button
            variant="white"
            size="md"
            onClick={() => navigate("/login")}
            className="text-black font-bold rounded-full px-6"
          >
            Đăng nhập ngay
          </Button>
        </div>
      )}

      {/* Modal tạo Playlist mới */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};
