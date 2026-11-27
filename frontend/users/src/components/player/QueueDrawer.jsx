import React, { memo, useState, useRef, useMemo } from "react";
import {
  X,
  GripVertical,
  Shuffle,
  Trash2,
  Play,
  Volume2,
  Sparkles,
  History,
  ListMusic,
  Loader2,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { usePlayerStore } from "../../store/usePlayerStore";
import { useAuthStore } from "../../store/useAuthStore";
import { getUserPlayHistoryApi } from "../../api/users/history";
import { getSongById } from "../../api/catalog/public";
import { CoverImage } from "../ui/CoverImage";
import { Button } from "../ui/Button";
import { BottomSheet } from "../ui/BottomSheet";
import { Z_INDEX } from "../../constants/layout";
import { useIsMobile } from "../../hooks/useIsMobile";

/**
 * Component hiển thị danh sách hàng đợi phát nhạc (Queue Drawer / BottomSheet)
 * - Mặc định cuộn xuống để xem danh sách chờ các bài.
 * - Hỗ trợ kéo thả đổi thứ tự bài chờ (trên Desktop), xóa bài có tự động bù bài.
 * - Lăn chuột lên trên (Wheel Up tại đỉnh trên Desktop) để chuyển nhanh sang Lịch sử các bài vừa nghe.
 * - Desktop: Drawer nổi góc phải đáy màn hình.
 * - Mobile: Tái sử dụng BottomSheet trượt mượt từ đáy lên (85dvh), touch targets to bản >= 44px.
 */
/**
 * Nội dung chi tiết Hàng đợi phát nhạc - chỉ mount khi isOpen = true để tránh chạy hooks/query thừa lúc đóng.
 */
const QueueDrawerContent = memo(({ onClose }) => {
  const isMobile = useIsMobile();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const queue = usePlayerStore((state) => state.queue);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const reorderQueue = usePlayerStore((state) => state.reorderQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const playQueueSong = usePlayerStore((state) => state.playQueueSong);
  const playHistorySong = usePlayerStore((state) => state.playHistorySong);
  const storeHistory = usePlayerStore((state) => state.history);

  const user = useAuthStore((state) => state.user);
  const userId = user?.userId || user?.id || null;
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [viewMode, setViewMode] = useState("queue"); // "queue" | "history"
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [loadingSongId, setLoadingSongId] = useState(null);

  const scrollContainerRef = useRef(null);

  // Lấy lịch sử nghe nhạc từ backend nếu user đã đăng nhập (cache 60s để mở lại tức thì)
  const { data: backendHistoryData } = useQuery({
    queryKey: ["userPlayHistory", userId, 5],
    queryFn: () => getUserPlayHistoryApi({ page: 0, size: 5 }),
    enabled: !!isAuthenticated && !!userId,
    staleTime: 1000 * 60,
  });

  // Hợp nhất lịch sử từ store (ngay tức thì trong phiên) và backend, lấy 5 bài gần nhất
  const recentHistory = useMemo(() => {
    const list = [];
    const seenIds = new Set();

    // 1. Ưu tiên bài vừa nghe trong phiên từ Zustand store
    (storeHistory || []).forEach((s) => {
      if (s && s.id && !seenIds.has(s.id)) {
        seenIds.add(s.id);
        list.push({
          id: s.id,
          songId: s.id,
          title: s.title,
          artist: s.artist || s.ownerName || s.artistName,
          coverUrl: s.coverUrl || s.coverImage,
          durationMs:
            s.durationMs || (s.durationSeconds ? s.durationSeconds * 1000 : 0),
          audioUrl: s.audioUrl,
          rawSong: s,
        });
      }
    });

    // 2. Bổ sung thêm từ backend (nếu có bài chưa xuất hiện trong store)
    const backendItems = backendHistoryData?.data?.content || [];
    backendItems.forEach((item) => {
      const sId = item.songId || item.id;
      if (sId && !seenIds.has(sId)) {
        seenIds.add(sId);
        list.push({
          id: item.id || sId,
          songId: sId,
          title: item.songTitle || item.title,
          artist: item.artistName || item.ownerName,
          coverUrl: item.coverImage || item.coverUrl,
          durationMs: (item.durationListened || 0) * 1000,
          audioUrl: item.audioUrl,
          rawSong: null,
        });
      }
    });

    return list.slice(0, 5);
  }, [storeHistory, backendHistoryData]);

  // Lắng nghe sự kiện lăn chuột để chuyển tab tự nhiên trên Desktop
  const handleWheel = (e) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // Khi ở 'queue' mà người dùng ở đỉnh (scrollTop <= 2) và lăn chuột lên (deltaY < -20)
    if (viewMode === "queue" && container.scrollTop <= 2 && e.deltaY < -20) {
      setViewMode("history");
    }
    // Khi ở 'history' mà người dùng lăn chuột xuống dưới (deltaY > 20)
    else if (viewMode === "history" && e.deltaY > 20) {
      setViewMode("queue");
    }
  };

  // Xử lý phát bài hát từ lịch sử
  const handlePlayHistorySong = async (item) => {
    if (item.rawSong && item.rawSong.audioUrl) {
      playHistorySong(item.rawSong);
      return;
    }

    try {
      setLoadingSongId(item.songId);
      const res = await getSongById(item.songId);
      const fullSong = res?.data;
      if (fullSong) {
        playHistorySong(fullSong);
      }
    } catch (err) {
      console.error("Lỗi khi tải bài hát từ lịch sử:", err);
    } finally {
      setLoadingSongId(null);
    }
  };

  // Xử lý kéo thả (HTML5 Native Drag & Drop trên Desktop)
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
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
    reorderQueue(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const formatDuration = (ms) => {
    if (!ms) return "--:--";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  // Cụm Tab chuyển đổi giữa Danh sách phát và Lịch sử
  const renderTabSwitcher = () => (
    <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-neutral-800/60">
      <Button
        type="button"
        variant={viewMode === "queue" ? "dark" : "ghost"}
        size="sm"
        onClick={() => setViewMode("queue")}
        className={`!h-8 px-2.5 text-xs font-bold transition-all ${
          viewMode === "queue"
            ? "!bg-[#252525] text-white shadow-sm"
            : "text-spotify-sub hover:text-white"
        }`}
      >
        <ListMusic size={14} />
        <span>Danh sách phát{queue.length > 0 ? ` (${queue.length})` : ""}</span>
      </Button>

      <Button
        type="button"
        variant={viewMode === "history" ? "dark" : "ghost"}
        size="sm"
        onClick={() => setViewMode("history")}
        className={`!h-8 px-2.5 text-xs font-bold transition-all ${
          viewMode === "history"
            ? "!bg-[#252525] text-white shadow-sm"
            : "text-spotify-sub hover:text-white"
        }`}
        tooltip="Lăn chuột lên trên để mở nhanh"
        tooltipPosition="bottom"
      >
        <History size={14} />
        <span>Lịch sử ({recentHistory.length})</span>
      </Button>
    </div>
  );

  // Nội dung cuộn chính của QueueDrawer
  const renderContent = (isMobile = false) => (
    <div
      ref={isMobile ? undefined : scrollContainerRef}
      className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3 space-y-4"
    >
      {/* ═══ VIEW 1: DANH SÁCH PHÁT (QUEUE) ═══ */}
      {viewMode === "queue" ? (
        <>
          {/* KHỐI 1: ĐANG PHÁT */}
          {currentSong && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-spotify-sub uppercase tracking-wider px-2">
                Đang phát
              </span>
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#202020] border border-neutral-700/60 shadow-sm">
                <div className="w-12 h-12 flex-shrink-0 relative rounded-lg overflow-hidden">
                  <CoverImage
                    src={currentSong.coverUrl || currentSong.coverImage}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Volume2
                      size={18}
                      className="text-[#fa2d48] animate-pulse"
                    />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-white truncate">
                    {currentSong.title}
                  </h5>
                  <p className="text-xs text-spotify-sub truncate mt-0.5">
                    {currentSong.artist ||
                      currentSong.ownerName ||
                      currentSong.artistName}
                  </p>
                </div>

                <span className="text-xs font-semibold text-[#fa2d48] px-2 py-0.5 rounded-full bg-[#fa2d48]/10 flex-shrink-0">
                  Playing
                </span>
              </div>
            </div>
          )}

          {/* KHỐI 2: TIẾP THEO TRONG HÀNG ĐỢI */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-spotify-sub uppercase tracking-wider">
                Tiếp theo trong hàng đợi
              </span>
              {isShuffle && (
                <span className="text-[11px] text-[#fa2d48] flex items-center gap-1 font-medium">
                  <Sparkles size={12} /> Đang trộn bài
                </span>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="py-8 text-center text-xs text-spotify-sub">
                Hàng đợi trống. Chọn thêm bài hát để tiếp tục phát.
              </div>
            ) : (
              <div className="space-y-1.5">
                {queue.map((song, index) => {
                  const isDragging = draggedIndex === index;
                  const isOver = dragOverIndex === index;

                  return (
                    <div
                      key={`${song.id}-${index}`}
                      draggable={!isMobile}
                      onDragStart={(e) => !isMobile && handleDragStart(e, index)}
                      onDragOver={(e) => !isMobile && handleDragOver(e, index)}
                      onDrop={(e) => !isMobile && handleDrop(e, index)}
                      onDragEnd={!isMobile ? handleDragEnd : undefined}
                      className={`flex items-center gap-2.5 p-2 rounded-xl transition-all select-none group min-h-[48px] ${
                        !isMobile ? "cursor-grab active:cursor-grabbing" : ""
                      } ${
                        isDragging
                          ? "opacity-30 scale-95 border-2 border-dashed border-[#fa2d48]"
                          : isOver
                          ? "border-t-2 border-[#fa2d48] bg-white/5"
                          : "bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.1] border border-transparent"
                      }`}
                    >
                      {/* Grip handle trên Desktop */}
                      {!isMobile && (
                        <div
                          className="text-neutral-500 hover:text-white flex items-center justify-center cursor-grab"
                          title="Kéo thả để sắp xếp"
                        >
                          <GripVertical size={16} />
                        </div>
                      )}

                      {/* Số thứ tự */}
                      <span className="text-xs text-neutral-400 font-medium w-4 text-center flex-shrink-0">
                        {index + 1}
                      </span>

                      {/* Ảnh bìa & Nút phát */}
                      <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative">
                        <CoverImage
                          src={song.coverUrl || song.coverImage}
                          alt={song.title}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => playQueueSong(song.id)}
                          aria-label={`Phát bài ${song.title}`}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white cursor-pointer"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      </div>

                      {/* Tiêu đề & Nghệ sĩ */}
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => playQueueSong(song.id)}
                      >
                        <div className="flex items-center gap-1.5">
                          <h6 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa2d48] transition-colors">
                            {song.title}
                          </h6>
                          {song.isUserQueued && (
                            <span className="text-[9px] font-bold text-[#fa2d48] bg-[#fa2d48]/15 px-1.5 py-0.5 rounded flex-shrink-0">
                              Đã thêm
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-spotify-sub truncate mt-0.5">
                          {song.artist || song.ownerName || song.artistName}
                        </p>
                      </div>

                      {/* Thời lượng */}
                      <span className="text-[11px] text-spotify-sub flex-shrink-0 tabular-nums">
                        {formatDuration(
                          song.durationMs ||
                            (song.durationSeconds
                              ? song.durationSeconds * 1000
                              : 0)
                        )}
                      </span>

                      {/* Nút xóa bài khỏi queue - Luôn hiện trên Mobile, hover trên Desktop */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        iconOnly
                        aria-label="Xóa khỏi hàng đợi"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(song.id);
                        }}
                        className="!w-8 !h-8 text-neutral-400 hover:text-[#fa2d48] hover:bg-[#fa2d48]/10 transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                        tooltip="Xóa khỏi hàng đợi"
                        tooltipPosition="left"
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* ═══ VIEW 2: LỊCH SỬ ĐÃ NGHE (5 BÀI GẦN NHẤT) ═══ */
        <div className="space-y-3 animate-in fade-in duration-200">
          {recentHistory.length === 0 ? (
            <div className="py-12 text-center text-xs text-spotify-sub flex flex-col items-center gap-2">
              <History size={24} className="text-neutral-600 mb-1" />
              <span>Chưa có lịch sử bài hát đã nghe.</span>
              <span className="text-[11px] text-neutral-500">
                Hãy thưởng thức các bài hát yêu thích!
              </span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {recentHistory.map((item, index) => {
                const isLoadingThis = loadingSongId === item.songId;

                return (
                  <div
                    key={`${item.id}-${index}`}
                    onClick={() => handlePlayHistorySong(item)}
                    className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] active:bg-white/[0.1] transition-all group cursor-pointer border border-transparent hover:border-neutral-700/60 min-h-[48px]"
                  >
                    {/* Số thứ tự */}
                    <span className="text-xs text-neutral-400 font-medium w-4 text-center flex-shrink-0">
                      {index + 1}
                    </span>

                    {/* Ảnh bìa & nút phát */}
                    <div className="w-11 h-11 rounded-lg overflow-hidden flex-shrink-0 relative">
                      <CoverImage
                        src={item.coverUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        {isLoadingThis ? (
                          <Loader2
                            size={14}
                            className="animate-spin text-[#fa2d48]"
                          />
                        ) : (
                          <Play size={14} fill="currentColor" />
                        )}
                      </div>
                    </div>

                    {/* Tên bài & Nghệ sĩ */}
                    <div className="flex-1 min-w-0">
                      <h6 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#fa2d48] transition-colors">
                        {item.title}
                      </h6>
                      <p className="text-[11px] text-spotify-sub truncate mt-0.5">
                        {item.artist || "MC Music"}
                      </p>
                    </div>

                    {/* Nút phát nhanh - Luôn hiện trên Mobile, hover trên Desktop */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      iconOnly
                      aria-label="Nghe lại bài này"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayHistorySong(item);
                      }}
                      className="!w-8 !h-8 text-neutral-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      tooltip="Nghe lại"
                      tooltipPosition="left"
                    >
                      {isLoadingThis ? (
                        <Loader2 size={13} className="animate-spin text-[#fa2d48]" />
                      ) : (
                        <Play size={13} fill="currentColor" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      /* ── GIAO DIỆN MOBILE (< 768px): BOTTOM SHEET ── */
      <BottomSheet
        isOpen
        onClose={onClose}
        heightClass="h-[85dvh] max-h-[85dvh]"
        showDragHandle
        showCloseButton
        zIndexClass={Z_INDEX.MODAL}
        ariaLabel="Hàng đợi phát nhạc"
        className="bg-[#141414] border-t border-neutral-800/80"
        headerLeft={renderTabSwitcher()}
        headerRight={
          viewMode === "queue" && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              aria-label={isShuffle ? "Tắt trộn bài" : "Bật trộn bài"}
              onClick={toggleShuffle}
              className={`!w-8 !h-8 transition-colors ${
                isShuffle
                  ? "!text-[#fa2d48] bg-[#fa2d48]/15 border border-[#fa2d48]/30"
                  : "text-spotify-sub hover:text-white"
              }`}
            >
              <Shuffle
                size={15}
                className={isShuffle ? "text-[#fa2d48]" : "currentColor"}
              />
            </Button>
          )
        }
      >
        {renderContent(true)}
      </BottomSheet>
    );
  }

  return (
    /* ── GIAO DIỆN DESKTOP (>= 768px): DRAWER FLOATING ── */
    <div
      className="fixed bottom-24 right-4 w-[380px] max-w-[calc(100vw-32px)] max-h-[580px] bg-[#141414]/95 backdrop-blur-md border border-neutral-800 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] z-50 flex flex-col overflow-hidden animate-popup-up"
      onWheel={handleWheel}
    >
      {/* Header Desktop */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-800/80 bg-neutral-900/50 flex-shrink-0">
        {renderTabSwitcher()}

        <div className="flex items-center gap-1.5">
          {/* Nút bật tắt trộn bài */}
          {viewMode === "queue" && (
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              onClick={toggleShuffle}
              className={`!w-8 !h-8 transition-colors ${
                isShuffle
                  ? "!text-[#fa2d48] hover:!text-[#ff4b63] bg-[#fa2d48]/15 border border-[#fa2d48]/30"
                  : "text-spotify-sub hover:text-white"
              }`}
              tooltip={
                isShuffle ? "Tắt trộn bài (về thứ tự gốc)" : "Trộn bài ngẫu nhiên"
              }
              tooltipPosition="bottom"
            >
              <Shuffle
                size={16}
                className={isShuffle ? "text-[#fa2d48]" : "currentColor"}
              />
            </Button>
          )}

          {/* Nút đóng */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconOnly
            onClick={onClose}
            aria-label="Đóng"
            className="text-neutral-400 hover:text-white hover:bg-white/10"
            tooltip="Đóng"
            tooltipPosition="bottom"
          >
            <X size={18} />
          </Button>
        </div>
      </div>

      {/* Nội dung Desktop */}
      {renderContent(false)}
    </div>
  );
});

QueueDrawerContent.displayName = "QueueDrawerContent";

export const QueueDrawer = memo(({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return <QueueDrawerContent onClose={onClose} />;
});

QueueDrawer.displayName = "QueueDrawer";
