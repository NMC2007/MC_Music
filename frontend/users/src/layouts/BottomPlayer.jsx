import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Shuffle,
  Repeat,
} from "lucide-react";
import { usePlayerStore } from "../store/usePlayerStore";
import { Button } from "../components/ui/Button";

export const BottomPlayer = () => {
  const { currentSong, isPlaying, setIsPlaying, playNext, playPrevious } =
    usePlayerStore();

  return (
    <footer className="h-20 bg-spotify-black flex items-center justify-between px-4 z-50">
      {/* 1. Thông tin bài hát (Bên trái) */}
      <div className="w-[30%] flex items-center gap-3">
        {currentSong ? (
          <>
            <img
              src={currentSong.coverUrl}
              alt="Cover"
              className="w-14 h-14 rounded-md object-cover"
            />
            <div className="hidden sm:block">
              <h4 className="text-sm font-bold text-white line-clamp-1 cursor-pointer hover:underline">
                {currentSong.title}
              </h4>
              <p className="text-xs text-spotify-sub line-clamp-1 cursor-pointer hover:underline hover:text-white">
                {currentSong.artist}
              </p>
            </div>
          </>
        ) : (
          <div className="text-xs text-spotify-sub">Chưa có bài hát nào</div>
        )}
      </div>

      {/* 2. Điều khiển trung tâm (Player Controls) */}
      <div className="flex-1 max-w-2xl flex flex-col items-center justify-center gap-2">
        {/* Nút bấm */}
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" iconOnly className="hover:bg-transparent text-spotify-sub hover:text-white" tooltip="Trộn bài" tooltipPosition="top">
            <Shuffle size={18} />
          </Button>

          <Button
            onClick={playPrevious}
            variant="ghost" size="sm" iconOnly className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip="Trước" tooltipPosition="top"
          >
            <SkipBack size={20} fill="currentColor" />
          </Button>

          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            variant="white" size="sm" iconOnly
            tooltip={isPlaying ? "Tạm dừng" : "Phát"} tooltipPosition="top"
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
            variant="ghost" size="sm" iconOnly className="hover:bg-transparent text-spotify-sub hover:text-white"
            tooltip="Tiếp" tooltipPosition="top"
          >
            <SkipForward size={20} fill="currentColor" />
          </Button>

          <Button variant="ghost" size="sm" iconOnly className="hover:bg-transparent text-spotify-sub hover:text-white" tooltip="Lặp lại" tooltipPosition="top">
            <Repeat size={18} />
          </Button>
        </div>

        {/* Thanh Progress */}
        <div className="w-full flex items-center gap-2 text-xs text-spotify-sub">
          <span>0:00</span>
          <div className="h-1 flex-1 bg-spotify-hover rounded-full overflow-hidden cursor-pointer group">
            <div className="w-1/3 h-full bg-white group-hover:bg-spotify-primary relative rounded-full"></div>
          </div>
          <span>3:45</span>
        </div>
      </div>

      {/* 3. Điều khiển Âm lượng (Bên phải) */}
      <div className="w-[30%] flex items-center justify-end gap-2 text-spotify-sub">
        <Button variant="ghost" size="sm" iconOnly className="hover:bg-transparent text-spotify-sub hover:text-white" tooltip="Âm lượng" tooltipPosition="top">
          <Volume2 size={20} />
        </Button>
        <div className="w-24 h-1 bg-spotify-hover rounded-full overflow-hidden cursor-pointer group">
          <div className="w-full h-full bg-white group-hover:bg-spotify-primary relative rounded-full"></div>
        </div>
      </div>
    </footer>
  );
};
