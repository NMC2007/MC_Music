import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  UserCheck,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { getArtistsApi, updateArtistStatusApi } from "../api/artists";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { CoverImage } from "../components/ui/CoverImage";
import { Modal } from "../components/ui/Modal";
import { SkeletonRow } from "../components/ui/Skeleton";
import { formatNumber, formatDateTime } from "../utils/formatters";

export const ArtistsPage = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL" | "ACTIVE" | "LOCKED"

  // Nghệ sĩ được chọn để xác nhận Khóa / Mở khóa
  const [targetArtist, setTargetArtist] = useState(null);

  // ── TRUY VẤN DANH SÁCH ARTIST TỪ ADMIN SERVICE ──
  const {
    data: artistsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminArtistsList", page, pageSize],
    queryFn: () => getArtistsApi({ page, size: pageSize, sort: "createdAt,desc" }),
  });

  const artistsList = artistsData?.data?.content || [];
  const totalElements = artistsData?.data?.totalElements || 0;
  const totalPages = artistsData?.data?.totalPages || 1;

  // Lọc danh sách theo từ khóa tìm kiếm và trạng thái
  const filteredArtists = artistsList.filter((artist) => {
    const q = searchTerm.toLowerCase().trim();
    const nameMatch = artist.stageName?.toLowerCase().includes(q);
    const emailMatch = artist.email?.toLowerCase().includes(q);
    const idMatch = artist.id?.toLowerCase().includes(q);
    const searchMatches = !q || nameMatch || emailMatch || idMatch;

    if (filterStatus === "ACTIVE") {
      return searchMatches && artist.isActive;
    }
    if (filterStatus === "LOCKED") {
      return searchMatches && !artist.isActive;
    }
    return searchMatches;
  });

  // ── MUTATION ĐỔI TRẠNG THÁI KHÓA / MỞ KHÓA NGHỆ SĨ ──
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateArtistStatusApi(id, isActive),
    onSuccess: (_, variables) => {
      const isLocking = !variables.isActive;
      toast.success(
        isLocking ? "Đã khóa tài khoản nghệ sĩ!" : "Đã mở khóa tài khoản nghệ sĩ thành công!",
        {
          description: `Tài khoản ${targetArtist?.stageName} (${targetArtist?.email}) hiện ${
            isLocking ? "đã bị khóa quyền truy cập Artist Studio." : "đã có thể truy cập Studio và phát hành nhạc bình thường."
          }`,
        }
      );
      queryClient.invalidateQueries({ queryKey: ["adminArtistsList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardArtistsCount"] });
      setTargetArtist(null);
    },
    onError: (err) => {
      console.error("Lỗi khi cập nhật trạng thái nghệ sĩ:", err);
      const msg = err.response?.data?.message || "Không thể cập nhật trạng thái nghệ sĩ. Vui lòng thử lại.";
      toast.error("Thao tác thất bại", { description: msg });
    },
  });

  const handleConfirmToggleStatus = () => {
    if (!targetArtist) return;
    const newStatus = !targetArtist.isActive;
    statusMutation.mutate({ id: targetArtist.id, isActive: newStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER TRANG QUẢN LÝ NGHỆ SĨ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <UserCheck className="text-emerald-400" size={26} />
            Quản Lý Nghệ Sĩ
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
              {totalElements} nghệ danh
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Danh sách toàn bộ tài khoản đối tác sáng tạo âm nhạc trên nền tảng MC Music. Quản lý trạng thái và quyền phát hành tác phẩm.
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
            placeholder="Tìm theo nghệ danh, email hoặc Artist ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#202020] text-xs text-white rounded-xl pl-10 pr-4 py-2.5 outline-none border border-neutral-700/60 focus:border-white transition-colors"
          />
        </div>

        {/* Bộ lọc Trạng thái */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-neutral-500 hidden sm:block" />
          <span className="text-xs text-neutral-400 font-semibold hidden sm:block">Trạng thái:</span>
          <div className="flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-white/[0.04] text-xs">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === "ALL"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả ({artistsList.length})
            </button>
            <button
              onClick={() => setFilterStatus("ACTIVE")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === "ACTIVE"
                  ? "bg-emerald-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Đang hoạt động
            </button>
            <button
              onClick={() => setFilterStatus("LOCKED")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                filterStatus === "LOCKED"
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Đã khóa Studio
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. BẢNG DANH SÁCH NGHỆ SĨ TOÀN MÀN HÌNH ── */}
      <div className="bg-[#181818] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredArtists.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center mb-3">
              <UserCheck size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Không tìm thấy nghệ sĩ!</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Không có tài khoản nghệ sĩ nào khớp với bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#1d1d1d] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 w-12 text-center">#</th>
                  <th className="py-3.5 pl-2">Nghệ danh & Hồ sơ</th>
                  <th className="py-3.5">Email liên hệ</th>
                  <th className="py-3.5">Người theo dõi</th>
                  <th className="py-3.5">Ngày gia nhập Studio</th>
                  <th className="py-3.5">Trạng thái Studio</th>
                  <th className="py-3.5 text-right pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredArtists.map((artist, index) => {
                  const itemIndex = page * pageSize + index + 1;
                  const isActive = Boolean(artist.isActive);

                  return (
                    <tr key={artist.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Cột 1: STT */}
                      <td className="py-3.5 pl-4 text-center font-mono text-neutral-500">
                        {itemIndex}
                      </td>

                      {/* Cột 2: Nghệ danh & Hồ sơ */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <CoverImage
                            src={artist.avatarUrl}
                            alt={artist.stageName}
                            isArtist
                            className="w-10 h-10 rounded-full"
                            fallbackIconSize={18}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]">
                              {artist.stageName || "Nghệ sĩ"}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]" title={artist.id}>
                              ID: {artist.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Email */}
                      <td className="py-3.5 text-neutral-300 font-medium">
                        {artist.email}
                      </td>

                      {/* Cột 4: Người theo dõi */}
                      <td className="py-3.5 font-mono text-neutral-300">
                        {formatNumber(artist.followerCount || 0)} fan
                      </td>

                      {/* Cột 5: Ngày gia nhập */}
                      <td className="py-3.5 text-neutral-400 text-[11px]">
                        {formatDateTime(artist.createdAt)}
                      </td>

                      {/* Cột 6: Trạng thái Studio */}
                      <td className="py-3.5">
                        <StatusBadge status={isActive ? "ACTIVE" : "LOCKED"} size="sm" />
                      </td>

                      {/* Cột 7: Nút Khóa / Mở khóa Studio */}
                      <td className="py-3.5 text-right pr-4">
                        {isActive ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setTargetArtist(artist)}
                            className="text-xs px-3 py-1 h-7.5 gap-1.5"
                          >
                            <Lock size={12} />
                            <span>Khóa Studio</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setTargetArtist(artist)}
                            className="text-xs px-3 py-1 h-7.5 gap-1.5 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10 hover:border-emerald-500"
                          >
                            <Unlock size={12} />
                            <span>Mở khóa</span>
                          </Button>
                        )}
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
              Hiển thị {filteredArtists.length} / tổng số {totalElements} nghệ sĩ
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

      {/* ── MODAL XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN NGHỆ SĨ ── */}
      <Modal
        isOpen={Boolean(targetArtist)}
        onClose={() => setTargetArtist(null)}
        title={targetArtist?.isActive ? "Xác nhận Khóa Tài khoản Nghệ sĩ" : "Xác nhận Mở khóa Tài khoản Nghệ sĩ"}
        description="Thao tác này sẽ cập nhật quyền truy cập Artist Studio và phát hành âm nhạc của nghệ sĩ."
        maxWidth="max-w-md"
      >
        {targetArtist && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                targetArtist.isActive
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              }`}
            >
              {targetArtist.isActive ? (
                <ShieldAlert size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                {targetArtist.isActive ? (
                  <p>
                    Bạn có chắc chắn muốn <strong>khóa quyền Studio</strong> của nghệ sĩ{" "}
                    <span className="text-white font-bold">{targetArtist.stageName}</span> (
                    {targetArtist.email})? Nghệ sĩ này sẽ <strong>không thể đăng nhập Artist Studio</strong> và không thể đăng tải thêm bài hát/album mới.
                  </p>
                ) : (
                  <p>
                    Bạn có chắc chắn muốn <strong>mở khóa quyền Studio</strong> cho nghệ sĩ{" "}
                    <span className="text-white font-bold">{targetArtist.stageName}</span> (
                    {targetArtist.email})? Nghệ sĩ sẽ được phép đăng nhập lại Artist Studio và tiếp tục phát hành âm nhạc.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.04]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTargetArtist(null)}
                disabled={statusMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant={targetArtist.isActive ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirmToggleStatus}
                isLoading={statusMutation.isPending}
                className="px-5"
              >
                {targetArtist.isActive ? (
                  <>
                    <Lock size={14} /> Khóa Studio
                  </>
                ) : (
                  <>
                    <Unlock size={14} /> Mở khóa Studio
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ArtistsPage;
