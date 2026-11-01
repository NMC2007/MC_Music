import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Music, AlertCircle, X } from "lucide-react";

/**
 * Định dạng số giây thành chuỗi mm:ss
 */
const formatTime = (seconds) => {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * SimpleAudioPlayer: Trình nghe thử âm thanh mini, gọn nhẹ
 * - Dùng để nghe thử file MP3/WAV cục bộ trước khi upload
 * - Dùng để nghe thử nhanh các bài hát đã tải lên trong danh sách
 */
export const SimpleAudioPlayer = ({
  src,
  title = "Bản nghe thử",
  autoPlay = false,
  onClose,
  className = "",
}) => {
  const audioRef = useRef(null);
  const [prevSrc, setPrevSrc] = useState(src);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Đồng bộ lại trạng thái khi nguồn src thay đổi ngay trong render-phase
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
  }

  // Nạp lại audio element khi src thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      if (autoPlay && src) {
        audioRef.current
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  }, [src, autoPlay]);

  // Dọn dẹp khi unmount
  useEffect(() => {
    const currentAudio = audioRef.current;
    return () => {
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current || !src || hasError) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.error("Lỗi khi phát audio:", err);
          setHasError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
      setHasError(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleError = () => {
    setHasError(true);
    setIsPlaying(false);
  };

  const handleSeek = (e) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (audioRef.current) {
      audioRef.current.currentTime = targetTime;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) {
      audioRef.current.volume = val;
      audioRef.current.muted = val === 0;
    }
  };

  if (!src) return null;

  return (
    <div
      className={`bg-[#181818] rounded-xl p-3.5 transition-all shadow-lg ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />

      {hasError ? (
        <div className="flex items-center gap-2 text-rose-400 text-xs py-1">
          <AlertCircle size={16} />
          <span>Không thể phát tệp âm thanh này. Định dạng có thể không được hỗ trợ.</span>
          {onClose && (
            <button
              onClick={onClose}
              className="ml-auto text-neutral-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Header trình phát */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center flex-shrink-0">
                <Music size={14} />
              </div>
              <span className="text-xs font-semibold text-white truncate max-w-[220px] sm:max-w-xs">
                {title}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-spotify-sub font-mono">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Đóng"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Thanh Scrubber & Điều khiển */}
          <div className="flex items-center gap-3">
            {/* Nút Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-[#fa2d48] hover:bg-[#e0223e] text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-sm flex-shrink-0 cursor-pointer"
              title={isPlaying ? "Tạm dừng" : "Phát"}
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            {/* Thanh trượt thời gian */}
            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#fa2d48]"
              />
            </div>

            {/* Điều chỉnh âm lượng (ẩn khi compact trên màn hình nhỏ) */}
            <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? "Bật âm lượng" : "Tắt tiếng"}
              >
                {isMuted || volume === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#fa2d48]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleAudioPlayer;
