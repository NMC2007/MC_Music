import React, { useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Disc3,
  Clock,
  Calendar,
  Headphones,
  FileText,
} from "lucide-react";

import { toast } from "sonner";

import {
  getSongById,
  getSongLyrics,
  getArtistSongs,
} from "../api/catalog/public";
import { getArtistDetail } from "../api/artists/public";
import { usePlayerStore } from "../store/usePlayerStore";
import { useFavorites } from "../hooks/useFavorites";
import { usePlaybackActions } from "../hooks/usePlaybackActions";
import { Button } from "../components/ui/Button";
import { CoverImage } from "../components/ui/CoverImage";
import { SongRow } from "../components/ui/SongRow";
import { SongCard } from "../components/ui/SongCard";
import { AddToPlaylistMenu } from "../components/playlist/AddToPlaylistMenu";
import { DetailActionBar } from "../components/ui/DetailActionBar";

/**
 * Component hiển thị thẻ 1 nghệ sĩ tham gia trong bài hát (Owner, Featured, Producer)
 * Tái sử dụng SongCard chuẩn giao diện trang chủ
 */
const ArtistParticipantCard = ({ artistId, stageName, role, isOwner = false }) => {
  const navigate = useNavigate();
  const { playArtist } = usePlaybackActions();

  const { data: artistDetailData } = useQuery({
    queryKey: ["artistDetail", artistId],
    queryFn: () => getArtistDetail(artistId),
    enabled: !!artistId,
    staleTime: 1000 * 60 * 5, // Cache 5 phút
  });

  const artist = artistDetailData?.data;
  const displayName = artist?.stageName || stageName || "Nghệ sĩ";
  const avatarUrl = artist?.avatar || artist?.avatarUrl;

  const roleSubtitle = useMemo(() => {
    if (isOwner) return "Nghệ sĩ chính";
    if (!role) return "Nghệ sĩ";
    const r = role.toUpperCase();
    if (r === "MAIN") return "Nghệ sĩ chính";
    if (r === "FEATURED") return "Nghệ sĩ hợp tác";
    if (r === "PRODUCER") return "Nhà sản xuất";
    return role;
  }, [role, isOwner]);

  const handlePlayArtist = () => playArtist(artistId);

  return (
    <SongCard
      type="artist"
      id={artistId}
      artistId={artistId}
      title={displayName}
      subtitle={roleSubtitle}
      artistName={displayName}
      imageUrl={avatarUrl}
      onClick={() => artistId && navigate(`/artist/${artistId}`)}
      onPlayClick={handlePlayArtist}
    />
  );
};

export const SongPage = () => {
  const { id: songId } = useParams();
  const navigate = useNavigate();

  const currentSong = usePlayerStore((state) => state.currentSong);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const setIsPlaying = usePlayerStore((state) => state.setIsPlaying);
  const playSongWithContext = usePlayerStore((state) => state.playSongWithContext);
  const playWithAutoQueue = usePlayerStore((state) => state.playWithAutoQueue);
  const { isFavoriteSong, toggleFavoriteSong } = useFavorites();

  // ── 1. Fetch thông tin chi tiết bài hát ──────────────────────────────────
  const {
    data: songData,
    isLoading: isLoadingSong,
    isError,
  } = useQuery({
    queryKey: ["songDetail", songId],
    queryFn: () => getSongById(songId),
    enabled: !!songId,
  });

  const song = songData?.data;

  // ── 2. Fetch lời bài hát ────────────────────────────────────────────────
  const { data: lyricsData, isLoading: isLoadingLyrics } = useQuery({
    queryKey: ["songLyrics", songId],
    queryFn: () => getSongLyrics(songId),
    enabled: !!songId,
    retry: false,
  });

  const lyrics = lyricsData?.data;

  // ── 3. Fetch các bài hát cùng nghệ sĩ ────────────────────────────────────
  const { data: moreSongsData } = useQuery({
    queryKey: ["artistSongs", song?.ownerId],
    queryFn: () =>
      getArtistSongs(song.ownerId, { size: 6, sort: "playCount,desc" }),
    enabled: !!song?.ownerId,
  });

  const moreSongs = useMemo(() => {
    const list = moreSongsData?.data?.content || [];
    return list.filter((s) => s.id !== songId).slice(0, 5);
  }, [moreSongsData, songId]);

  // ── 4. Danh sách toàn bộ nghệ sĩ tham gia (bao gồm Owner) ────────────────
  const allArtists = useMemo(() => {
    if (!song) return [];
    const list = [];
    const seen = new Set();

    // 1. Thêm nghệ sĩ sở hữu (Owner) đầu tiên
    if (song.ownerId) {
      list.push({
        artistId: song.ownerId,
        artistName: song.ownerName,
        role: "MAIN",
        isOwner: true,
      });
      seen.add(song.ownerId);
    }

    // 2. Thêm các nghệ sĩ tham gia trong song.artists
    if (Array.isArray(song.artists)) {
      song.artists.forEach((art) => {
        if (art.artistId && !seen.has(art.artistId)) {
          seen.add(art.artistId);
          list.push({
            artistId: art.artistId,
            artistName: art.artistName,
            role: art.role || "FEATURED",
            isOwner: false,
          });
        }
      });
    }

    return list;
  }, [song]);

  // ── 5. Helper format thời lượng (giây -> mm:ss) ───────────────────────────
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "--:--";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isLiked = isFavoriteSong(song?.id);

  const handlePlayMoreRow = useCallback(
    (item, idx) => {
      playSongWithContext(item, moreSongs, idx);
    },
    [playSongWithContext, moreSongs]
  );
  const isCurrentPlaying =
    isPlaying && (currentSong?.id === song?.id || currentSong?.songId === song?.id);

  const handlePlayToggle = () => {
    if (!song) return;
    if (isCurrentPlaying) {
      setIsPlaying(false);
    } else {
      playWithAutoQueue(song);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Đã sao chép liên kết bài hát vào clipboard!");
  };

  // ── Loading state ───────────────────────────────────────────────────────
  if (isLoadingSong) {
    return (
      <div className="flex flex-col gap-8 p-6 md:p-8 animate-pulse">
        <div className="flex flex-col sm:flex-row items-end gap-6 pt-10">
          <div className="w-48 h-48 sm:w-60 sm:h-60 rounded-2xl bg-neutral-800 flex-shrink-0" />
          <div className="flex flex-col gap-3 flex-1 w-full">
            <div className="w-24 h-5 rounded-full bg-neutral-800" />
            <div className="w-3/4 h-12 rounded bg-neutral-800" />
            <div className="w-1/2 h-6 rounded bg-neutral-800" />
            <div className="w-1/3 h-4 rounded bg-neutral-800" />
          </div>
        </div>
        <div className="h-12 w-48 bg-neutral-800 rounded-full" />
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (isError || !song) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4 px-6">
        <Disc3 size={64} className="text-neutral-600 animate-spin-slow" />
        <h2 className="text-2xl font-bold text-white">Không tìm thấy bài hát</h2>
        <p className="text-spotify-sub max-w-md text-sm">
          Bài hát bạn đang tìm kiếm không tồn tại, đã bị gỡ bỏ hoặc chưa được phê duyệt.
        </p>
        <Button
          variant="primary"
          onClick={() => navigate("/")}
          className="mt-2"
        >
          Quay lại trang chủ
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full pb-28">
      {/* ── HEADER BÀI HÁT ──────────────────────────────────────────────────── */}
      <div className="relative flex flex-col md:flex-row items-center md:items-end gap-5 sm:gap-6 md:gap-8 px-4 sm:px-6 md:px-10 pt-6 sm:pt-12 pb-6 sm:pb-8 bg-gradient-to-b from-[#4a1a1a]/80 via-[#1f1215] to-[#121212]">
        {/* Ảnh bìa bài hát to rõ */}
        <div className="w-44 h-44 sm:w-60 sm:h-60 md:w-72 md:h-72 flex-shrink-0 shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl overflow-hidden group">
          <CoverImage
            src={song.coverImage}
            alt={song.title}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Thông tin bài hát bên phải ảnh */}
        <div className="flex-1 flex flex-col justify-end text-center md:text-left min-w-0 w-full">
          {/* Badge loại nội dung */}
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black tracking-wider uppercase bg-[#fa2d48]/20 text-[#fa2d48] border border-[#fa2d48]/30">
              Bài Hát
            </span>
            {song.explicit && (
              <span className="px-2 py-0.5 rounded bg-neutral-700 text-neutral-300 text-[10px] font-bold">
                18+
              </span>
            )}
          </div>

          {/* Tên bài hát */}
          <h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight mb-2 sm:mb-3 line-clamp-2"
            title={song.title}
          >
            {song.title}
          </h1>

          {/* Album (nếu có) */}
          {(song.albumTitle || song.albumId) && (
            <div className="flex items-center justify-center md:justify-start gap-2 text-xs sm:text-sm md:text-base text-neutral-300 mb-2">
              <Disc3 size={16} className="text-[#fa2d48] flex-shrink-0" />
              <span className="text-neutral-400">Thuộc album:</span>
              <button
                type="button"
                onClick={() =>
                  song.albumId && navigate(`/album/${song.albumId}`)
                }
                className={`font-semibold text-white hover:underline hover:text-[#fa2d48] transition-colors cursor-pointer text-left truncate ${
                  !song.albumId ? "pointer-events-none" : ""
                }`}
              >
                {song.albumTitle || "Xem Album"}
              </button>
            </div>
          )}

          {/* Nghệ sĩ sở hữu / Nghệ sĩ chính */}
          <div className="flex items-center justify-center md:justify-start flex-wrap gap-2 text-xs sm:text-sm text-neutral-300 mb-2 sm:mb-3">
            <span className="text-neutral-400">Nghệ sĩ chính:</span>
            <span
              onClick={() =>
                song.ownerId && navigate(`/artist/${song.ownerId}`)
              }
              className={`font-bold text-white hover:underline hover:text-[#fa2d48] transition-colors cursor-pointer ${
                !song.ownerId ? "pointer-events-none" : ""
              }`}
            >
              {song.ownerName || "Chưa xác định"}
            </span>
          </div>

          {/* Metadata: Thời lượng, Lượt nghe, Thể loại, Năm phát hành */}
          <div className="flex items-center justify-center md:justify-start flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 sm:gap-y-2 text-xs md:text-sm text-neutral-400 pt-2 border-t border-white/10">
            {/* Thời lượng */}
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-neutral-400" />
              <span>{formatDuration(song.durationSeconds)}</span>
            </span>

            {/* Lượt nghe */}
            <span className="flex items-center gap-1.5">
              <Headphones size={14} className="text-neutral-400" />
              <span>
                {Number(song.playCount || 0).toLocaleString("vi-VN")} lượt nghe
              </span>
            </span>

            {/* Ngày/Năm phát hành */}
            {song.createdAt && (
              <span className="flex items-center gap-1.5">
                <Calendar size={14} className="text-neutral-400" />
                <span>{new Date(song.createdAt).getFullYear()}</span>
              </span>
            )}

            {/* Thể loại */}
            {Array.isArray(song.genres) && song.genres.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {song.genres.map((g) => (
                  <span
                    key={g.id || g.name}
                    onClick={() =>
                      navigate(`/genre/${g.id}`, { state: { title: g.name, genreId: g.id } })
                    }
                    className="px-2 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-neutral-200 text-xs cursor-pointer transition-colors"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── ACTION BAR (Không bị cố định/sticky lên đầu trang, cuộn mượt cùng nội dung) ── */}
      <DetailActionBar
        isPlaying={isCurrentPlaying}
        onPlay={handlePlayToggle}
        isLiked={isLiked}
        onLike={() => toggleFavoriteSong(song)}
        menuComponent={
          <AddToPlaylistMenu
            song={song}
            buttonClassName="w-11 h-11"
            iconSize={26}
          />
        }
        onShare={handleShare}
        gradientFrom="from-[#1f1215]/60"
      />

      {/* ── NỘI DUNG CHÍNH (NGHỆ SĨ THAM GIA, LỜI BÀI HÁT, BÀI HÁT LIÊN QUAN) ── */}
      <div className="flex flex-col gap-8 sm:gap-12 px-4 sm:px-6 md:px-10 py-6 sm:py-8">
        {/* ── SECTION: TOÀN BỘ NGHỆ SĨ THAM GIA ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Nghệ sĩ tham gia
            </h2>
            <span className="text-xs text-spotify-sub">
              {allArtists.length} nghệ sĩ
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {allArtists.map((art) => (
              <ArtistParticipantCard
                key={art.artistId}
                artistId={art.artistId}
                stageName={art.artistName}
                role={art.role}
                isOwner={art.isOwner}
              />
            ))}
          </div>
        </section>

        {/* ── SECTION: LỜI BÀI HÁT (LYRICS) ── */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-[#fa2d48]" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Lời bài hát
            </h2>
          </div>

          <div className="bg-gradient-to-br from-white/[0.07] to-white/[0.02] border border-white/10 rounded-2xl p-4 sm:p-6 md:p-8 backdrop-blur-md">
            {isLoadingLyrics ? (
              <div className="space-y-3 animate-pulse">
                <div className="h-4 bg-neutral-800 rounded w-1/3" />
                <div className="h-4 bg-neutral-800 rounded w-2/3" />
                <div className="h-4 bg-neutral-800 rounded w-1/2" />
                <div className="h-4 bg-neutral-800 rounded w-3/4" />
              </div>
            ) : lyrics?.content ? (
              <div className="text-neutral-200 text-sm sm:text-base md:text-lg leading-relaxed whitespace-pre-line font-medium max-h-[420px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-white/20">
                {lyrics.content}
              </div>
            ) : (
              <div className="py-8 text-center text-spotify-sub flex flex-col items-center justify-center gap-2">
                <FileText size={36} className="text-neutral-600 mb-1" />
                <span className="text-sm">Lời bài hát đang được cập nhật cho ca khúc này.</span>
              </div>
            )}
          </div>
        </section>

        {/* ── SECTION: BÀI HÁT KHÁC CỦA NGHỆ SĨ ── */}
        {moreSongs.length > 0 && (
          <section className="flex flex-col gap-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Thêm từ {song.ownerName}
              </h2>
              <button
                type="button"
                onClick={() =>
                  song.ownerId && navigate(`/artist/${song.ownerId}`)
                }
                className="text-xs font-bold text-neutral-400 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
              >
                Xem tất cả
              </button>
            </div>

            <div className="flex flex-col divide-y divide-white/5">
              {moreSongs.map((item, idx) => (
                <SongRow
                  key={item.id}
                  index={idx + 1}
                  song={item}
                  isPlaying={
                    isPlaying &&
                    (currentSong?.id === item.id || currentSong?.songId === item.id)
                  }
                  isLiked={isFavoriteSong(item.id)}
                  onToggleLike={toggleFavoriteSong}
                  onPlayClick={handlePlayMoreRow}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
export default SongPage;

