import React, { useState, useRef } from "react";
import {
  MoreHorizontal,
  Plus,
  ListPlus,
  ListMusic,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { usePlaylists } from "../../hooks/usePlaylists";
import { useAuthStore } from "../../store/useAuthStore";
import { usePlayerStore } from "../../store/usePlayerStore";
import { showLoginToast } from "../../utils/toastUtils";
import { CreatePlaylistModal } from "./CreatePlaylistModal";
import { Popover } from "../ui/Popover";

/**
 * Menu ngữ cảnh (Context Menu / Popover) khi nhấn nút "..." trên bài hát
 * - Sử dụng component Popover hiển thị ở layer trên cùng (createPortal vào document.body)
 * - Tự động phát hiện vị trí để không bao giờ bị Sidebar hoặc lề màn hình che khuất
 * - Cho phép thêm bài hát vào bất kỳ Playlist nào của người dùng.
 * - Cho phép tạo nhanh Playlist mới ngay tại menu.
 * - Hỗ trợ tùy chọn gỡ bài hát khỏi playlist nếu đang ở PlaylistPage.
 */
export const AddToPlaylistMenu = ({
  song,
  align = "auto", // "auto" | "bottom-start" | "bottom-end" | "top-start" | "top-end"
  className = "",
  buttonClassName = "",
  iconSize = 18,
  currentPlaylistId = null,
  onRemove = null, // callback xóa bài khỏi playlist hiện tại nếu có
  extraActions = null, // các nút hành động bổ sung nếu cần
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [addingPlaylistId, setAddingPlaylistId] = useState(null);

  const triggerRef = useRef(null);
  const { playlists, addSongToPlaylist } = usePlaylists();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const addToQueue = usePlayerStore((state) => state.addToQueue);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleAddToQueue = async (e) => {
    e.stopPropagation();
    if (!song) return;
    try {
      await addToQueue(song);
      const title = song.title || song.songTitle || "Bài hát";
      toast.success(`Đã thêm "${title}" vào hàng đợi`);
    } catch (err) {
      console.error("Lỗi khi thêm bài hát vào hàng đợi:", err);
      toast.error("Không thể thêm vào hàng đợi");
    } finally {
      setIsOpen(false);
    }
  };

  const handleAddToPlaylist = async (e, playlist) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      showLoginToast("thêm bài hát vào danh sách phát");
      return;
    }
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

  return (
    <>
      <div
        className={`inline-flex items-center justify-center ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút ba chấm kích hoạt */}
        <button
          ref={triggerRef}
          type="button"
          onClick={handleTriggerClick}
          title="Tùy chọn khác"
          className={`flex items-center justify-center rounded-full text-spotify-sub hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${
            isOpen ? "text-white bg-white/10" : ""
          } ${buttonClassName || "w-8 h-8"}`}
        >
          <MoreHorizontal size={iconSize} />
        </button>
      </div>

      {/* Popover Dropdown Menu hiển thị ở top-layer qua React Portal */}
      <Popover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        triggerRef={triggerRef}
        placement={align}
        className="w-64 bg-[#242424] border border-neutral-700/80 rounded-xl shadow-[0_16px_36px_rgba(0,0,0,0.85)] p-1.5 backdrop-blur-2xl flex flex-col gap-1"
      >
        {/* Mục 1: Thêm vào hàng đợi (Add to Queue) */}
        <button
          type="button"
          onClick={handleAddToQueue}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#333333] rounded-lg transition-colors cursor-pointer text-left group"
        >
          <div className="w-6 h-6 rounded-md bg-neutral-700 flex items-center justify-center flex-shrink-0 group-hover:bg-[#fa2d48]/20 transition-colors">
            <ListPlus size={14} className="text-white group-hover:text-[#fa2d48] transition-colors" />
          </div>
          <span className="truncate">Thêm vào hàng đợi</span>
        </button>

        {/* Mục 2: Tạo playlist mới */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!isAuthenticated) {
              showLoginToast("tạo danh sách phát mới");
              return;
            }
            setIsOpen(false);
            setIsCreateModalOpen(true);
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium text-white hover:bg-[#333333] rounded-lg transition-colors cursor-pointer text-left group"
        >
          <div className="w-6 h-6 rounded-md bg-neutral-700 flex items-center justify-center flex-shrink-0 group-hover:bg-white/20 transition-colors">
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
      </Popover>

      {/* Modal Tạo Playlist nhanh nếu bấm từ trong menu */}
      <CreatePlaylistModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handlePlaylistCreated}
      />
    </>
  );
};

export default AddToPlaylistMenu;
