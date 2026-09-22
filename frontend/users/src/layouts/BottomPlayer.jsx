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
  Heart,
} from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { toast } from "sonner";

export const BottomPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, playNext, playPrevious } =
    usePlayerStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const audioRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  // Xử lý Play/Pause khi state isPlaying thay đổi
  useEffect(() => {
    if (!audioRef.current) return;
    
    // Đảm bảo audio load lại source mới khi bài hát thay đổi
    if (audioRef.current.src !== currentSong?.audioUrl) {
      audioRef.current.src = currentSong?.audioUrl;
      audioRef.current.load();
    }

    if (isPlaying) {
      audioRef.current.play().catch((e) => console.error("Lỗi phát nhạc:", e));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Cập nhật âm lượng
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Xử lý sự kiện từ Audio Element
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    // Tạm thời dừng phát hoặc gọi playNext
    setIsPlaying(false);
    // playNext();
  };

  // Tua nhạc (Seek)
  const handleSeek = (e) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleVolumeChange = (e) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    if (vol > 0) setIsMuted(false);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleLike = () => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này!", {
        description: "Bạn cần đăng nhập để thêm bài hát vào danh sách yêu thích.",
      });
      return;
    }
    // TODO: Gọi API thêm bài hát vào yêu thích
    toast.success("Đã thêm vào bài hát yêu thích!");
  };

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const volumePercent = isMuted ? 0 : volume * 100;

  return (
    <footer className="h-20 bg-spotify-black flex items-center justify-between px-4 z-50">
      {/* Thẻ audio ẩn xử lý luồng phát nhạc */}
      <audio
        key={currentSong.id || currentSong.audioUrl}
        ref={audioRef}
        src={currentSong.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      {/* 1. Thông tin bài hát (Bên trái) */}
      <div className="w-[30%] flex items-center gap-3">
        <img
          src={currentSong.coverUrl || currentSong.coverImage}
          alt="Cover"
          className="w-14 h-14 rounded-md object-cover"
        />
        <div className="hidden sm:block">
          <h4 className="text-sm font-bold text-white line-clamp-1 cursor-pointer hover:underline">
            {currentSong.title}
          </h4>
          <p className="text-xs text-spotify-sub line-clamp-1 cursor-pointer hover:underline hover:text-white">
            {currentSong.artist || currentSong.ownerName}
          </p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          iconOnly 
          className="ml-2 hover:bg-transparent text-spotify-sub hover:text-white" 
          tooltip="Lưu vào Thư viện" 
          tooltipPosition="top"
          onClick={handleLike}
        >
          <Heart size={18} />
        </Button>
      </div>

      {/* 2. Điều khiển trung tâm (Player Controls) */}
      <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-2">
        {/* Nút bấm */}
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip="Trộn bài"
            tooltipPosition="top"
          >
            <Shuffle size={18} />
          </Button>

          <Button
            onClick={playPrevious}
            variant="ghost"
            size="sm"
            iconOnly
            className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip="Trước"
            tooltipPosition="top"
          >
            <SkipBack size={20} fill="currentColor" />
          </Button>

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

          <Button
            variant="ghost"
            size="sm"
            iconOnly
            className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip="Lặp lại"
            tooltipPosition="top"
          >
            <Repeat size={18} />
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
                className="h-full bg-white group-hover:bg-spotify-primary rounded-full"
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

      {/* 3. Điều khiển Âm lượng (Bên phải) */}
      <div className="w-[30%] flex items-center justify-end gap-2 text-spotify-sub">
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
              className="h-full bg-white group-hover:bg-spotify-primary rounded-full"
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
  );
};
