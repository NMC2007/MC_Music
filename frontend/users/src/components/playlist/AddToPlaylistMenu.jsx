import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Plus,
  ListMusic,
  Check,
  Loader2,
  Trash2,
} from "lucide-react";
import { usePlaylists } from "../../hooks/usePlaylists";
import { useAuthStore } from "../../store/useAuthStore";
import { showLoginToast } from "../../utils/toastUtils";
import { CreatePlaylistModal } from "./CreatePlaylistModal";

/**
 * Menu ngữ cảnh (Context Menu / Popover) khi nhấn nút "..." trên bài hát
 * - Cho phép thêm bài hát vào bất kỳ Playlist nào của người dùng.
 * - Cho phép tạo nhanh Playlist mới ngay tại menu.
 * - Hỗ trợ tùy chọn gỡ bài hát khỏi playlist nếu đang ở PlaylistPage.
 */
export const AddToPlaylistMenu = ({
  song,
  align = "right", // "right" | "left" | "top-right"
  className = "",
  currentPlaylistId = null,
  onRemove = null, // callback xóa bài khỏi playlist hiện tại nếu có
  extraActions = null, // các nút hành động bổ sung nếu cần
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addingPlaylistId, setAddingPlaylistId] = useState(null);

  const menuRef = useRef(null);
  const { playlists, addSongToPlaylist } = usePlaylists();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Đóng khi bấm Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showLoginToast("thêm bài hát vào danh sách phát");
      return;
    }
    setIsOpen((prev) => !prev);
  };

  const handleAddToPlaylist = async (e, playlist) => {
    e.stopPropagation();
    const songId = song?.id || song?.songId;
    if (!songId || !playlist?.id) return;

    try {
      setAddingPlaylistId(playlist.id);
      await addSongToPlaylist({
        playlistId: playlist.id,
        songId,
        playlistName: playlist.name,
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Lỗi thêm bài hát vào playlist:", err);
    } finally {
      setAddingPlaylistId(null);
    }
  };

  // Sau khi tạo playlist mới từ Modal, tự động add bài hát này vào
  const handlePlaylistCreated = async (newPlaylist) => {
    const songId = song?.id || song?.songId;
    if (newPlaylist?.id && songId) {
      try {
        await addSongToPlaylist({
          playlistId: newPlaylist.id,
          songId,
          playlistName: newPlaylist.name,
        });
      } catch (err) {
        console.error("Lỗi tự động thêm bài hát vào playlist vừa tạo:", err);
      }
    }
    setIsCreateModalOpen(false);
    setIsOpen(false);
  };

  // Xác định vị trí dropdown popover
  const getDropdownPosition = () => {
    if (align === "top-right") {
      return "bottom-full right-0 mb-2";
    }
    if (align === "left") {
      return "top-full left-0 mt-1.5";
    }
    return "top-full right-0 mt-1.5";
  };

  return (
    <div
      ref={menuRef}
      className={`relative inline-flex items-center ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Nút ba chấm kích hoạt */}
      <button
        type="button"
        onClick={handleTriggerClick}
        title="Tùy chọn khác"
        className={`p-1.5 rounded-full text-spotify-sub hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
          isOpen ? "text-white bg-white/10" : ""
        }`}
      >
        <MoreHorizontal size={18} />
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${getDropdownPosition()} w-64 bg-[#242424] border border-neutral-700/80 rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.85)] p-1.5 z-50 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 select-none flex flex-col gap-1`}
        >
          {/* Mục: Tạo playlist mới */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsCreateModalOpen(true);
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#333333] rounded-lg transition-colors cursor-pointer text-left"
          >
            <div className="w-6 h-6 rounded-md bg-neutral-700 flex items-center justify-center flex-shrink-0">
              <Plus size={14} className="text-white" />
            </div>
            <span className="truncate">Tạo danh sách phát mới</span>
          </button>

          {/* Đường phân cách */}
          <div className="h-px bg-neutral-800 my-0.5" />

          {/* Tiêu đề mục thêm vào playlist */}
          <div className="px-3 pt-1 pb-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center justify-between">
            <span>Thêm vào playlist</span>
            <span className="text-[10px] text-neutral-500 font-normal">
              {playlists.length} playlist
            </span>
          </div>

          {/* Danh sách Playlist của người dùng */}
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5 pr-0.5 custom-scrollbar">
            {playlists.length === 0 ? (
              <div className="px-3 py-3 text-xs text-spotify-sub text-center italic">
                Bạn chưa có danh sách phát nào. Hãy bấm "Tạo mới" ở trên!
              </div>
            ) : (
              playlists.map((pl) => {
                const isCurrent = pl.id === currentPlaylistId;
                const isAdding = addingPlaylistId === pl.id;

                return (
                  <button
                    key={pl.id}
                    type="button"
                    disabled={isAdding}
                    onClick={(e) => handleAddToPlaylist(e, pl)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-neutral-200 hover:text-white hover:bg-[#333333] rounded-lg transition-colors cursor-pointer text-left group/item ${
                      isCurrent ? "opacity-60 bg-neutral-800/40" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <ListMusic
                        size={15}
                        className="text-spotify-sub group-hover/item:text-[#fa2d48] flex-shrink-0 transition-colors"
                      />
                      <span className="truncate">{pl.name}</span>
                    </div>

                    {isAdding ? (
                      <Loader2
                        size={14}
                        className="animate-spin text-[#fa2d48] flex-shrink-0 ml-2"
                      />
                    ) : isCurrent ? (
                      <span className="text-[10px] text-neutral-400 italic flex-shrink-0 ml-2">
                        Hiện tại
                      </span>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>

          {/* Các hành động bổ sung (nếu có, ví dụ: Xóa khỏi playlist) */}
          {(onRemove || extraActions) && (
            <>
              <div className="h-px bg-neutral-800 my-0.5" />
              {extraActions}
              {onRemove && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                    onRemove(song);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer text-left"
                >
                  <Trash2 size={15} className="flex-shrink-0" />
                  <span className="truncate">Xóa khỏi danh sách phát này</span>
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Modal Tạo Playlist nhanh nếu bấm từ trong menu */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePlaylistCreated}
      />
    </div>
  );
};
