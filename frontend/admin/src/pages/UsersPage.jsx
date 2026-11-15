import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Search,
  RefreshCw,
  Lock,
  Unlock,
  CheckCircle2,
  Filter,
  ShieldAlert,
} from "lucide-react";
import { toast } from "sonner";

import { getUsersApi, updateUserStatusApi } from "../api/users";
import { Button } from "../components/ui/Button";
import { StatusBadge } from "../components/ui/StatusBadge";
import { Modal } from "../components/ui/Modal";
import { SkeletonRow } from "../components/ui/Skeleton";
import { formatDateTime } from "../utils/formatters";

export const UsersPage = () => {
  const queryClient = useQueryClient();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(15);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL"); // "ALL" | "ACTIVE" | "LOCKED"

  // User được chọn để xác nhận Khóa / Mở khóa
  const [targetUser, setTargetUser] = useState(null);

  // ── TRUY VẤN DANH SÁCH USER TỪ ADMIN SERVICE ──
  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["adminUsersList", page, pageSize],
    queryFn: () => getUsersApi({ page, size: pageSize, sort: "createdAt,desc" }),
  });

  const usersList = usersData?.data?.content || [];
  const totalElements = usersData?.data?.totalElements || 0;
  const totalPages = usersData?.data?.totalPages || 1;

  // Lọc danh sách theo từ khóa tìm kiếm và trạng thái
  const filteredUsers = usersList.filter((user) => {
    const q = searchTerm.toLowerCase().trim();
    const nameMatch = user.fullName?.toLowerCase().includes(q);
    const emailMatch = user.email?.toLowerCase().includes(q);
    const idMatch = user.id?.toLowerCase().includes(q);
    const searchMatches = !q || nameMatch || emailMatch || idMatch;

    if (filterStatus === "ACTIVE") {
      return searchMatches && user.isActive;
    }
    if (filterStatus === "LOCKED") {
      return searchMatches && !user.isActive;
    }
    return searchMatches;
  });

  // ── MUTATION ĐỔI TRẠNG THÁI KHÓA / MỞ KHÓA ──
  const statusMutation = useMutation({
    mutationFn: ({ id, isActive }) => updateUserStatusApi(id, isActive),
    onSuccess: (_, variables) => {
      const isLocking = !variables.isActive;
      toast.success(
        isLocking ? "Đã khóa tài khoản người dùng!" : "Đã mở khóa tài khoản thành công!",
        {
          description: `Tài khoản ${targetUser?.email} hiện ${
            isLocking ? "đã bị vô hiệu hóa đăng nhập." : "đã có thể đăng nhập bình thường."
          }`,
        }
      );
      queryClient.invalidateQueries({ queryKey: ["adminUsersList"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardUsersCount"] });
      setTargetUser(null);
    },
    onError: (err) => {
      console.error("Lỗi khi cập nhật trạng thái người dùng:", err);
      const msg = err.response?.data?.message || "Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.";
      toast.error("Thao tác thất bại", { description: msg });
    },
  });

  const handleConfirmToggleStatus = () => {
    if (!targetUser) return;
    const newStatus = !targetUser.isActive;
    statusMutation.mutate({ id: targetUser.id, isActive: newStatus });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ── 1. HEADER TRANG QUẢN LÝ NGƯỜI DÙNG ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-sky-400" size={26} />
            Quản Lý Người Dùng
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-500/20 text-sky-400 font-bold">
              {totalElements} thính giả
            </span>
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Danh sách toàn bộ tài khoản thính giả trong hệ sinh thái MC Music. Hỗ trợ tra cứu và khóa/mở khóa tài khoản khi có vi phạm.
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
            placeholder="Tìm theo họ tên, email hoặc User ID..."
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
                  ? "bg-sky-500 text-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Tất cả ({usersList.length})
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
              Đã khóa
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. BẢNG DANH SÁCH NGƯỜI DÙNG TOÀN MÀN HÌNH ── */}
      <div className="bg-[#181818] border border-white/[0.06] rounded-2xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="p-6 space-y-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            <div className="w-14 h-14 rounded-full bg-sky-500/10 text-sky-400 mx-auto flex items-center justify-center mb-3">
              <Users size={28} />
            </div>
            <h3 className="text-base font-bold text-white">Không tìm thấy người dùng!</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              Không có tài khoản người dùng nào khớp với bộ lọc hoặc từ khóa tìm kiếm.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#1d1d1d] text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                  <th className="py-3.5 pl-4 w-12 text-center">#</th>
                  <th className="py-3.5 pl-2">Người dùng</th>
                  <th className="py-3.5">Email</th>
                  <th className="py-3.5">Vai trò</th>
                  <th className="py-3.5">Ngày đăng ký</th>
                  <th className="py-3.5">Trạng thái</th>
                  <th className="py-3.5 text-right pr-4">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {filteredUsers.map((user, index) => {
                  const itemIndex = page * pageSize + index + 1;
                  const isActive = Boolean(user.isActive);

                  return (
                    <tr key={user.id} className="hover:bg-white/[0.03] transition-colors">
                      {/* Cột 1: STT */}
                      <td className="py-3.5 pl-4 text-center font-mono text-neutral-500">
                        {itemIndex}
                      </td>

                      {/* Cột 2: Thông tin Người dùng */}
                      <td className="py-3.5 pl-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold text-xs flex items-center justify-center flex-shrink-0">
                            {user.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate max-w-[200px]">
                              {user.fullName || "Người dùng"}
                            </p>
                            <p className="text-[10px] text-neutral-500 font-mono truncate max-w-[150px]" title={user.id}>
                              ID: {user.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Cột 3: Email */}
                      <td className="py-3.5 text-neutral-300 font-medium">
                        {user.email}
                      </td>

                      {/* Cột 4: Vai trò */}
                      <td className="py-3.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 uppercase tracking-wider">
                          Thính giả
                        </span>
                      </td>

                      {/* Cột 5: Ngày đăng ký */}
                      <td className="py-3.5 text-neutral-400 text-[11px]">
                        {formatDateTime(user.createdAt)}
                      </td>

                      {/* Cột 6: Trạng thái */}
                      <td className="py-3.5">
                        <StatusBadge status={isActive ? "ACTIVE" : "LOCKED"} size="sm" />
                      </td>

                      {/* Cột 7: Nút Khóa / Mở khóa */}
                      <td className="py-3.5 text-right pr-4">
                        {isActive ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setTargetUser(user)}
                            className="text-xs px-3 py-1 h-7.5 gap-1.5"
                          >
                            <Lock size={12} />
                            <span>Khóa</span>
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setTargetUser(user)}
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
              Hiển thị {filteredUsers.length} / tổng số {totalElements} người dùng
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

      {/* ── MODAL XÁC NHẬN KHÓA / MỞ KHÓA TÀI KHOẢN NGƯỜI DÙNG ── */}
      <Modal
        isOpen={Boolean(targetUser)}
        onClose={() => setTargetUser(null)}
        title={targetUser?.isActive ? "Xác nhận Khóa Tài khoản Người dùng" : "Xác nhận Mở khóa Tài khoản"}
        description="Thao tác này sẽ cập nhật trạng thái truy cập ứng dụng của người dùng."
        maxWidth="max-w-md"
      >
        {targetUser && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                targetUser.isActive
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-300"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
              }`}
            >
              {targetUser.isActive ? (
                <ShieldAlert size={20} className="text-rose-400 flex-shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs leading-relaxed">
                {targetUser.isActive ? (
                  <p>
                    Bạn có chắc chắn muốn <strong>khóa</strong> tài khoản của{" "}
                    <span className="text-white font-bold">{targetUser.fullName}</span> (
                    {targetUser.email})? Người dùng này sẽ <strong>bị đăng xuất và không thể đăng nhập</strong> vào hệ thống.
                  </p>
                ) : (
                  <p>
                    Bạn có chắc chắn muốn <strong>mở khóa</strong> cho tài khoản của{" "}
                    <span className="text-white font-bold">{targetUser.fullName}</span> (
                    {targetUser.email})? Người dùng sẽ được phép đăng nhập lại bình thường.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.04]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setTargetUser(null)}
                disabled={statusMutation.isPending}
              >
                Hủy bỏ
              </Button>
              <Button
                variant={targetUser.isActive ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirmToggleStatus}
                isLoading={statusMutation.isPending}
                className="px-5"
              >
                {targetUser.isActive ? (
                  <>
                    <Lock size={14} /> Khóa tài khoản
                  </>
                ) : (
                  <>
                    <Unlock size={14} /> Mở khóa
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

export default UsersPage;
