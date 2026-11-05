import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Disc3,
  GripVertical,
  Play,
  Pause,
  Plus,
  Trash2,
  Save,
  Music,
  Calendar,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";
import { StatusBadge } from "#/components/ui/StatusBadge";
import { SimpleAudioPlayer } from "#/components/ui/SimpleAudioPlayer";
import {
  getSongsByAlbumApi,
  getMySongsApi,
  addSongToAlbumApi,
  removeSongFromAlbumApi,
  reorderSongsInAlbumApi,
} from "#/api/catalog";
import { formatDuration, formatDate } from "#/utils/formatters";

export const AlbumDetailModal = ({ isOpen, onClose, album }) => {
  const queryClient = useQueryClient();

  // ── STATE ──
  const [tracks, setTracks] = useState([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [previewSong, setPreviewSong] = useState(null);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  // Thêm bài hát modal / dropdown state
  const [isAddSongOpen, setIsAddSongOpen] = useState(false);
  const [addSearchInput, setAddSearchInput] = useState("");

  // ── FETCH BÀI HÁT TRONG ALBUM ──
  const { data: albumSongsRes, isLoading: isLoadingTracks } = useQuery({
    queryKey: ["albumSongs", album?.id],
    queryFn: () => getSongsByAlbumApi(album.id, { page: 0, size: 100 }),
    enabled: isOpen && !!album?.id,
    retry: false,
    staleTime: 1000 * 60 * 2,
  });

  // Đồng bộ danh sách bài hát vào state cục bộ để hỗ trợ kéo thả reorder
  useEffect(() => {
    if (albumSongsRes?.data?.content) {
      const sorted = [...albumSongsRes.data.content].sort(
        (a, b) => (a.trackNumber || 999) - (b.trackNumber || 999)
      );
      setTracks(sorted);
      setHasOrderChanged(false);
    } else {
      setTracks([]);
      setHasOrderChanged(false);
    }
  }, [albumSongsRes]);

  // Reset state khi mở/đóng modal
  useEffect(() => {
    if (!isOpen) {
      setPreviewSong(null);
      setHasOrderChanged(false);
      setDraggedIndex(null);
      setDragOverIndex(null);
      setIsAddSongOpen(false);
      setAddSearchInput("");
    }
  }, [isOpen]);

  // ── FETCH TẤT CẢ BÀI HÁT CỦA NGHỆ SĨ ĐỂ THÊM VÀO ALBUM ──
  const { data: mySongsRes } = useQuery({
    queryKey: ["mySongsForAlbumAdd"],
    queryFn: () => getMySongsApi({ page: 0, size: 100, isDeleted: false }),
    enabled: isOpen && isAddSongOpen,
    staleTime: 1000 * 60 * 2,
  });

  const allMySongs = mySongsRes?.data?.content || [];
  // Lọc ra các bài chưa có trong album hiện tại
  const availableSongs = allMySongs.filter(
    (s) => !tracks.some((t) => t.id === s.id)
  );

  const filteredAvailableSongs = addSearchInput
    ? availableSongs.filter((s) =>
        s.title?.toLowerCase().includes(addSearchInput.toLowerCase().trim())
      )
    : availableSongs;

  // ── MUTATION: THÊM BÀI HÁT VÀO ALBUM ──
  const addSongMutation = useMutation({
    mutationFn: (song) =>
      addSongToAlbumApi(album.id, {
        songId: song.id,
        trackNumber: tracks.length + 1,
      }),
    onSuccess: (_, song) => {
      toast.success("Đã thêm bài hát vào Album!", {
        description: `"${song.title}" đã được gán vào ${album.title}.`,
      });
      // Thêm bài hát vào mảng tracks cục bộ
      setTracks((prev) => [
        ...prev,
        {
          ...song,
          trackNumber: prev.length + 1,
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ["albumSongs", album.id] });
      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
    },
    onError: (err) => {
      toast.error("Thêm bài hát thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // ── MUTATION: GỠ BÀI HÁT KHỎI ALBUM ──
  const removeSongMutation = useMutation({
    mutationFn: (songId) => removeSongFromAlbumApi(album.id, songId),
    onSuccess: (_, songId) => {
      toast.success("Đã gỡ bài hát khỏi Album!", {
        description: "Bài hát đã được tách thành Đĩa đơn (Single) độc lập.",
      });
      // Loại bỏ bài hát khỏi tracks và tính lại trackNumber
      setTracks((prev) =>
        prev
          .filter((t) => t.id !== songId)
          .map((t, idx) => ({ ...t, trackNumber: idx + 1 }))
      );
      queryClient.invalidateQueries({ queryKey: ["albumSongs", album.id] });
      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
    },
    onError: (err) => {
      toast.error("Gỡ bài hát thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // ── MUTATION: LƯU THỨ TỰ TRACKS MỚI (REORDER) ──
  const reorderMutation = useMutation({
    mutationFn: () => {
      const songOrders = tracks.map((track, idx) => ({
        songId: track.id,
        trackNumber: idx + 1,
      }));
      return reorderSongsInAlbumApi(album.id, { songOrders });
    },
    onSuccess: () => {
      toast.success("Cập nhật thứ tự bài hát thành công!", {
        description: "Thứ tự các bài hát trong album đã được lưu lại.",
      });
      setHasOrderChanged(false);
      queryClient.invalidateQueries({ queryKey: ["albumSongs", album.id] });
    },
    onError: (err) => {
      toast.error("Lưu thứ tự thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // ── XỬ LÝ KÉO THẢ (NATIVE HTML5 DRAG & DROP) ──
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    // Thêm dữ liệu text để tương thích Firefox
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Hoán đổi vị trí trong mảng
    const newTracks = [...tracks];
    const [movedItem] = newTracks.splice(draggedIndex, 1);
    newTracks.splice(targetIndex, 0, movedItem);

    // Cập nhật lại số thứ tự hiển thị
    const updatedTracks = newTracks.map((item, idx) => ({
      ...item,
      trackNumber: idx + 1,
    }));

    setTracks(updatedTracks);
    setHasOrderChanged(true);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleRemoveTrack = (track) => {
    if (
      confirm(
        `Bạn có chắc muốn gỡ bài hát "${track.title}" khỏi album "${album.title}"?\nBài hát sẽ trở thành Đĩa đơn Single độc lập.`
      )
    ) {
      removeSongMutation.mutate(track.id);
    }
  };

  if (!album) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết Album & Quản lý Tracklist"
      description="Xem danh sách bài hát, kéo thả để sắp xếp thứ tự phát hoặc thêm/bớt bài hát."
      maxWidth="max-w-3xl"
    >
      <div className="space-y-6 pt-1 max-h-[75vh] overflow-y-auto scrollbar-thin pr-1">
        {/* ── 1. HEADER ALBUM BANNER ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-2xl bg-[#161616] border border-white/[0.05]">
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-neutral-800 shadow-xl relative">
            <CoverImage
              src={album.coverImage}
              alt={album.title}
              className="w-full h-full object-cover"
              isAlbum
            />
            <div className="absolute top-1.5 right-1.5">
              <span className="px-1.5 py-0.5 rounded bg-black/75 backdrop-blur-md text-[9px] font-black text-white uppercase">
                {album.albumType || "ALBUM"}
              </span>
            </div>
          </div>

          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2">
              <StatusBadge status={album.status} size="sm" />
              <span className="text-[11px] text-neutral-400 flex items-center gap-1 font-mono">
                <Calendar size={12} /> {formatDate(album.releaseDate || album.createdAt)}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight truncate">
              {album.title}
            </h2>

            <p className="text-xs text-neutral-400">
              Tổng số tác phẩm:{" "}
              <strong className="text-white">{tracks.length} bài hát</strong>
            </p>

            {album.description && (
              <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed italic">
                "{album.description}"
              </p>
            )}
          </div>
        </div>

        {/* ── 2. AUDIO PREVIEW NẾU ĐANG PHÁT ── */}
        {previewSong && (
          <div className="animate-in fade-in duration-200">
            <SimpleAudioPlayer
              src={previewSong.audioUrl}
              title={`Đang nghe thử: ${previewSong.title}`}
              autoPlay
              onClose={() => setPreviewSong(null)}
            />
          </div>
        )}

        {/* ── 3. THANH HÀNH ĐỘNG TRACKLIST ── */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Disc3 size={15} className="text-[#fa2d48]" />
              Danh sách bài hát ({tracks.length})
            </span>
            {hasOrderChanged && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 text-[10px] font-bold animate-pulse">
                Thứ tự đã thay đổi
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasOrderChanged && (
              <Button
                variant="primary"
                size="sm"
                isLoading={reorderMutation.isPending}
                onClick={() => reorderMutation.mutate()}
                className="shadow-[0_2px_12px_rgba(250,45,72,0.4)]"
              >
                <Save size={14} /> Lưu thứ tự mới
              </Button>
            )}

            <Button
              variant="dark"
              size="sm"
              onClick={() => setIsAddSongOpen(!isAddSongOpen)}
              className="bg-white/10 hover:bg-white/20 text-xs"
            >
              <Plus size={14} /> {isAddSongOpen ? "Đóng chọn bài" : "Thêm bài vào Album"}
            </Button>
          </div>
        </div>

        {/* ── 4. PHÂN VÙNG CHỌN BÀI HÁT THÊM VÀO ALBUM (COLLAPSIBLE) ── */}
        {isAddSongOpen && (
          <div className="p-4 rounded-2xl bg-[#141414] border border-[#fa2d48]/25 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Plus size={14} className="text-[#fa2d48]" />
                Chọn bài hát của bạn để thêm vào Album
              </h4>
              <span className="text-[11px] text-neutral-400">
                {availableSongs.length} bài hát khả dụng
              </span>
            </div>

            {/* Ô tìm kiếm nhanh bài hát */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Tìm bài hát để thêm..."
                value={addSearchInput}
                onChange={(e) => setAddSearchInput(e.target.value)}
                className="w-full h-8 bg-[#1f1f1f] text-white text-xs rounded-xl pl-9 pr-3 outline-none border border-neutral-700/60 focus:border-white/60"
              />
            </div>

            {/* Danh sách bài hát khả dụng */}
            <div className="max-h-48 overflow-y-auto scrollbar-thin divide-y divide-white/[0.03] rounded-xl bg-[#1a1a1a]">
              {filteredAvailableSongs.length === 0 ? (
                <div className="py-6 text-center text-xs text-neutral-500">
                  {addSearchInput
                    ? "Không tìm thấy bài hát nào khớp."
                    : "Tất cả bài hát của bạn đã được thêm vào album này."}
                </div>
              ) : (
                filteredAvailableSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-2.5 hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                        <CoverImage
                          src={song.coverImage}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">
                          {song.title}
                        </p>
                        <p className="text-[10px] text-neutral-400">
                          {formatDuration(song.durationSeconds)} •{" "}
                          {song.status === "APPROVED" ? "Đã duyệt" : "Chờ duyệt"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={addSongMutation.isPending}
                      onClick={() => addSongMutation.mutate(song)}
                      className="h-7 px-3 text-[11px]"
                    >
                      <Plus size={12} /> Thêm
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── 5. BẢNG TRACKLIST VỚI KÉO THẢ DRAG & DROP ── */}
        <div className="rounded-2xl bg-[#161616] border border-white/[0.05] overflow-hidden">
          {isLoadingTracks ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-neutral-400 text-xs">
              <Loader2 size={18} className="animate-spin text-[#fa2d48]" />
              Đang tải danh sách bài hát trong Album...
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-12 px-4 text-center space-y-2">
              <Music size={28} className="text-neutral-600 mx-auto" />
              <p className="text-xs font-bold text-white">
                Album này chưa có bài hát nào
              </p>
              <p className="text-[11px] text-neutral-400 max-w-xs mx-auto">
                Bấm nút "Thêm bài vào Album" ở trên để đưa các bài hát của bạn vào ấn phẩm này.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {tracks.map((track, index) => {
                const isPlaying = previewSong?.id === track.id;
                const isDragging = draggedIndex === index;
                const isOver = dragOverIndex === index;

                return (
                  <div
                    key={track.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center justify-between p-3.5 transition-all select-none group cursor-grab active:cursor-grabbing ${
                      isDragging
                        ? "opacity-40 bg-black/40 scale-[0.99]"
                        : isOver
                        ? "border-t-2 border-[#fa2d48] bg-[#fa2d48]/10"
                        : "hover:bg-white/[0.025]"
                    }`}
                  >
                    {/* Bên trái: Handle kéo thả + Track Number + Play + Info */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Handle Kéo thả */}
                      <div
                        className="text-neutral-600 group-hover:text-neutral-300 transition-colors p-1"
                        title="Kéo thả để sắp xếp thứ tự bài hát"
                      >
                        <GripVertical size={16} />
                      </div>

                      {/* Số thứ tự track */}
                      <span className="w-5 text-center text-xs font-mono font-bold text-neutral-400">
                        {index + 1}
                      </span>

                      {/* Nút Play nghe thử */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isPlaying) setPreviewSong(null);
                          else setPreviewSong(track);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#fa2d48] transition-all cursor-pointer flex-shrink-0"
                        title={isPlaying ? "Dừng" : "Nghe thử"}
                      >
                        {isPlaying ? (
                          <Pause size={12} fill="currentColor" />
                        ) : (
                          <Play size={12} fill="currentColor" className="ml-0.5" />
                        )}
                      </button>

                      {/* Cover & Tên bài hát */}
                      <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                        <CoverImage
                          src={track.coverImage}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        <p
                          className={`text-xs font-bold truncate transition-colors ${
                            isPlaying ? "text-[#fa2d48]" : "text-white group-hover:text-[#fa2d48]"
                          }`}
                        >
                          {track.title}
                        </p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {track.ownerName}
                          {track.explicit && (
                            <span className="ml-1.5 px-1 py-0.2 rounded text-[9px] bg-neutral-800 text-neutral-400 uppercase font-bold">
                              18+
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Bên phải: Thời lượng, Trạng thái & Nút Gỡ khỏi album */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-neutral-400 font-mono hidden sm:inline-block">
                        {formatDuration(track.durationSeconds)}
                      </span>

                      <StatusBadge status={track.status} size="sm" />

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveTrack(track);
                        }}
                        disabled={removeSongMutation.isPending}
                        className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all cursor-pointer"
                        title="Gỡ bài hát khỏi Album (chuyển thành Single)"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Lưu ý kéo thả */}
        {tracks.length > 1 && (
          <p className="text-[11px] text-neutral-500 text-center flex items-center justify-center gap-1.5">
            <GripVertical size={13} />
            Mẹo: Giữ và kéo thả biểu tượng dấu chấm bên trái để đổi vị trí bài hát trong album.
          </p>
        )}

        {/* ── FOOTER ACTIONS ── */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.05]">
          <span className="text-xs text-neutral-400">
            {tracks.length} bài hát • {album.albumType || "ALBUM"}
          </span>

          <div className="flex items-center gap-3">
            {hasOrderChanged && (
              <Button
                variant="primary"
                size="md"
                isLoading={reorderMutation.isPending}
                onClick={() => reorderMutation.mutate()}
                className="shadow-[0_4px_16px_rgba(250,45,72,0.35)]"
              >
                <Save size={15} /> Lưu thứ tự mới
              </Button>
            )}

            <Button variant="ghost" size="md" onClick={onClose}>
              Đóng
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default AlbumDetailModal;

