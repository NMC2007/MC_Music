import React, { useState, useMemo } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Play,
  Pause,
  Shuffle,
  Clock,
  Search,
  ListMusic,
  Trash2,
  Globe,
  Lock,
  Music2,
  Calendar,
  Loader2,
} from "lucide-react";

import { getPlaylistSongsApi } from "../api/users/playlists";
import { getSongById } from "../api/catalog/public";
import { usePlaylists } from "../hooks/usePlaylists";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { useAuthStore } from "../store/useAuthStore";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow } from "../components/ui/Skeleton";
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";

export const PlaylistPage = () => {
  const { id: playlistId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const { playlists, removeSongFromPlaylist } = usePlaylists();
  const { user } = useAuthStore();
  const { currentSong, isPlaying, setIsPlaying, playSongWithContext } =
    usePlayerStore();
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSongId, setLoadingSongId] = useState(null);

  // 1. Tìm thông tin Playlist: Ưu tiên state từ router -> sau đó tìm trong danh sách cache
  const statePlaylist = location.state?.playlist;
  const playlist = useMemo(() => {
    if (statePlaylist && statePlaylist.id === playlistId) {
      return statePlaylist;
    }
    return playlists.find((p) => p.id === playlistId) || statePlaylist || null;
  }, [statePlaylist, playlists, playlistId]);

  // 2. Fetch danh sách bài hát trong Playlist
  const {
    data: songsData,
    isLoading: isLoadingSongs,
    isError,
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

  // 4. Định dạng ngày thêm vào playlist
  const formatAddedDate = (dateString) => {
    if (!dateString) return "Gần đây";
    try {
      const d = new Date(dateString);
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day} thg ${month}, ${year}`;
    } catch {
      return "Gần đây";
    }
  };

  // 5. Kiểm tra trạng thái playlist đang phát
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
  const handlePlaySong = async (item, index) => {
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
  };

  // 9. Gỡ bài hát khỏi Playlist
  const handleRemoveSong = async (songItem) => {
    const songId = songItem.songId || songItem.id;
    if (!songId || !playlistId) return;
    try {
      await removeSongFromPlaylist({ playlistId, songId });
    } catch (err) {
      console.error("Lỗi xóa bài khỏi playlist:", err);
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-16">
      {/* ── HEADER BANNER ─────────────────────────────────────────────────── */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-6 px-6 pt-16 pb-8 bg-gradient-to-b from-[#1e3a5f] via-[#101b2b] to-spotify-black">
        {/* Ảnh bìa Playlist lớn */}
        <div className="flex-shrink-0 w-44 h-44 sm:w-52 sm:h-52 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center border border-white/5">
          {playlist?.coverImage ? (
            <CoverImage
              src={playlist.coverImage}
              alt={playlist.name || "Playlist Cover"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-neutral-400 gap-2">
              <ListMusic size={64} className="text-[#fa2d48] opacity-80" />
            </div>
          )}
        </div>

        {/* Thông tin Playlist */}
        <div className="flex flex-col gap-2 pb-2 text-center sm:text-left min-w-0 flex-1">
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

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-tight tracking-tight line-clamp-2">
            {playlist?.name || "Danh sách phát"}
          </h1>

          {playlist?.description && (
            <p className="text-sm text-neutral-300 line-clamp-2 max-w-2xl mt-1">
              {playlist.description}
            </p>
          )}

          <div className="flex items-center justify-center sm:justify-start gap-2 mt-2 flex-wrap text-sm text-spotify-sub">
            <span className="font-bold text-white">
              {user?.fullName || "Tôi"}
            </span>
            <span>•</span>
            <span>{rawSongs.length} bài hát</span>
          </div>
        </div>
      </div>

      {/* ── ACTION BAR ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-gradient-to-b from-[#101b2b]/40 to-transparent">
        {/* Nút Play chính & Trộn bài */}
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button
            onClick={handlePlayAll}
            disabled={rawSongs.length === 0}
            className="w-14 h-14 rounded-full bg-[#fa2d48] hover:bg-[#e0223e] flex items-center justify-center shadow-[0_8px_20px_rgba(250,45,72,0.4)] transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer"
            title={isPlaylistPlaying ? "Tạm dừng" : "Phát tất cả"}
          >
            {isPlaylistPlaying ? (
              <Pause size={24} fill="white" className="text-white" />
            ) : (
              <Play size={24} fill="white" className="text-white ml-1" />
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
            <Shuffle size={22} />
          </Button>
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
      <div className="px-6 flex-1">
        {/* Header bảng */}
        <div className="grid grid-cols-[16px_1fr_120px_40px_80px] sm:grid-cols-[24px_1fr_160px_40px_80px] gap-4 px-4 py-2.5 mb-2 border-b border-neutral-800 text-xs font-semibold text-spotify-sub uppercase tracking-wider select-none">
          <div className="text-right">#</div>
          <div>Tiêu đề</div>
          <div className="hidden sm:flex items-center gap-1.5">
            <Calendar size={13} />
            <span>Ngày thêm</span>
          </div>
          <div /> {/* Chỗ cho nút like */}
          <div className="flex items-center justify-end gap-1">
            <Clock size={13} />
          </div>
        </div>

        {/* Danh sách các dòng bài hát */}
        {isLoadingSongs ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <SkeletonRow key={idx} />
            ))}
          </div>
        ) : filteredSongs.length > 0 ? (
          <div className="flex flex-col">
            {filteredSongs.map((song, idx) => {
              const isCurrent = currentSong?.id === song.songId;
              const isSongLiked = isFavoriteSong(song.songId);
              const isLoadingThis = loadingSongId === song.songId;

              return (
                <div
                  key={`${song.songId}-${idx}`}
                  onClick={() => handlePlaySong(song, idx)}
                  className={`grid grid-cols-[16px_1fr_120px_40px_80px] sm:grid-cols-[24px_1fr_160px_40px_80px] gap-4 items-center px-4 py-2.5 rounded-lg transition-colors group cursor-pointer ${
                    isCurrent ? "bg-[#282828]" : "hover:bg-[#1a1a1a]"
                  }`}
                >
                  {/* STT / Nút Play */}
                  <div className="text-right flex justify-end items-center">
                    {isLoadingThis ? (
                      <Loader2
                        size={14}
                        className="animate-spin text-[#fa2d48]"
                      />
                    ) : (
                      <>
                        <span
                          className={`text-sm group-hover:hidden ${
                            isCurrent
                              ? "text-[#fa2d48] font-bold"
                              : "text-spotify-sub"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <Play
                          size={14}
                          fill="currentColor"
                          className="hidden group-hover:block text-white"
                        />
                      </>
                    )}
                  </div>

                  {/* Thumbnail + Tiêu đề + Nghệ sĩ */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-md overflow-hidden flex-shrink-0 bg-neutral-800 shadow-sm">
                      <CoverImage
                        src={song.coverImage}
                        alt={song.songTitle}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <span
                        className={`text-sm font-medium truncate ${
                          isCurrent
                            ? "text-[#fa2d48] font-bold"
                            : "text-white group-hover:text-white"
                        }`}
                      >
                        {song.songTitle}
                      </span>
                      <span className="text-xs text-spotify-sub group-hover:text-white transition-colors truncate">
                        {song.artistName}
                      </span>
                    </div>
                  </div>

                  {/* Ngày thêm vào */}
                  <div className="hidden sm:block text-xs text-spotify-sub truncate">
                    {formatAddedDate(song.addedAt)}
                  </div>

                  {/* Nút Thả tim */}
                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavoriteSong({
                          id: song.songId,
                          songId: song.songId,
                          title: song.songTitle,
                          artistName: song.artistName,
                          coverImage: song.coverImage,
                        });
                      }}
                      className={`p-1.5 rounded-full hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                        isSongLiked
                          ? "text-[#fa2d48]"
                          : "text-spotify-sub hover:text-white opacity-0 group-hover:opacity-100"
                      }`}
                      title={
                        isSongLiked
                          ? "Xóa khỏi Bài hát đã thích"
                          : "Thêm vào Bài hát đã thích"
                      }
                    >
                      <span className="sr-only">Like</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="18"
                        height="18"
                        fill={isSongLiked ? "#fa2d48" : "none"}
                        stroke={isSongLiked ? "#fa2d48" : "currentColor"}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                      </svg>
                    </button>
                  </div>

                  {/* Thao tác (Xóa khỏi playlist & Tùy chọn khác) */}
                  <div className="flex items-center justify-end gap-1 text-spotify-sub">
                    {/* Nút xóa nhanh khỏi playlist */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveSong(song);
                      }}
                      className="p-1.5 rounded-full text-spotify-sub hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      title="Xóa bài hát khỏi playlist này"
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* Menu ngữ cảnh đầy đủ */}
                    <AddToPlaylistMenu
                      song={{
                        id: song.songId,
                        songId: song.songId,
                        title: song.songTitle,
                        artistName: song.artistName,
                        coverImage: song.coverImage,
                      }}
                      currentPlaylistId={playlistId}
                      onRemove={handleRemoveSong}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : rawSongs.length === 0 ? (
          // Trạng thái Playlist rỗng
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#fa2d48] shadow-inner">
              <Music2 size={36} />
            </div>
            <div className="flex flex-col gap-1.5 max-w-md">
              <h3 className="text-xl font-bold text-white">
                Danh sách phát này chưa có bài hát nào
              </h3>
              <p className="text-sm text-spotify-sub leading-relaxed">
                Khám phá các bài hát bạn yêu thích từ Trang chủ, Album hay Nghệ sĩ
                và bấm vào nút <span className="text-white font-bold">...</span> để
                thêm vào danh sách phát này.
              </p>
            </div>
            <Button
              variant="white"
              size="md"
              className="mt-2 text-black font-bold rounded-full px-6 hover:scale-105"
              onClick={() => navigate("/")}
            >
              Khám phá nhạc
            </Button>
          </div>
        ) : (
          // Không tìm thấy kết quả theo bộ lọc tìm kiếm
          <div className="py-16 text-center text-spotify-sub text-sm">
            Không tìm thấy bài hát nào khớp với từ khóa "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
};
