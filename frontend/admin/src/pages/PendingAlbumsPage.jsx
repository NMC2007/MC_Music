import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Disc3,
  Search,
  RefreshCw,
  ShieldCheck,
  Clock,
  Filter,
} from "lucide-react";

import { getPendingAlbumsApi } from "../api/catalog";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CoverImage } from "../components/ui/CoverImage";
import { SkeletonRow } from "../components/ui/Skeleton";
import { AlbumModerationModal } from "../components/moderation/AlbumModerationModal";
import { formatDate, formatDateTime } from "../utils/formatters";

export const PendingAlbumsPage = () => {
  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // "ALL" | "ALBUM" | "EP" | "SINGLE"

  // Album đang được mở trong Bảng thẩm định 80% màn hình
  const [inspectingAlbum, setInspectingAlbum] = useState(null);

  // ── TRUY VẤN DANH SÁCH ALBUM PENDING TỪ CATALOG SERVICE ──
  const {
    data: albumsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminPendingAlbumsList", page, pageSize],
    queryFn: () => getPendingAlbumsApi({ page, size: pageSize, sort: "createdAt,desc" }),
  });

  const pendingAlbums = albumsData?.data?.content || [];
  const totalElements = albumsData?.data?.totalElements || 0;
  const totalPages = albumsData?.data?.totalPages || 1;

  // Lọc album theo từ khóa tìm kiếm và loại album
  const filteredAlbums = pendingAlbums.filter((album) => {
    const q = searchTerm.toLowerCase().trim();
    const titleMatch = album.title?.toLowerCase().includes(q);
    const ownerMatch = album.ownerName?.toLowerCase().includes(q);
    const searchMatches = !q || titleMatch || ownerMatch;

    if (filterType !== "ALL") {
      return searchMatches && album.albumType === filterType;
    }
    return searchMatches;
  });

  const handleOpenInspection = (album) => {
    setInspectingAlbum(album);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER TRANG DANH SÁCH ALBUM ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Disc3 className="text-amber-400" size={26} />
            Kiểm Duyệt Album
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
              {totalElements} chờ xử lý
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Danh sách Album/EP chờ kiểm duyệt. Nhấn vào bất kỳ album nào để mở Bảng thẩm định chi tiết, nghe thử tracklist và phê duyệt.
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
            placeholder="Tìm theo tên album, nghệ sĩ sở hữu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#202020] text-xs text-white rounded-xl pl-10 pr-4 py-2.5 outline-none border border-neutral-700/60 focus:border-white transition-colors"
          />
        </div>

        {/* Bộ lọc Loại Album */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-500 hidden sm:block" />
          <span className="text-xs text-neutral-400 font-semibold hidden sm:block">Loại phát hành:</span>
          <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-white/[0.04] text-xs">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === "ALL"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả ({pendingAlbums.length})
            </button>
            <button
              onClick={() => setFilterType("ALBUM")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === "ALBUM"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Album
            </button>
            <button
              onClick={() => setFilterType("EP")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === "EP"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              EP
            </button>
            <button
              onClick={() => setFilterType("SINGLE")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterType === "SINGLE"
                  ? "bg-amber-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Single
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. BẢNG DANH SÁCH ALBUM TOÀN MÀN HÌNH ── */}
      <div className="bg-[#181818] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredAlbums.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <Clock size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Không có album nào chờ kiểm duyệt!</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              {searchTerm || filterType !== "ALL"
                ? "Không tìm thấy album phù hợp với bộ lọc tìm kiếm hiện tại."
                : "Hàng đợi sạch sẽ. Toàn bộ các bộ sưu tập album đã được thẩm định và xử lý."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#1d1d1d] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 w-12 text-center">#</th>
                  <th className="py-3.5 pl-2">Bộ sưu tập Album</th>
                  <th className="py-3.5">Nghệ sĩ sở hữu</th>
                  <th className="py-3.5">Số ca khúc</th>
                  <th className="py-3.5">Ngày phát hành</th>
                  <th className="py-3.5">Ngày gửi duyệt</th>
                  <th className="py-3.5">Trạng thái</th>
                  <th className="py-3.5 text-right pr-4">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredAlbums.map((album, index) => {
                  const cover = album.coverImage || album.coverUrl;
                  const itemIndex = page * pageSize + index + 1;

                  return (
                    <tr
                      key={album.id}
                      onClick={() => handleOpenInspection(album)}
                      className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    >
                      {/* Cột 1: STT */}
                      <td className="py-3.5 pl-4 text-center font-mono text-neutral-500 group-hover:text-white">
                        {itemIndex}
                      </td>

                      {/* Cột 2: Bộ sưu tập Album */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <CoverImage
                            src={cover}
                            alt={album.title}
                            isAlbum
                            className="w-11 h-11 rounded-lg"
                            fallbackIconSize={20}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white group-hover:text-amber-400 transition-colors truncate max-w-[220px]">
                              {album.title}
                            </p>
                            <span className="inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/25 uppercase">
                              {album.albumType || "ALBUM"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Nghệ sĩ sở hữu */}
                      <td className="py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                            {album.ownerName ? album.ownerName.charAt(0).toUpperCase() : "A"}
                          </div>
                          <span className="font-semibold text-neutral-200 truncate max-w-[150px]">
                            {album.ownerName || "Chưa cập nhật"}
                          </span>
                        </div>
                      </td>

                      {/* Cột 4: Số lượng ca khúc */}
                      <td className="py-3.5 font-mono text-neutral-300">
                        {album.totalTracks || 0} bài hát
                      </td>

                      {/* Cột 5: Ngày phát hành */}
                      <td className="py-3.5 text-neutral-400 font-mono text-[11px]">
                        {formatDate(album.releaseDate)}
                      </td>

                      {/* Cột 6: Ngày gửi duyệt */}
                      <td className="py-3.5 text-neutral-400 text-[11px]">
                        {formatDateTime(album.createdAt)}
                      </td>

                      {/* Cột 7: Trạng thái */}
                      <td className="py-3.5">
                        <StatusBadge status="PENDING" size="sm" />
                      </td>

                      {/* Cột 8: Nút Kiểm duyệt */}
                      <td className="py-3.5 text-right pr-4">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenInspection(album);
                          }}
                          className="text-xs px-3.5 py-1.5 h-8 gap-1.5 hover:border-amber-400 hover:text-amber-400"
                        >
                          <ShieldCheck size={14} className="text-amber-400" />
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
              Hiển thị {filteredAlbums.length} / tổng số {totalElements} album
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

      {/* ── BẢNG KIỂM DUYỆT ALBUM CHIẾM ~80% - 85% MÀN HÌNH ── */}
      <AlbumModerationModal
        isOpen={Boolean(inspectingAlbum)}
        onClose={() => setInspectingAlbum(null)}
        album={inspectingAlbum}
        albumsList={filteredAlbums}
        onSelectAlbum={(album) => setInspectingAlbum(album)}
      />
    </div>
  );
};

export default PendingAlbumsPage;
