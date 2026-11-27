import React, { useState, useMemo, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  Search,
  ListMusic,
  Trash2,
  Globe,
  Lock,
  Music2,
  MoreHorizontal,
  Pencil,
} from "lucide-react";

import { getPlaylistSongsApi, getPlaylistByIdApi } from "../api/users/playlists";
import { getSongById } from "../api/catalog/public";
import { usePlaylists } from "../hooks/usePlaylists";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { EmptyState } from "../components/ui/EmptyState";
import { TrackTable } from "../components/ui/TrackTable";
import { EditPlaylistModal } from "../components/playlist/EditPlaylistModal";
import { DeletePlaylistConfirmModal } from "../components/playlist/DeletePlaylistConfirmModal";
import { Popover } from "../components/ui/Popover";

export const PlaylistPage = () => {
  const { id: playlistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { playlists, removeSongFromPlaylist, deletePlaylist, isDeleting } = usePlaylists();
  const user = useAuthStore((state) => state.user);
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const { favoriteSongIds, toggleFavoriteSong } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSongId, setLoadingSongId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const menuRef = useRef(null);

  // 1. Fetch thông tin chi tiết Playlist
  const statePlaylist = location.state?.playlist;
  const { data: playlistDetailData } = useQuery({
    queryKey: ["playlistDetail", playlistId],
    queryFn: () => getPlaylistByIdApi(playlistId),
    enabled: !!playlistId,
    initialData: statePlaylist ? { data: statePlaylist } : undefined,
  });

  const playlist = useMemo(() => {
    return (
      playlistDetailData?.data ||
      playlists.find((p) => p.id === playlistId) ||
      statePlaylist ||
      null
    );
  }, [playlistDetailData, playlists, playlistId, statePlaylist]);

  // Kiểm tra quyền sở hữu Playlist
  const isOwner = useMemo(() => {
    if (!user?.id || !playlist?.userId) return true;
    return playlist.userId === user.id;
  }, [user, playlist]);

  // 2. Fetch danh sách bài hát trong Playlist
  const {
    data: songsData,
    isLoading: isLoadingSongs,
  } = useQuery({
    queryKey: ["playlistSongs", playlistId],
    queryFn: () => getPlaylistSongsApi(playlistId, { size: 100 }),
    enabled: !!playlistId,
  });

  const rawSongs = useMemo(() => {
    return songsData?.data?.content || [];
  }, [songsData]);

  // 3. Lọc bài hát theo ô tìm kiếm nội bộ
  const filteredSongs = useMemo(() => {
    if (!searchQuery.trim()) return rawSongs;
    const q = searchQuery.toLowerCase().trim();
    return rawSongs.filter(
      (s) =>
        s.songTitle?.toLowerCase().includes(q) ||
        s.artistName?.toLowerCase().includes(q)
    );
  }, [rawSongs, searchQuery]);

  // 4. Kiểm tra trạng thái playlist đang phát
  const isPlaylistPlaying =
    isPlaying &&
    currentSong &&
    rawSongs.some((s) => s.songId === currentSong.id);

  // 6. Phát toàn bộ Playlist
  const handlePlayAll = async () => {
    if (rawSongs.length === 0) return;
    if (isPlaylistPlaying) {
      setIsPlaying(false);
      return;
    }

    try {
      setLoadingSongId(rawSongs[0].songId);
      const res = await getSongById(rawSongs[0].songId);
      const fullSong = res?.data;

      if (fullSong) {
        const pool = rawSongs.map((s) => ({
          id: s.songId,
          title: s.songTitle,
          artist: s.artistName,
          artistName: s.artistName,
          coverImage: s.coverImage,
        }));
        playSongWithContext(fullSong, pool, 0);
      }
    } catch (err) {
      console.error("Lỗi khi phát playlist:", err);
    } finally {
      setLoadingSongId(null);
    }
  };

  // 7. Trộn bài ngẫu nhiên trong Playlist
  const handleShufflePlay = async () => {
    if (rawSongs.length === 0) return;
    const randomIndex = Math.floor(Math.random() * rawSongs.length);
    const targetItem = rawSongs[randomIndex];

    try {
      setLoadingSongId(targetItem.songId);
      const res = await getSongById(targetItem.songId);
      const fullSong = res?.data;

      if (fullSong) {
        const pool = rawSongs.map((s) => ({
          id: s.songId,
          title: s.songTitle,
          artist: s.artistName,
          artistName: s.artistName,
          coverImage: s.coverImage,
        }));
        playSongWithContext(fullSong, pool, randomIndex);
      }
    } catch (err) {
      console.error("Lỗi khi trộn bài playlist:", err);
    } finally {
      setLoadingSongId(null);
    }
  };

  // 8. Phát 1 bài cụ thể khi click dòng
  const handlePlaySong = useCallback(
    async (item, index) => {
      try {
        setLoadingSongId(item.songId);
        const res = await getSongById(item.songId);
        const fullSong = res?.data;

        if (fullSong) {
          const pool = rawSongs.map((s) => ({
            id: s.songId,
            title: s.songTitle,
            artist: s.artistName,
            artistName: s.artistName,
            coverImage: s.coverImage,
          }));
          playSongWithContext(fullSong, pool, index);
        }
      } catch (err) {
        console.error("Lỗi khi phát bài hát trong playlist:", err);
      } finally {
        setLoadingSongId(null);
      }
    },
    [rawSongs, playSongWithContext]
  );

  // 9. Gỡ bài hát khỏi Playlist
  const handleRemoveSong = useCallback(
    async (songItem) => {
      const songId = songItem.songId || songItem.id;
      if (!songId || !playlistId) return;
      try {
        await removeSongFromPlaylist({ playlistId, songId });
      } catch (err) {
        console.error("Lỗi xóa bài khỏi playlist:", err);
      }
    },
    [removeSongFromPlaylist, playlistId]
  );

  return (
    <div className="flex flex-col min-h-full pb-16">
      {/* ── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 px-4 sm:px-6 pt-6 sm:pt-16 pb-6 sm:pb-8 bg-gradient-to-b from-[#1e3a5f] via-[#101b2b] to-spotify-black">
        {/* Ảnh bìa Playlist lớn */}
        <div
          onClick={() => isOwner && setIsEditModalOpen(true)}
          className={`flex-shrink-0 w-36 h-36 sm:w-52 sm:h-52 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center border border-white/5 relative group ${
            isOwner ? "cursor-pointer" : ""
          }`}
          title={isOwner ? "Chỉnh sửa thông tin chi tiết" : playlist?.name}
        >
          {playlist?.coverImage ? (
            <CoverImage
              src={playlist.coverImage}
              alt={playlist.name || "Playlist Cover"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
              <ListMusic size={48} className="sm:w-16 sm:h-16 text-[#fa2d48] opacity-80" />
            </div>
          )}

          {isOwner && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1.5 transition-opacity text-white text-xs font-semibold">
              <Pencil size={24} />
              <span>Sửa chi tiết</span>
            </div>
          )}
        </div>

        {/* Thông tin Playlist */}
        <div className="flex flex-col gap-1.5 sm:gap-2 pb-1 text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
              Danh sách phát
            </span>
            <span className="text-white/40">•</span>
            <div className="flex items-center gap-1 text-xs text-neutral-300">
              {playlist?.isPublic ? (
                <>
                  <Globe size={13} className="text-emerald-400" />
                  <span>Công khai</span>
                </>
              ) : (
                <>
                  <Lock size={13} className="text-neutral-400" />
                  <span>Riêng tư</span>
                </>
              )}
            </div>
          </div>

          <h1
            onClick={() => isOwner && setIsEditModalOpen(true)}
            className={`text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight line-clamp-2 ${
              isOwner ? "cursor-pointer hover:underline decoration-white/40" : ""
            }`}
            title={isOwner ? "Chỉnh sửa tên danh sách phát" : playlist?.name}
          >
            {playlist?.name || "Danh sách phát"}
          </h1>

          {playlist?.description && (
            <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 max-w-2xl mt-1">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 mt-1 sm:mt-2 flex-wrap text-xs sm:text-sm text-spotify-sub">
            <span className="font-bold text-white">
              {user?.fullName || "Tôi"}
            </span>
            <span>•</span>
            <span>{rawSongs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-b from-[#101b2b]/40 to-transparent">
        {/* Nút Play chính & Trộn bài */}
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={handlePlayAll}
            disabled={rawSongs.length === 0}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#fa2d48] hover:bg-[#e0223e] flex items-center justify-center shadow-[0_8px_20px_rgba(250,45,72,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
            title={isPlaylistPlaying ? "Tạm dừng" : "Phát tất cả"}
          >
            {isPlaylistPlaying ? (
              <Pause size={22} fill="white" className="text-white" />
            ) : (
              <Play size={22} fill="white" className="text-white ml-0.5" />
            )}
          </button>

          <Button
            variant="ghost"
            size="md"
            iconOnly
            disabled={rawSongs.length === 0}
            tooltip="Trộn bài"
            tooltipPosition="top"
            onClick={handleShufflePlay}
            className="hover:bg-white/10"
          >
            <Shuffle size={20} />
          </Button>

          {/* Nút ... Tùy chọn Playlist cá nhân */}
          {isOwner && (
            <>
              <div ref={menuRef} className="inline-flex">
                <Button
                  variant="ghost"
                  size="md"
                  iconOnly
                  tooltip="Tùy chọn khác"
                  tooltipPosition="top"
                  onClick={() => setIsMenuOpen((prev) => !prev)}
                  className={`hover:bg-white/10 text-neutral-300 hover:text-white ${
                    isMenuOpen ? "text-white bg-white/10" : ""
                  }`}
                >
                  <MoreHorizontal size={22} />
                </Button>
              </div>

              {/* Menu Dropdown Popup hiển thị ở top-layer qua React Portal */}
              <Popover
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                triggerRef={menuRef}
                className="w-56 rounded-xl bg-[#282828] shadow-[0_16px_36px_rgba(0,0,0,0.85)] border border-neutral-700/80 p-1.5 flex flex-col gap-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-neutral-200 hover:text-white hover:bg-neutral-700 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Pencil size={16} className="text-neutral-400" />
                  <span>Sửa thông tin chi tiết</span>
                </button>

                <div className="my-1 border-t border-neutral-700/80" />

                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false);
                    // Quy tắc: Nếu có >= 1 bài hát thì hiện modal xác nhận; nếu không có bài nào thì xóa thẳng không cần hỏi
                    if (rawSongs.length > 0) {
                      setIsDeleteConfirmOpen(true);
                    } else {
                      deletePlaylist(playlistId).then(() => navigate("/"));
                    }
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors text-left cursor-pointer"
                >
                  <Trash2 size={16} />
                  <span>Xóa danh sách phát</span>
                </button>
              </Popover>
            </>
          )}
        </div>

        {/* Ô tìm kiếm trong Playlist */}
        {rawSongs.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-sub pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong danh sách..."
              className="w-full bg-[#242424] hover:bg-[#2a2a2a] focus:bg-[#2a2a2a] text-white placeholder-spotify-sub text-xs rounded-full pl-9 pr-4 py-2 outline-none border border-transparent focus:border-neutral-600 transition-all"
            />
          </div>
        )}
      </div>

      {/* ── TRACKLIST BẢNG DANH SÁCH BÀI HÁT ─────────────────────────────── */}
      <div className="px-3 sm:px-6 flex-1">
        <TrackTable
          songs={filteredSongs}
          isLoading={isLoadingSongs}
          currentSongId={currentSong?.id}
          loadingSongId={loadingSongId}
          favoriteSongIds={favoriteSongIds}
          showFavoriteColumn
          currentPlaylistId={playlistId}
          onPlaySong={handlePlaySong}
          onToggleFavorite={toggleFavoriteSong}
          onRemoveSong={isOwner ? handleRemoveSong : undefined}
          emptyComponent={
            rawSongs.length === 0 ? (
              <EmptyState
                icon={<Music2 size={32} className="text-[#fa2d48]" />}
                title="Danh sách phát này chưa có bài hát nào"
                description="Khám phá các bài hát bạn yêu thích từ Trang chủ, Album hay Nghệ sĩ và bấm vào nút ... để thêm vào danh sách phát này."
                actionLabel="Khám phá nhạc"
                onAction={() => navigate("/")}
                actionVariant="white"
                className="py-24"
              />
            ) : (
              <div className="py-16 text-center text-spotify-sub text-sm">
                Không tìm thấy bài hát nào khớp với từ khóa "{searchQuery}".
              </div>
            )
          }
        />
      </div>

      {/* Modal Chỉnh sửa thông tin Playlist */}
      <EditPlaylistModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        playlist={playlist}
      />

      {/* Modal Xác nhận Xóa Playlist (chỉ hiện khi có ít nhất 1 bài hát) */}
      <DeletePlaylistConfirmModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        playlistName={playlist?.name}
        isDeleting={isDeleting}
        onConfirm={async () => {
          try {
            await deletePlaylist(playlistId);
            setIsDeleteConfirmOpen(false);
            navigate("/");
          } catch (err) {
            console.error("Lỗi khi xóa playlist:", err);
          }
        }}
      />
    </div>
  );
};
