import React, { useRef, useState, useEffect } from "react";
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
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";
import { MarqueeText } from "../components/ui/MarqueeText";
import { addPlayHistoryApi } from "../api/users/history";
import { useFavorites } from "../hooks/useFavorites";

export const BottomPlayer = () => {
  const {
    currentSong,
    isPlaying,
    setIsPlaying,
    playNext,
    playPrevious,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeatMode,
    queue,
    currentTime: savedCurrentTime,
    setCurrentTime: setStoreCurrentTime,
    volume: storeVolume,
    setVolume: setStoreVolume,
  } = usePlayerStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  const audioRef = useRef(null);
  const recordedSongIdRef = useRef(null);
  const hasRestoredTimeRef = useRef(false);
  const lastStoreUpdateTimeRef = useRef(savedCurrentTime || 0);

  const [prevSongId, setPrevSongId] = useState(currentSong?.id);
  const [currentTime, setCurrentTime] = useState(savedCurrentTime || 0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [volume, setVolume] = useState(storeVolume ?? 1);
  const [isMuted, setIsMuted] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);

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
    if (!hasRestoredTimeRef.current && savedCurrentTime > 0 && audioRef.current) {
      try {
        audioRef.current.currentTime = savedCurrentTime;
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

  // Xử lý Play/Pause khi state isPlaying thay đổi
  useEffect(() => {
    if (!audioRef.current) return;

    // Đảm bảo audio load lại source mới khi bài hát thay đổi
    if (audioRef.current.src !== currentSong?.audioUrl) {
      audioRef.current.src = currentSong?.audioUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      if (!hasRestoredTimeRef.current && savedCurrentTime > 0) {
        try {
          audioRef.current.currentTime = savedCurrentTime;
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
  }, [isPlaying, currentSong, savedCurrentTime, setStoreCurrentTime]);

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
  const handlePrevious = () => {
    const res = playPrevious(audioRef.current ? audioRef.current.currentTime : 0);
    if (res === "replay" && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setStoreCurrentTime(0);
      audioRef.current.play().catch((e) => console.error("Lỗi phát nhạc:", e));
    }
  };

  // Tua nhạc (Seek)
  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    lastStoreUpdateTimeRef.current = time;
    setStoreCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setStoreVolume(vol);
    if (vol > 0) setIsMuted(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!currentSong) return null;

  const isLiked = isFavoriteSong(currentSong.id);
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <>
      <footer className="h-20 bg-spotify-black border-t border-neutral-900 flex items-center justify-between px-4 z-50 relative">
        {/* Thẻ audio ẩn xử lý luồng phát nhạc */}
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

        {/* 1. Thông tin bài hát (Bên trái) - Kích thước cố định & tự động cuộn ngang khi tên dài */}
        <div className="w-[30%] min-w-[200px] max-w-[320px] flex items-center gap-3 z-10">
          <img
            src={currentSong.coverUrl || currentSong.coverImage}
            alt="Cover"
            className="w-14 h-14 rounded-md object-cover shadow-sm flex-shrink-0"
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center overflow-hidden">
            <MarqueeText
              as="h4"
              text={currentSong.title || "Chưa có bài hát"}
              className="text-sm font-bold text-white cursor-pointer hover:underline"
            />
            <MarqueeText
              as="p"
              text={currentSong.artist || currentSong.ownerName || currentSong.artistName || "Nghệ sĩ"}
              className="text-xs text-spotify-sub cursor-pointer hover:underline hover:text-white mt-0.5"
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
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[420px] sm:max-w-lg md:max-w-xl lg:max-w-2xl px-4 flex flex-col items-center justify-center gap-1.5 pointer-events-none [&>*]:pointer-events-auto">
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
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="flex-1 flex items-center group relative h-1">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              {/* Thanh hiển thị (Background xám) */}
              <div className="w-full h-1 bg-spotify-hover rounded-full overflow-hidden">
                {/* Phần đã phát (Màu trắng -> Xanh khi hover) */}
                <div
                  className="h-full bg-white group-hover:bg-[#fa2d48] rounded-full transition-colors"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
              {/* Nút kéo (Thumb) ẩn, chỉ hiện khi hover */}
              <div
                className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transform -translate-x-1/2 pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              ></div>
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* 3. Điều khiển Hàng đợi, Lời bài hát & Âm lượng (Bên phải) */}
        <div className="w-[30%] min-w-[200px] max-w-[320px] flex items-center justify-end gap-3 text-spotify-sub z-10">
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
            onClick={() => {
              setIsLyricsOpen(!isLyricsOpen);
              if (!isLyricsOpen) setIsQueueOpen(false);
            }}
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
            onClick={() => {
              setIsQueueOpen(!isQueueOpen);
              if (!isQueueOpen) setIsLyricsOpen(false);
            }}
          >
            <ListMusic size={20} />
            {queue.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#fa2d48] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {queue.length}
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
          <div className="w-24 flex items-center group relative h-1">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            {/* Thanh background âm lượng */}
            <div className="w-full h-1 bg-spotify-hover rounded-full overflow-hidden">
              <div
                className="h-full bg-white group-hover:bg-[#fa2d48] rounded-full transition-colors"
                style={{ width: `${volumePercent}%` }}
              ></div>
            </div>
            <div
              className="absolute h-3 w-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-md transform -translate-x-1/2 pointer-events-none"
              style={{ left: `${volumePercent}%` }}
            ></div>
          </div>
        </div>
      </footer>

      {/* Drawer xem trước hàng đợi (Queue Drawer) */}
      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
      />

      {/* Modal xem Lời bài hát (Lyrics Modal) */}
      <LyricsModal
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        currentSong={currentSong}
      />
    </>
  );
};
