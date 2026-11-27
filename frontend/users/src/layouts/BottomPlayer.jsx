import React, { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart,
  ListMusic,
  Mic2,
} from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { QueueDrawer } from "../components/player/QueueDrawer";
import { LyricsModal } from "../components/player/LyricsModal";
import { MiniPlayer } from "../components/player/MiniPlayer";
import { MobileFullPlayer } from "../components/player/MobileFullPlayer";
import { TouchSlider } from "../components/ui/TouchSlider";
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";
import { MarqueeText } from "../components/ui/MarqueeText";
import { addPlayHistoryApi } from "../api/users/history";
import { useFavorites } from "../hooks/useFavorites";
import { useIsMobile } from "../hooks/useIsMobile";
import { useNavigate } from "react-router";
import { getSongById } from "../api/catalog/public";

const formatTime = (time) => {
  if (isNaN(time)) return "0:00";
  const minutes = Math.floor(time / 60);
  const seconds = Math.floor(time % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const BottomPlayer = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playNext = usePlayerStore((state) => state.playNext);
  const playPrevious = usePlayerStore((state) => state.playPrevious);
  const isShuffle = usePlayerStore((state) => state.isShuffle);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const repeatMode = usePlayerStore((state) => state.repeatMode);
  const toggleRepeatMode = usePlayerStore((state) => state.toggleRepeatMode);
  const queueLength = usePlayerStore((state) => state.queue.length);
  const setStoreCurrentTime = usePlayerStore((state) => state.setCurrentTime);
  const storeVolume = usePlayerStore((state) => state.volume);
  const setStoreVolume = usePlayerStore((state) => state.setVolume);

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  const audioRef = useRef(null);
  const recordedSongIdRef = useRef(null);
  const hasRestoredTimeRef = useRef(false);
  const initialSavedTime = usePlayerStore.getState().currentTime || 0;
  const lastStoreUpdateTimeRef = useRef(initialSavedTime);

  const [prevSongId, setPrevSongId] = useState(currentSong?.id);
  const [currentTime, setCurrentTime] = useState(initialSavedTime);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(storeVolume ?? 1);
  const [isMuted, setIsMuted] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  const handleCloseQueue = useCallback(() => setIsQueueOpen(false), []);
  const handleCloseLyrics = useCallback(() => setIsLyricsOpen(false), []);
  const handleCloseFullPlayer = useCallback(() => setIsFullPlayerOpen(false), []);

  const handleToggleLyrics = useCallback(() => {
    setIsLyricsOpen((prev) => {
      const next = !prev;
      if (next) setIsQueueOpen(false);
      return next;
    });
  }, []);

  const handleToggleQueue = useCallback(() => {
    setIsQueueOpen((prev) => {
      const next = !prev;
      if (next) setIsLyricsOpen(false);
      return next;
    });
  }, []);

  const handleOpenLyricsFromMobile = useCallback(() => {
    setIsLyricsOpen(true);
    setIsQueueOpen(false);
  }, []);

  const handleOpenQueueFromMobile = useCallback(() => {
    setIsQueueOpen(true);
    setIsLyricsOpen(false);
  }, []);

  // Đồng bộ lại state khi chuyển bài hát mới ngay trong render-phase
  if (currentSong?.id !== prevSongId) {
    setPrevSongId(currentSong?.id);
    setCurrentTime(0);
    setAudioDuration(0);
  }

  // Reset các ref theo dõi khi đổi bài hát
  useEffect(() => {
    hasRestoredTimeRef.current = false;
    lastStoreUpdateTimeRef.current = 0;
    recordedSongIdRef.current = null;
  }, [currentSong?.id]);

  const duration = audioDuration || currentSong?.duration || 0;

  // Khôi phục vị trí phát (currentTime) từ trạng thái đã lưu
  const restoreAudioTime = () => {
    const savedTime = usePlayerStore.getState().currentTime || 0;
    if (!hasRestoredTimeRef.current && savedTime > 0 && audioRef.current) {
      try {
        audioRef.current.currentTime = savedTime;
        hasRestoredTimeRef.current = true;
      } catch (err) {
        console.warn("Chưa thể tua audio ngay lúc này:", err);
      }
    }
  };

  // Ghi nhận lượt nghe và lưu lịch sử bài hát (chạy âm thầm cho user đã đăng nhập)
  const recordHistory = async (listenedSeconds) => {
    if (!isAuthenticated || !currentSong?.id) return;
    if (recordedSongIdRef.current === currentSong.id) return;

    recordedSongIdRef.current = currentSong.id;
    try {
      await addPlayHistoryApi({
        songId: currentSong.id,
        durationListened: Math.max(1, Math.floor(listenedSeconds || 0)),
      });
    } catch (err) {
      console.warn("Lỗi ghi nhận lịch sử nghe nhạc:", err);
    }
  };

  // Lưu chính xác currentTime vào store khi người dùng reload trang hoặc đóng tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (audioRef.current && audioRef.current.currentTime > 0) {
        setStoreCurrentTime(audioRef.current.currentTime);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [setStoreCurrentTime]);

  // Xử lý Play/Pause khi state isPlaying hoặc bài hát thay đổi
  useEffect(() => {
    if (!audioRef.current) return;

    // Đảm bảo audio load lại source mới khi bài hát thay đổi
    if (audioRef.current.src !== currentSong?.audioUrl) {
      audioRef.current.src = currentSong?.audioUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      const savedTime = usePlayerStore.getState().currentTime || 0;
      if (!hasRestoredTimeRef.current && savedTime > 0) {
        try {
          audioRef.current.currentTime = savedTime;
          hasRestoredTimeRef.current = true;
        } catch {
          // ignore
        }
      }
      audioRef.current.play().catch((e) => console.error("Lỗi phát nhạc:", e));
    } else {
      audioRef.current.pause();
      if (audioRef.current.currentTime > 0) {
        setStoreCurrentTime(audioRef.current.currentTime);
      }
    }
  }, [isPlaying, currentSong, setStoreCurrentTime]);

  // Cập nhật âm lượng
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Xử lý sự kiện từ Audio Element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      setCurrentTime(cur);

      // Throttled lưu vị trí vào store mỗi 2 giây
      if (Math.abs(cur - lastStoreUpdateTimeRef.current) >= 2) {
        lastStoreUpdateTimeRef.current = cur;
        setStoreCurrentTime(cur);
      }

      // Tự động ghi nhận lượt nghe khi bài hát phát được từ 15 giây trở lên
      if (cur >= 15 && recordedSongIdRef.current !== currentSong?.id) {
        recordHistory(cur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setAudioDuration(audioRef.current.duration);
      restoreAudioTime();
    }
  };

  const handleCanPlay = () => {
    restoreAudioTime();
  };

  // Tự động chuyển bài khi kết thúc
  const handleEnded = () => {
    // Ghi nhận lượt nghe lúc kết thúc nếu bài ngắn hơn 15s hoặc chưa kịp ghi nhận
    if (recordedSongIdRef.current !== currentSong?.id) {
      recordHistory(audioRef.current ? audioRef.current.currentTime : duration);
    }

    setStoreCurrentTime(0);

    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        setCurrentTime(0);
        audioRef.current.play().catch((e) => console.error("Lỗi phát lại:", e));
      }
    } else {
      playNext();
    }
  };

  // Lùi bài hát (Kiểm tra đăng nhập và replay nếu > 3s)
  const handlePrevious = useCallback(() => {
    const res = playPrevious(audioRef.current ? audioRef.current.currentTime : 0);
    if (res === "replay" && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setStoreCurrentTime(0);
      audioRef.current.play().catch((e) => console.error("Lỗi phát nhạc:", e));
    }
  }, [playPrevious, setStoreCurrentTime]);

  // Tua nhạc (Seek)
  const handleSeek = useCallback((e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    lastStoreUpdateTimeRef.current = time;
    setStoreCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  }, [setStoreCurrentTime]);

  const handleVolumeChange = useCallback((e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setStoreVolume(vol);
    if (vol > 0) setIsMuted(false);
  }, [setStoreVolume]);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying, setIsPlaying]);

  const handleToggleLike = useCallback(() => {
    if (currentSong) {
      toggleFavoriteSong(currentSong);
    }
  }, [toggleFavoriteSong, currentSong]);

  const handleExpandFullPlayer = useCallback(() => {
    setIsFullPlayerOpen(true);
  }, []);

  const handleSongClick = useCallback((e) => {
    e?.stopPropagation?.();
    const songId = currentSong?.id || currentSong?.songId;
    if (songId) {
      navigate(`/song/${songId}`);
    }
  }, [currentSong, navigate]);

  const handleArtistClick = useCallback(async (e) => {
    e?.stopPropagation?.();
    let artistId = currentSong?.ownerId || currentSong?.artistId;
    if (!artistId && (currentSong?.id || currentSong?.songId)) {
      try {
        const res = await getSongById(currentSong.id || currentSong.songId);
        artistId = res?.data?.ownerId;
      } catch (err) {
        console.error("Lỗi lấy thông tin nghệ sĩ:", err);
      }
    }
    if (artistId) {
      navigate(`/artist/${artistId}`);
    }
  }, [currentSong, navigate]);

  if (!currentSong) return null;

  const isLiked = isFavoriteSong(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      {/* Thẻ audio ẩn xử lý luồng phát nhạc (độc lập khỏi UI Desktop/Mobile để không ngắt nhạc khi đổi kích thước màn hình) */}
      <audio
        key={currentSong.id || currentSong.audioUrl}
        ref={audioRef}
        src={currentSong.audioUrl}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onCanPlay={handleCanPlay}
        onEnded={handleEnded}
      />

      {/* Giao diện Desktop & Tablet (>= 768px) */}
      <footer className="hidden md:flex h-20 bg-spotify-black border-t border-neutral-900 items-center justify-between px-4 z-50 relative">
        {/* 1. Thông tin bài hát (Bên trái) - Kích thước cố định & tự động cuộn ngang khi tên dài */}
        <div className="w-[28%] min-w-[160px] lg:min-w-[200px] max-w-[320px] flex items-center gap-3 z-10">
          <img
            src={currentSong.coverUrl || currentSong.coverImage}
            alt="Cover"
            onClick={handleSongClick}
            className="w-14 h-14 rounded-md object-cover shadow-sm flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            title={`Xem chi tiết bài hát: ${currentSong.title}`}
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
            <MarqueeText
              as="h4"
              text={currentSong.title || "Chưa có bài hát"}
              onClick={handleSongClick}
              className="text-sm font-bold text-white cursor-pointer hover:underline"
              title={`Xem chi tiết bài hát: ${currentSong.title}`}
            />
            <MarqueeText
              as="p"
              text={currentSong.artist || currentSong.ownerName || currentSong.artistName || "Nghệ sĩ"}
              onClick={handleArtistClick}
              className="text-xs text-spotify-sub cursor-pointer hover:underline hover:text-white mt-0.5 transition-colors"
              title={`Xem trang nghệ sĩ: ${currentSong.artist || currentSong.ownerName || currentSong.artistName}`}
            />
          </div>

          <div className="flex items-center flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              iconOnly
              className={`hover:bg-transparent transition-all duration-200 ${
                isLiked
                  ? "!text-[#fa2d48] hover:!text-[#ff4b63] scale-105"
                  : "text-spotify-sub hover:text-white"
              }`}
              tooltip={isLiked ? "Xóa khỏi Thư viện" : "Lưu vào Thư viện"}
              tooltipPosition="top"
              onClick={() => toggleFavoriteSong(currentSong)}
            >
              <Heart
                size={18}
                className={isLiked ? "fill-[#fa2d48] text-[#fa2d48]" : "currentColor"}
              />
            </Button>

            {/* Nút thêm vào Playlist */}
            <AddToPlaylistMenu
              song={currentSong}
              align="top-right"
              className="ml-0.5"
            />
          </div>
        </div>

        {/* 2. Điều khiển trung tâm (Player Controls) - Căn chính xác tuyệt đối giữa màn hình */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full md:max-w-[340px] lg:max-w-lg xl:max-w-2xl px-4 flex flex-col items-center justify-center gap-1.5 pointer-events-none [&>*]:pointer-events-auto">
          {/* Nút bấm */}
          <div className="flex items-center gap-6">
            {/* Nút Trộn bài (Smart Shuffle) */}
            <Button
              onClick={toggleShuffle}
              variant="ghost"
              size="sm"
              iconOnly
              className={`hover:bg-transparent relative transition-all ${
                isShuffle
                  ? "!text-[#fa2d48] hover:!text-[#ff4b63]"
                  : "text-spotify-sub hover:text-white"
              }`}
              tooltip={isShuffle ? "Tắt trộn bài (về thứ tự gốc)" : "Trộn bài"}
              tooltipPosition="top"
            >
              <Shuffle
                size={18}
                className={isShuffle ? "text-[#fa2d48]" : "currentColor"}
              />
              {isShuffle && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full shadow-[0_0_8px_rgba(250,45,72,0.8)]" />
              )}
            </Button>

            {/* Nút Trước (SkipBack - Yêu cầu login) */}
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="sm"
              iconOnly
              className="hover:bg-transparent text-spotify-sub hover:text-white"
              tooltip="Trước"
              tooltipPosition="top"
            >
              <SkipBack size={20} fill="currentColor" />
            </Button>

            {/* Nút Play/Pause chính */}
            <Button
              onClick={() => setIsPlaying(!isPlaying)}
              variant="white"
              size="sm"
              iconOnly
              tooltip={isPlaying ? "Tạm dừng" : "Phát"}
              tooltipPosition="top"
            >
              {isPlaying ? (
                <Pause size={18} fill="currentColor" strokeWidth={0} />
              ) : (
                <Play
                  size={18}
                  fill="currentColor"
                  strokeWidth={0}
                  className="translate-x-[2px]"
                />
              )}
            </Button>

            {/* Nút Tiếp (SkipForward) */}
            <Button
              onClick={playNext}
              variant="ghost"
              size="sm"
              iconOnly
              className="hover:bg-transparent text-spotify-sub hover:text-white"
              tooltip="Tiếp"
              tooltipPosition="top"
            >
              <SkipForward size={20} fill="currentColor" />
            </Button>

            {/* Nút Lặp lại (Repeat Mode) */}
            <Button
              onClick={toggleRepeatMode}
              variant="ghost"
              size="sm"
              iconOnly
              className={`hover:bg-transparent relative transition-all ${
                repeatMode !== "off"
                  ? "!text-[#fa2d48] hover:!text-[#ff4b63]"
                  : "text-spotify-sub hover:text-white"
              }`}
              tooltip={
                repeatMode === "one"
                  ? "Lặp 1 bài"
                  : repeatMode === "all"
                  ? "Lặp danh sách"
                  : "Bật lặp lại"
              }
              tooltipPosition="top"
            >
              {repeatMode === "one" ? (
                <Repeat1 size={18} className="text-[#fa2d48]" />
              ) : (
                <Repeat
                  size={18}
                  className={repeatMode === "all" ? "text-[#fa2d48]" : "currentColor"}
                />
              )}
              {repeatMode !== "off" && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full shadow-[0_0_8px_rgba(250,45,72,0.8)]" />
              )}
            </Button>
          </div>

          {/* Thanh Progress (Tua bài hát) */}
          <div className="w-full flex items-center gap-2 text-xs text-spotify-sub">
            <span className="w-10 text-right tabular-nums">{formatTime(currentTime)}</span>
            <TouchSlider
              value={currentTime}
              min={0}
              max={duration || 100}
              onChange={handleSeek}
              hitAreaClass="py-1.5"
              ariaLabel="Tua thời gian bài hát"
            />
            <span className="w-10 tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 3. Điều khiển Hàng đợi, Lời bài hát & Âm lượng (Bên phải) */}
        <div className="w-[28%] min-w-[160px] lg:min-w-[200px] max-w-[320px] flex items-center justify-end gap-2 lg:gap-3 text-spotify-sub z-10">
          {/* Nút Lời bài hát (Lyrics Modal) */}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={`hover:bg-transparent relative transition-colors ${
              isLyricsOpen
                ? "!text-[#fa2d48] hover:!text-[#ff4b63]"
                : "text-spotify-sub hover:text-white"
            }`}
            tooltip="Lời bài hát"
            tooltipPosition="top"
            onClick={handleToggleLyrics}
          >
            <Mic2 size={20} className={isLyricsOpen ? "text-[#fa2d48]" : "currentColor"} />
            {isLyricsOpen && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#fa2d48] rounded-full shadow-[0_0_8px_rgba(250,45,72,0.8)]" />
            )}
          </Button>

          {/* Nút Danh sách phát (Queue Drawer) */}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className={`hover:bg-transparent relative transition-colors ${
              isQueueOpen
                ? "!text-[#fa2d48] hover:!text-[#ff4b63]"
                : "text-spotify-sub hover:text-white"
            }`}
            tooltip="Danh sách chờ phát"
            tooltipPosition="top"
            onClick={handleToggleQueue}
          >
            <ListMusic size={20} />
            {queueLength > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#fa2d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {queueLength}
              </span>
            )}
          </Button>

          {/* Nút Tắt/Mở âm lượng */}
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip={isMuted || volume === 0 ? "Bật âm" : "Tắt âm"}
            tooltipPosition="top"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </Button>

          {/* Thanh Slider Âm lượng */}
          <div className="hidden lg:flex w-24 items-center">
            <TouchSlider
              value={isMuted ? 0 : volume}
              min={0}
              max={1}
              step={0.01}
              onChange={handleVolumeChange}
              hitAreaClass="py-1.5"
              ariaLabel="Điều chỉnh âm lượng"
            />
          </div>
        </div>
      </footer>

      {/* Giao diện Mobile MiniPlayer (< 768px) */}
      {isMobile && (
        <MiniPlayer
          currentSong={currentSong}
          isPlaying={isPlaying}
          isLiked={isLiked}
          progressPercent={progressPercent}
          onTogglePlay={handleTogglePlay}
          onToggleLike={handleToggleLike}
          onExpand={handleExpandFullPlayer}
        />
      )}

      {/* Trình phát toàn màn hình cho Mobile (< 768px) */}
      {isMobile && isFullPlayerOpen && (
        <MobileFullPlayer
          isOpen={true}
          onClose={handleCloseFullPlayer}
          currentSong={currentSong}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onNext={playNext}
          onPrevious={handlePrevious}
          isShuffle={isShuffle}
          onToggleShuffle={toggleShuffle}
          repeatMode={repeatMode}
          onToggleRepeat={toggleRepeatMode}
          currentTime={currentTime}
          duration={duration}
          onSeek={handleSeek}
          formatTime={formatTime}
          isLiked={isLiked}
          onToggleLike={handleToggleLike}
          queueCount={queueLength}
          isLyricsOpen={isLyricsOpen}
          isQueueOpen={isQueueOpen}
          onOpenLyrics={handleOpenLyricsFromMobile}
          onOpenQueue={handleOpenQueueFromMobile}
          onSongClick={handleSongClick}
          onArtistClick={handleArtistClick}
        />
      )}

      {/* Drawer xem trước hàng đợi (Queue Drawer) */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={handleCloseQueue}
      />

      {/* Modal xem Lời bài hát (Lyrics Modal) */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={handleCloseLyrics}
        currentSong={currentSong}
      />
    </>
  );
};
