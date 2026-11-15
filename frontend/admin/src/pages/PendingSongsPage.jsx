import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Music,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  Filter,
} from "lucide-react";

import { getPendingSongsApi } from "../api/catalog";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow } from "../components/ui/Skeleton";
import { SongModerationModal } from "../components/moderation/SongModerationModal";
import { formatDuration, formatDateTime } from "../utils/formatters";

export const PendingSongsPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterExplicit, setFilterExplicit] = useState("ALL"); // "ALL" | "EXPLICIT" | "CLEAN"

  // Bài hát đang được mở trong Bảng kiểm duyệt 80% màn hình
  const [inspectingSong, setInspectingSong] = useState(null);

  // ── TRUY VẤN DANH SÁCH BÀI HÁT PENDING TỪ CATALOG SERVICE ──
  const {
    data: songsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminPendingSongsList", page, pageSize],
    queryFn: () => getPendingSongsApi({ page, size: pageSize, sort: "createdAt,desc" }),
  });

  const pendingSongs = songsData?.data?.content || [];
  const totalElements = songsData?.data?.totalElements || 0;
  const totalPages = songsData?.data?.totalPages || 1;

  // Lọc bài hát theo từ khóa tìm kiếm và nhãn Explicit
  const filteredSongs = pendingSongs.filter((song) => {
    const q = searchTerm.toLowerCase().trim();
    const titleMatch = song.title?.toLowerCase().includes(q);
    const ownerMatch = song.ownerName?.toLowerCase().includes(q);
    const artistMatch = song.artists?.some((a) =>
      a.artistName?.toLowerCase().includes(q)
    );
    const searchMatches = !q || titleMatch || ownerMatch || artistMatch;

    if (filterExplicit === "EXPLICIT") {
      return searchMatches && song.explicit;
    }
    if (filterExplicit === "CLEAN") {
      return searchMatches && !song.explicit;
    }
    return searchMatches;
  });

  const handleOpenInspection = (song) => {
    setInspectingSong(song);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER TRANG DANH SÁCH BÀI HÁT ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Music className="text-[#fa2d48]" size={26} />
            Kiểm Duyệt Bài Hát
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#fa2d48]/20 text-[#fa2d48] font-bold">
              {totalElements} chờ xử lý
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Danh sách toàn bộ bài hát chờ kiểm duyệt. Nhấn vào bất kỳ bài hát nào để mở Bảng thẩm định chi tiết và áp dụng 7 quy tắc.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="dark"
            size="sm"
            onClick={() => refetch()}
            tooltip="Làm mới danh sách"
            className="text-xs"
          >
            <RefreshCw size={14} />
            <span>Làm mới</span>
          </Button>
        </div>
      </div>

      {/* ── 2. THANH TÌM KIẾM & BỘ LỌC ── */}
      <div className="p-4 rounded-2xl bg-[#181818] border border-white/[0.04] flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Ô Tìm kiếm */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Tìm theo tên bài hát, nghệ sĩ sở hữu, nghệ sĩ hợp tác..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#202020] text-xs text-white rounded-xl pl-10 pr-4 py-2.5 outline-none border border-neutral-700/60 focus:border-white transition-colors"
          />
        </div>

        {/* Bộ lọc Explicit */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-500 hidden sm:block" />
          <span className="text-xs text-neutral-400 font-semibold hidden sm:block">Lọc ca từ:</span>
          <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-white/[0.04] text-xs">
            <button
              onClick={() => setFilterExplicit("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterExplicit === "ALL"
                  ? "bg-[#fa2d48] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả ({pendingSongs.length})
            </button>
            <button
              onClick={() => setFilterExplicit("EXPLICIT")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterExplicit === "EXPLICIT"
                  ? "bg-[#fa2d48] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Nhạy cảm (Explicit)
            </button>
            <button
              onClick={() => setFilterExplicit("CLEAN")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterExplicit === "CLEAN"
                  ? "bg-[#fa2d48] text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Phù hợp mọi lứa tuổi
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. BẢNG DANH SÁCH BÀI HÁT TOÀN MÀN HÌNH ── */}
      <div className="bg-[#181818] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredSongs.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Clock size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Không có bài hát nào chờ kiểm duyệt!</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {searchTerm || filterExplicit !== "ALL"
                ? "Không tìm thấy tác phẩm phù hợp với bộ lọc tìm kiếm hiện tại."
                : "Hàng đợi sạch sẽ. Toàn bộ các ca khúc đã được thẩm định và xử lý."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#1d1d1d] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 w-12 text-center">#</th>
                  <th className="py-3.5 pl-2">Tác phẩm</th>
                  <th className="py-3.5">Nghệ sĩ sở hữu</th>
                  <th className="py-3.5">Nghệ sĩ tham gia</th>
                  <th className="py-3.5">Thời lượng</th>
                  <th className="py-3.5">Ngày gửi</th>
                  <th className="py-3.5">Trạng thái</th>
                  <th className="py-3.5 text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredSongs.map((song, index) => {
                  const cover = song.coverImage || song.coverUrl;
                  const itemIndex = page * pageSize + index + 1;

                  return (
                    <tr
                      key={song.id}
                      onClick={() => handleOpenInspection(song)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Cột 1: STT */}
                      <td className="py-3.5 pl-4 text-center font-mono text-neutral-500 group-hover:text-white">
                        {itemIndex}
                      </td>

                      {/* Cột 2: Tác phẩm */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <CoverImage
                            src={cover}
                            alt={song.title}
                            className="w-11 h-11 rounded-lg"
                            fallbackIconSize={20}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white group-hover:text-[#fa2d48] transition-colors truncate max-w-[220px]">
                              {song.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {song.explicit && (
                                <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                  EXPLICIT
                                </span>
                              )}
                              {song.genres?.[0] && (
                                <span className="text-[10px] text-neutral-400 truncate max-w-[120px]">
                                  {song.genres[0].name || song.genres[0]}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Nghệ sĩ sở hữu */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#fa2d48]/20 text-[#fa2d48] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {song.ownerName ? song.ownerName.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="font-semibold text-neutral-200 truncate max-w-[150px]">
                            {song.ownerName || "Chưa cập nhật"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Nghệ sĩ tham gia */}
                      <td className="py-3.5 text-neutral-400">
                        {!song.artists || song.artists.length === 0 ? (
                          <span className="text-neutral-500 italic text-[11px]">Độc tấu (Solo)</span>
                        ) : (
                          <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                            {song.artists.slice(0, 2).map((a, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 truncate max-w-[90px]"
                                title={`${a.artistName} (${a.role || "Feat"})`}
                              >
                                {a.artistName}
                              </span>
                            ))}
                            {song.artists.length > 2 && (
                              <span className="text-[10px] text-neutral-500">
                                +{song.artists.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Cột 5: Thời lượng */}
                      <td className="py-3.5 font-mono text-neutral-300">
                        {formatDuration(song.durationSeconds || song.duration)}
                      </td>

                      {/* Cột 6: Ngày gửi */}
                      <td className="py-3.5 text-neutral-400 text-[11px]">
                        {formatDateTime(song.createdAt)}
                      </td>

                      {/* Cột 7: Trạng thái */}
                      <td className="py-3.5">
                        <StatusBadge status="PENDING" size="sm" />
                      </td>

                      {/* Cột 8: Nút Kiểm duyệt */}
                      <td className="py-3.5 text-right pr-4">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInspection(song);
                          }}
                          className="text-xs px-3.5 py-1.5 h-8 gap-1.5"
                        >
                          <ShieldCheck size={14} />
                          <span>Kiểm duyệt</span>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── PHÂN TRANG DANH SÁCH ── */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/[0.04] bg-[#1b1b1b] flex items-center justify-between text-xs text-neutral-400">
            <span>
              Hiển thị {filteredSongs.length} / tổng số {totalElements} bài hát
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="dark"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="text-xs"
              >
                Trang trước
              </Button>
              <span className="font-mono text-white px-2">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="dark"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
                className="text-xs"
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── BẢNG KIỂM DUYỆT BÀI HÁT CHIẾM ~80% - 85% MÀN HÌNH ── */}
      <SongModerationModal
        isOpen={Boolean(inspectingSong)}
        onClose={() => setInspectingSong(null)}
        song={inspectingSong}
        songsList={filteredSongs}
        onSelectSong={(song) => setInspectingSong(song)}
      />
    </div>
  );
};

export default PendingSongsPage;
