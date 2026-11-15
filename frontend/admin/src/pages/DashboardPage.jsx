import React, { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Music,
  Disc3,
  Users,
  UserCheck,
  ArrowRight,
  Clock,
  Sparkles,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";

import { getPendingSongsApi, getPendingAlbumsApi } from "../api/catalog";
import { getUsersApi } from "../api/users";
import { getArtistsApi } from "../api/artists";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonStat, SkeletonRow } from "../components/ui/Skeleton";
import { formatDate, formatDuration, formatNumber } from "../utils/formatters";
import { MODERATION_RULES_LIST } from "../utils/rules";

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("songs"); // "songs" | "albums"

  // ── TRUY VẤN DỮ LIỆU TỔNG QUAN ──
  const {
    data: songsData,
    isLoading: isSongsLoading,
    refetch: refetchSongs,
  } = useQuery({
    queryKey: ["dashboardPendingSongs"],
    queryFn: () => getPendingSongsApi({ page: 0, size: 5, sort: "createdAt,desc" }),
  });

  const {
    data: albumsData,
    isLoading: isAlbumsLoading,
    refetch: refetchAlbums,
  } = useQuery({
    queryKey: ["dashboardPendingAlbums"],
    queryFn: () => getPendingAlbumsApi({ page: 0, size: 5, sort: "createdAt,desc" }),
  });

  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["dashboardUsersCount"],
    queryFn: () => getUsersApi({ page: 0, size: 1 }),
  });

  const { data: artistsData, isLoading: isArtistsLoading } = useQuery({
    queryKey: ["dashboardArtistsCount"],
    queryFn: () => getArtistsApi({ page: 0, size: 1 }),
  });

  const pendingSongsCount = songsData?.data?.totalElements ?? 0;
  const pendingAlbumsCount = albumsData?.data?.totalElements ?? 0;
  const totalUsersCount = usersData?.data?.totalElements ?? 0;
  const totalArtistsCount = artistsData?.data?.totalElements ?? 0;

  const pendingSongsList = songsData?.data?.content ?? [];
  const pendingAlbumsList = albumsData?.data?.content ?? [];

  const handleRefreshAll = () => {
    refetchSongs();
    refetchAlbums();
  };

  const statCards = [
    {
      title: "Bài hát chờ duyệt",
      count: pendingSongsCount,
      subtitle: pendingSongsCount > 0 ? "Cần thẩm định chất lượng" : "Đã xử lý toàn bộ",
      icon: Music,
      color: "text-[#fa2d48]",
      bgColor: "bg-[#fa2d48]/10",
      borderColor: "border-[#fa2d48]/25",
      badgeText: pendingSongsCount > 0 ? "Cần xử lý" : "Sạch hàng đợi",
      badgeClass: pendingSongsCount > 0 ? "bg-[#fa2d48]/20 text-[#fa2d48]" : "bg-emerald-500/20 text-emerald-400",
      actionText: "Duyệt bài hát",
      onClick: () => navigate("/songs"),
      isLoading: isSongsLoading,
    },
    {
      title: "Album chờ duyệt",
      count: pendingAlbumsCount,
      subtitle: pendingAlbumsCount > 0 ? "Chờ phê duyệt phát hành" : "Đã xử lý toàn bộ",
      icon: Disc3,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/25",
      badgeText: pendingAlbumsCount > 0 ? "Cần xử lý" : "Sạch hàng đợi",
      badgeClass: pendingAlbumsCount > 0 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400",
      actionText: "Duyệt album",
      onClick: () => navigate("/albums"),
      isLoading: isAlbumsLoading,
    },
    {
      title: "Tổng Người dùng",
      count: totalUsersCount,
      subtitle: "Tài khoản thính giả hệ thống",
      icon: Users,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
      badgeText: "Người dùng",
      badgeClass: "bg-sky-500/20 text-sky-400",
      actionText: "Quản lý user",
      onClick: () => navigate("/users"),
      isLoading: isUsersLoading,
    },
    {
      title: "Tổng Nghệ sĩ",
      count: totalArtistsCount,
      subtitle: "Nghệ danh hoạt động trên nền tảng",
      icon: UserCheck,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      badgeText: "Nghệ sĩ",
      badgeClass: "bg-emerald-500/20 text-emerald-400",
      actionText: "Quản lý artist",
      onClick: () => navigate("/artists"),
      isLoading: isArtistsLoading,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ── 1. TIÊU ĐỀ DASHBOARD & NÚT LÀM MỚI ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            Bảng Điều Khiển Quản Trị
            <span className="w-2.5 h-2.5 rounded-full bg-[#fa2d48] animate-pulse" />
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Tổng quan hàng đợi kiểm duyệt âm nhạc và số liệu tài khoản toàn hệ thống MC Music.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="glass"
            size="sm"
            onClick={() => setIsRulesModalOpen(true)}
            className="text-xs"
          >
            <Sparkles size={14} className="text-[#fa2d48]" />
            <span>7 Quy tắc Kiểm duyệt</span>
          </Button>

          <Button
            variant="dark"
            size="sm"
            onClick={handleRefreshAll}
            tooltip="Làm mới số liệu"
            className="text-xs"
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* ── 2. 4 THẺ THỐNG KÊ TỔNG QUAN ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          if (card.isLoading) {
            return <SkeletonStat key={idx} />;
          }

          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={card.onClick}
              className={`p-5 rounded-2xl bg-[#181818] border ${card.borderColor} hover:border-white/20 transition-all duration-200 flex flex-col justify-between cursor-pointer group hover:scale-[1.01]`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center`}
                  >
                    <Icon size={20} />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeClass}`}
                  >
                    {card.badgeText}
                  </span>
                </div>

                <p className="text-xs font-semibold text-neutral-400">{card.title}</p>
                <p className="text-3xl font-black text-white mt-1 tracking-tight">
                  {formatNumber(card.count)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">{card.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-xs font-bold text-neutral-400 group-hover:text-white transition-colors">
                <span>{card.actionText}</span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 3. KHỐI HÀNH ĐỘNG NHANH (QUICK ACTIONS) ── */}
      <div className="p-5 rounded-2xl bg-[#181818] border border-white/[0.04] space-y-3">
        <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
          Lối tắt tác vụ quản trị nhanh
        </h3>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate("/songs")}
            className="text-xs"
          >
            <Music size={14} /> Duyệt bài hát ({pendingSongsCount})
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate("/albums")}
            className="text-xs"
          >
            <Disc3 size={14} /> Duyệt album ({pendingAlbumsCount})
          </Button>
          <Button
            variant="dark"
            size="sm"
            onClick={() => navigate("/users")}
            className="text-xs"
          >
            <Users size={14} /> Quản lý Người dùng
          </Button>
          <Button
            variant="dark"
            size="sm"
            onClick={() => navigate("/artists")}
            className="text-xs"
          >
            <UserCheck size={14} /> Quản lý Nghệ sĩ
          </Button>
        </div>
      </div>

      {/* ── 4. HÀNG ĐỢI KIỂM DUYỆT ƯU TIÊN (PRIORITY MODERATION QUEUE) ── */}
      <div className="bg-[#181818] border border-white/[0.06] rounded-2xl overflow-hidden">
        {/* Header Tabs */}
        <div className="p-5 border-b border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="text-[#fa2d48]" size={18} />
            <h2 className="text-base font-bold text-white">Hàng Đợi Kiểm Duyệt Ưu Tiên</h2>
          </div>

          <div className="flex items-center gap-1.5 bg-[#121212] p-1 rounded-xl border border-white/[0.04]">
            <button
              onClick={() => setActiveTab("songs")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "songs"
                  ? "bg-[#fa2d48] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Bài hát ({pendingSongsCount})
            </button>
            <button
              onClick={() => setActiveTab("albums")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "albums"
                  ? "bg-[#fa2d48] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Album ({pendingAlbumsCount})
            </button>
          </div>
        </div>

        {/* Tab Content: Songs Queue */}
        {activeTab === "songs" && (
          <div className="p-5">
            {isSongsLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : pendingSongsList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-bold text-white">Không có bài hát nào chờ duyệt!</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Tất cả các tác phẩm âm nhạc được nghệ sĩ đăng tải đều đã được thẩm định xong.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Tác phẩm</th>
                      <th className="pb-3">Nghệ sĩ</th>
                      <th className="pb-3">Thời lượng</th>
                      <th className="pb-3">Ngày gửi</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-right pr-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {pendingSongsList.map((song) => (
                      <tr key={song.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-2 flex items-center gap-3">
                          <CoverImage
                            src={song.coverUrl}
                            alt={song.title}
                            className="w-10 h-10 rounded-lg"
                            fallbackIconSize={18}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]">
                              {song.title}
                            </p>
                            {song.isExplicit && (
                              <span className="inline-block mt-0.5 text-[9px] font-black px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                                EXPLICIT
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-neutral-300 font-medium">
                          {song.primaryArtistName || song.artistName || "Chưa cập nhật"}
                        </td>
                        <td className="py-3 text-neutral-400 font-mono">
                          {formatDuration(song.duration)}
                        </td>
                        <td className="py-3 text-neutral-400">
                          {formatDate(song.createdAt)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status="PENDING" size="sm" />
                        </td>
                        <td className="py-3 text-right pr-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/songs")}
                            className="text-xs px-3"
                          >
                            Xử lý ngay
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab Content: Albums Queue */}
        {activeTab === "albums" && (
          <div className="p-5">
            {isAlbumsLoading ? (
              <div className="space-y-3">
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : pendingAlbumsList.length === 0 ? (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <p className="text-sm font-bold text-white">Không có album nào chờ duyệt!</p>
                <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                  Tất cả các bộ sưu tập album, EP của nghệ sĩ đã được xử lý xong.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.04] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pl-2">Album</th>
                      <th className="pb-3">Nghệ sĩ</th>
                      <th className="pb-3">Số ca khúc</th>
                      <th className="pb-3">Ngày gửi</th>
                      <th className="pb-3">Trạng thái</th>
                      <th className="pb-3 text-right pr-2">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {pendingAlbumsList.map((album) => (
                      <tr key={album.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pl-2 flex items-center gap-3">
                          <CoverImage
                            src={album.coverUrl}
                            alt={album.title}
                            isAlbum
                            className="w-10 h-10 rounded-lg"
                            fallbackIconSize={18}
                          />
                          <p className="font-bold text-white truncate max-w-[200px]">
                            {album.title}
                          </p>
                        </td>
                        <td className="py-3 text-neutral-300 font-medium">
                          {album.artistName || "Chưa cập nhật"}
                        </td>
                        <td className="py-3 text-neutral-400 font-mono">
                          {album.totalTracks || 0} bài
                        </td>
                        <td className="py-3 text-neutral-400">
                          {formatDate(album.createdAt || album.releaseDate)}
                        </td>
                        <td className="py-3">
                          <StatusBadge status="PENDING" size="sm" />
                        </td>
                        <td className="py-3 text-right pr-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => navigate("/albums")}
                            className="text-xs px-3"
                          >
                            Xử lý ngay
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL XEM 7 QUY TẮC KIỂM DUYỆT ÂM NHẠC ── */}
      <Modal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        title="Bộ 7 Quy tắc Kiểm duyệt Âm nhạc MC Music"
        description="Quy chuẩn vận hành áp dụng cho mọi nội dung bài hát và album trước khi phát hành công khai."
        maxWidth="max-w-2xl"
      >
        <div className="space-y-3">
          {MODERATION_RULES_LIST.map((rule) => (
            <div
              key={rule.code}
              className="p-3.5 rounded-xl bg-[#202020] border border-white/[0.04]"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#fa2d48]">{rule.code}</span>
                <span className="text-[10px] uppercase font-bold text-neutral-400">Tiêu chuẩn</span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1">{rule.title}</h4>
              <p className="text-xs text-neutral-300 mt-1 leading-relaxed">{rule.description}</p>
              <div className="mt-2 pt-2 border-t border-white/[0.04] text-[11px] text-emerald-400">
                <span className="font-semibold">Gợi ý khắc phục: </span>
                {rule.tip}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-3">
            <Button
              variant="dark"
              size="sm"
              onClick={() => setIsRulesModalOpen(false)}
              className="px-5"
            >
              Đã hiểu quy tắc
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DashboardPage;
