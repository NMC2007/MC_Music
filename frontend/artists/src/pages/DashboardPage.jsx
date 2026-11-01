import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  Headphones,
  Heart,
  Users,
  Music,
  Plus,
  ArrowRight,
  Disc3,
  Play,
  Pause,
  Sparkles,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { getArtistProfileApi, getArtistDashboardApi } from "#/api/artist";
import { getMySongsApi, getMyAlbumsApi } from "#/api/catalog";
import { useAuthStore } from "#/store/useAuthStore";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";
import { StatusBadge } from "#/components/ui/StatusBadge";
import { SkeletonStat, SkeletonRow, SkeletonCard } from "#/components/ui/Skeleton";
import { SimpleAudioPlayer } from "#/components/ui/SimpleAudioPlayer";
import { formatNumber, formatDuration, formatDate } from "#/utils/formatters";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { artist, setArtist } = useAuthStore();
  const [previewSong, setPreviewSong] = useState(null);

  // ── 1. API: FETCH PROFILE NGHỆ SĨ & ĐỒNG BỘ STORE ──────────────────────────
  const { data: profileRes } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: getArtistProfileApi,
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  useEffect(() => {
    if (profileRes?.data) {
      // Đồng bộ thông tin mới nhất từ database vào Zustand Store
      setArtist((prev) => ({
        ...prev,
        ...profileRes.data,
      }));
    }
  }, [profileRes, setArtist]);

  // ── 2. API: FETCH THỐNG KÊ DASHBOARD (Plays, Likes, Followers, Songs) ─────
  const { data: dashboardRes, isLoading: isLoadingStats } = useQuery({
    queryKey: ["artistDashboard"],
    queryFn: getArtistDashboardApi,
    staleTime: 1000 * 60 * 2,
  });

  const stats = dashboardRes?.data || {
    totalPlays: 0,
    totalLikes: 0,
    totalFollowers: artist?.followerCount || 0,
    totalSongs: 0,
  };

  // ── 3. API: FETCH DANH SÁCH BÀI HÁT GẦN ĐÂY ──────────────────────────────
  const { data: songsRes, isLoading: isLoadingSongs } = useQuery({
    queryKey: ["artistRecentSongs"],
    queryFn: () => getMySongsApi({ page: 0, size: 5 }),
  });

  const recentSongs = songsRes?.data?.content || [];
  const totalSongsCount = songsRes?.data?.totalElements || stats.totalSongs || 0;

  // ── 4. API: FETCH DANH SÁCH ALBUM GẦN ĐÂY ────────────────────────────────
  const { data: albumsRes, isLoading: isLoadingAlbums } = useQuery({
    queryKey: ["artistRecentAlbums"],
    queryFn: () => getMyAlbumsApi({ page: 0, size: 4 }),
  });

  const recentAlbums = albumsRes?.data?.content || [];
  const totalAlbumsCount = albumsRes?.data?.totalElements || 0;

  const currentArtist = profileRes?.data || artist;

  return (
    <div className="space-y-8 max-w-6xl pb-12">
      {/* ── HERO BANNER: THÔNG TIN NGHỆ SĨ & LỐI TẮT HÀNH ĐỘNG ── */}
      <div className="relative overflow-hidden rounded-3xl bg-[#181818] shadow-2xl">
        {/* Background Cover nếu có */}
        {currentArtist?.coverUrl ? (
          <div className="absolute inset-0 w-full h-full opacity-35">
            <img
              src={currentArtist.coverUrl}
              alt="Cover background"
              className="w-full h-full object-cover filter blur-xs"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-[#200d14] via-[#160a0f] to-[#121212] opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/60 to-transparent" />

        {/* Nội dung Banner */}
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Avatar nghệ sĩ lớn */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden flex-shrink-0 bg-neutral-800 shadow-2xl">
              <CoverImage
                src={currentArtist?.avatarUrl}
                alt={currentArtist?.stageName}
                className="w-full h-full object-cover"
                isArtist
                fallbackIconSize={36}
              />
            </div>

            {/* Thông tin nghệ danh & người theo dõi */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#fa2d48]/20 text-[#fa2d48] text-[11px] font-bold">
                  <CheckCircle2 size={12} /> Nghệ sĩ đã xác thực
                </span>
                <span className="text-xs text-neutral-400">
                  {formatNumber(stats.totalFollowers || currentArtist?.followerCount || 0)} người theo dõi
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {currentArtist?.stageName || "Nghệ sĩ"}
              </h1>

              <p className="text-xs sm:text-sm text-neutral-400 line-clamp-2 max-w-xl">
                {currentArtist?.biography ||
                  "Chào mừng bạn đến với Studio! Bắt đầu phát hành bài hát hoặc tạo album để khán giả toàn cầu lắng nghe tác phẩm của bạn."}
              </p>
            </div>
          </div>

          {/* Nút hành động nhanh */}
          <div className="flex items-center gap-3 flex-shrink-0 w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate("/songs?action=upload")}
              className="flex-1 sm:flex-initial shadow-[0_4px_20px_rgba(250,45,72,0.4)]"
            >
              <Plus size={18} strokeWidth={2.5} />
              <span>Tải bài hát mới</span>
            </Button>

            <Button
              variant="dark"
              size="md"
              onClick={() => navigate("/albums?action=create")}
              className="flex-1 sm:flex-initial bg-white/10 hover:bg-white/20"
            >
              <Disc3 size={18} />
              <span>Tạo Album</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── 4 THẺ THỐNG KÊ TỔNG QUAN (DASHBOARD STATS) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#fa2d48]" /> Thống kê tương tác
          </h2>
          <span className="text-xs text-neutral-400">Cập nhật trực tiếp</span>
        </div>

        {isLoadingStats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
            <SkeletonStat />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tổng lượt nghe */}
            <div className="p-5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all space-y-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Tổng lượt nghe
                </span>
                <div className="w-10 h-10 rounded-xl bg-[#fa2d48]/15 text-[#fa2d48] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Headphones size={20} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatNumber(stats.totalPlays)}
              </p>
              <p className="text-[11px] text-neutral-400">Lượt nghe trên toàn nền tảng</p>
            </div>

            {/* 2. Tổng lượt thích */}
            <div className="p-5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all space-y-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Lượt yêu thích
                </span>
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart size={20} fill="currentColor" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatNumber(stats.totalLikes)}
              </p>
              <p className="text-[11px] text-neutral-400">Thính giả thả tim bài hát</p>
            </div>

            {/* 3. Người theo dõi */}
            <div className="p-5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all space-y-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Người theo dõi
                </span>
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatNumber(stats.totalFollowers || currentArtist?.followerCount || 0)}
              </p>
              <p className="text-[11px] text-neutral-400">Người hâm mộ theo dõi hồ sơ</p>
            </div>

            {/* 4. Tổng số bài hát */}
            <div className="p-5 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all space-y-3 shadow-lg group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Tổng tác phẩm
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Music size={20} />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatNumber(totalSongsCount)}
              </p>
              <p className="text-[11px] text-neutral-400">Bài hát đã tải lên hệ thống</p>
            </div>
          </div>
        )}
      </div>

      {/* ── THANH NGHE THỬ ÂM THANH NỔI (KHI BẤM NGHE BÀI HÁT BẤT KỲ) ── */}
      {previewSong && (
        <div className="sticky top-20 z-20 animate-in fade-in slide-in-from-top-4 duration-200">
          <SimpleAudioPlayer
            src={previewSong.audioUrl}
            title={`Đang nghe thử: ${previewSong.title}`}
            autoPlay
            onClose={() => setPreviewSong(null)}
          />
        </div>
      )}

      {/* ── SECTION: BÀI HÁT PHÁT HÀNH GẦN ĐÂY ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Music size={18} className="text-[#fa2d48]" /> Bài hát gần đây
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Theo dõi trạng thái kiểm duyệt và lượt nghe của các bài hát mới nhất
            </p>
          </div>

          <button
            onClick={() => navigate("/songs")}
            className="text-xs text-spotify-sub hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            Xem tất cả ({totalSongsCount}) <ArrowRight size={14} />
          </button>
        </div>

        {/* Danh sách bài hát */}
        {isLoadingSongs ? (
          <div className="bg-[#181818] rounded-2xl p-4 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : recentSongs.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#181818] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
              <Music size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">Chưa có bài hát nào được đăng tải</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Hãy tải lên bản thu đầu tiên của bạn để gửi vào hàng đợi duyệt và phân phối tới thính giả.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate("/songs?action=upload")}
              className="mx-auto mt-2"
            >
              <Plus size={16} /> Tải bài hát ngay
            </Button>
          </div>
        ) : (
          <div className="bg-[#181818] rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full text-left text-sm select-none">
                <thead>
                  <tr className="text-xs text-neutral-400 uppercase tracking-wider bg-white/[0.02]">
                    <th className="py-3.5 pl-6 pr-3 w-12 text-center">#</th>
                    <th className="py-3.5 px-4 min-w-[220px]">Tên bài hát</th>
                    <th className="py-3.5 px-4 hidden md:table-cell">Thời lượng</th>
                    <th className="py-3.5 px-4">Trạng thái</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell text-right">Lượt nghe</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell text-right">Lượt thích</th>
                    <th className="py-3.5 pr-6 pl-4 text-center w-24">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.03]">
                  {recentSongs.map((song) => {
                    const isCurrentPlaying = previewSong?.id === song.id;

                    return (
                      <tr
                        key={song.id}
                        className="hover:bg-white/[0.03] transition-colors group"
                      >
                        {/* STT / Nút Play */}
                        <td className="py-3 pl-6 pr-3 text-center text-xs text-neutral-500 font-medium">
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentPlaying) {
                                setPreviewSong(null);
                              } else {
                                setPreviewSong(song);
                              }
                            }}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-[#fa2d48] transition-all cursor-pointer mx-auto"
                            title={isCurrentPlaying ? "Dừng nghe thử" : "Nghe thử"}
                          >
                            {isCurrentPlaying ? (
                              <Pause size={13} fill="currentColor" />
                            ) : (
                              <Play size={13} fill="currentColor" className="ml-0.5" />
                            )}
                          </button>
                        </td>

                        {/* Tên bài hát & Thumbnail */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                              <CoverImage
                                src={song.coverImage}
                                alt={song.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-white text-sm truncate group-hover:text-[#fa2d48] transition-colors">
                                {song.title}
                              </p>
                              <p className="text-xs text-neutral-400 truncate">
                                {song.ownerName || currentArtist?.stageName}
                                {song.explicit && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400 uppercase font-semibold">
                                    18+
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Thời lượng */}
                        <td className="py-3 px-4 text-xs text-neutral-400 hidden md:table-cell font-mono">
                          {formatDuration(song.durationSeconds)}
                        </td>

                        {/* Trạng thái kiểm duyệt */}
                        <td className="py-3 px-4">
                          <StatusBadge status={song.status} size="sm" />
                        </td>

                        {/* Lượt nghe */}
                        <td className="py-3 px-4 text-xs font-mono text-neutral-300 hidden sm:table-cell text-right">
                          {formatNumber(song.playCount)}
                        </td>

                        {/* Lượt thích */}
                        <td className="py-3 px-4 text-xs font-mono text-neutral-300 hidden sm:table-cell text-right">
                          {formatNumber(song.likeCount)}
                        </td>

                        {/* Nút hành động */}
                        <td className="py-3 pr-6 pl-4 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (isCurrentPlaying) {
                                setPreviewSong(null);
                              } else {
                                setPreviewSong(song);
                              }
                            }}
                            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                              isCurrentPlaying
                                ? "bg-[#fa2d48] text-white"
                                : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white"
                            }`}
                          >
                            {isCurrentPlaying ? "Đang phát" : "Nghe thử"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── SECTION: ALBUM & TUYỂN TẬP GẦN ĐÂY ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Disc3 size={18} className="text-[#fa2d48]" /> Album & Bộ sưu tập
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Các ấn phẩm âm nhạc Album, EP hoặc Single chính thức của bạn
            </p>
          </div>

          <button
            onClick={() => navigate("/albums")}
            className="text-xs text-spotify-sub hover:text-white flex items-center gap-1 font-semibold transition-colors cursor-pointer"
          >
            Xem tất cả ({totalAlbumsCount}) <ArrowRight size={14} />
          </button>
        </div>

        {/* Lưới Album */}
        {isLoadingAlbums ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <SkeletonCard isArtist={false} />
            <SkeletonCard isArtist={false} />
            <SkeletonCard isArtist={false} />
            <SkeletonCard isArtist={false} />
          </div>
        ) : recentAlbums.length === 0 ? (
          <div className="p-10 rounded-2xl bg-[#181818] text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-800 text-neutral-500 flex items-center justify-center mx-auto">
              <Disc3 size={24} />
            </div>
            <h3 className="text-sm font-bold text-white">Chưa phát hành Album nào</h3>
            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
              Tạo Album để gom nhóm các đĩa đơn, EP và xây dựng phong cách âm nhạc chuyên nghiệp.
            </p>
            <Button
              variant="dark"
              size="sm"
              onClick={() => navigate("/albums?action=create")}
              className="mx-auto mt-2 bg-white/10 hover:bg-white/20"
            >
              <Plus size={16} /> Tạo Album đầu tay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {recentAlbums.map((album) => (
              <div
                key={album.id}
                onClick={() => navigate(`/albums?albumId=${album.id}`)}
                className="p-4 rounded-2xl bg-[#181818] hover:bg-[#202020] transition-all cursor-pointer group shadow-lg flex flex-col justify-between"
              >
                <div>
                  {/* Thumbnail Cover */}
                  <div className="relative mb-3.5 w-full aspect-square rounded-xl overflow-hidden bg-neutral-800 shadow-md">
                    <CoverImage
                      src={album.coverImage}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      isAlbum
                    />
                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                        {album.albumType || "ALBUM"}
                      </span>
                    </div>
                  </div>

                  {/* Tiêu đề & Thông tin */}
                  <h3 className="font-bold text-white text-sm truncate group-hover:text-[#fa2d48] transition-colors">
                    {album.title}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {album.totalTracks || 0} bài hát
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/[0.04] text-[11px] text-neutral-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {formatDate(album.releaseDate || album.createdAt)}
                  </span>
                  <StatusBadge status={album.status} size="sm" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
