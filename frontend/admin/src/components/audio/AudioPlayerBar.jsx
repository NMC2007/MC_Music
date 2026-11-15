import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, AlertCircle, RotateCcw } from "lucide-react";
import { formatDuration } from "../../utils/formatters";

/**
 * AudioPlayerBar: Trình phát nhạc thẩm định chuyên dụng cho Quản trị viên
 * Hỗ trợ nghe trực tiếp URL từ Cloudinary với thanh tiến trình, điều chỉnh âm lượng và tua nhanh.
 */
export const AudioPlayerBar = ({
  src,
  title = "Bài hát",
  artist = "Nghệ sĩ",
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

  // Khi đổi bài hát, reset lại player ngay trong render-phase
  if (src !== prevSrc) {
    setPrevSrc(src);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasError(false);
  }

  // Nạp lại audio khi src thay đổi
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  // Dọn dẹp audio khi unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
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
          console.error("Lỗi khi phát audio bài hát:", err);
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

  const handleSeek = (e) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
      setIsMuted(newVol === 0);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.85;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleReplay = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
    if (!isPlaying) {
      togglePlay();
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl bg-[#1c1c1c] border border-white/[0.08] shadow-lg select-none ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setHasError(true)}
      />

      {/* Thông báo lỗi nếu link hỏng */}
      {hasError ? (
        <div className="flex items-center gap-2.5 text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-xs">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>
            Không thể tải tệp âm thanh kiểm duyệt. Vui lòng kiểm tra lại đường dẫn Cloudinary hoặc định dạng file.
          </span>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Thanh hiển thị thông tin bài hát đang nghe & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#fa2d48] uppercase tracking-wider block">
                Trình nghe thử thẩm định
              </span>
              <p className="text-sm font-bold text-white truncate">{title}</p>
              <p className="text-xs text-neutral-400 truncate">{artist}</p>
            </div>

            {/* Bộ điều khiển Play / Pause / Replay & Âm lượng */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReplay}
                className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="Phát lại từ đầu"
              >
                <RotateCcw size={15} />
              </button>

              <button
                type="button"
                onClick={togglePlay}
                disabled={!src}
                className="w-11 h-11 rounded-full bg-[#fa2d48] hover:bg-[#ff4b63] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(250,45,72,0.4)] transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title={isPlaying ? "Tạm dừng" : "Phát âm thanh"}
              >
                {isPlaying ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0.5" />
                )}
              </button>

              {/* Slider Âm lượng */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/[0.08]">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? "Bật âm thanh" : "Tắt tiếng"}
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#fa2d48]"
                  title="Âm lượng"
                />
              </div>
            </div>
          </div>

          {/* Thanh Tiến trình (Progress Scrubber) */}
          <div className="space-y-1">
            <div className="relative w-full flex items-center group">
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                disabled={!src || duration === 0}
                className="w-full h-2 bg-neutral-700 rounded-full appearance-none cursor-pointer accent-[#fa2d48] z-10 opacity-90 hover:opacity-100"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
              <span>{formatDuration(Math.floor(currentTime))}</span>
              <span className="text-neutral-500">
                {duration > 0 ? formatDuration(Math.floor(duration)) : "0:00"}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayerBar;
