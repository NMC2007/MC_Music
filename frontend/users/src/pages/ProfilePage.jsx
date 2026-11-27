import React from "react";
import { useQuery } from "@tanstack/react-query";
import { User as UserIcon, Mail, Shield, Calendar, LogOut } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "../store/useAuthStore";
import { getCurrentUserApi, logoutApi } from "../api/auth/auth";
import { Button } from "../components/ui/Button";

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { user: storeUser, logout, refreshToken } = useAuthStore();

  const userKey = storeUser?.userId || storeUser?.id || "guest";
  const { data: profileResponse, isLoading } = useQuery({
    queryKey: ["userProfile", userKey],
    queryFn: () => getCurrentUserApi(),
    staleTime: 60000,
  });

  const user = profileResponse?.data || storeUser;

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (err) {
      console.error(err);
    } finally {
      logout();
      toast.success("Đăng xuất thành công");
      navigate("/");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Mới tham gia";
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-12">
      {/* ── HEADER ── */}
      <div className="relative flex flex-col sm:flex-row items-center sm:items-end gap-5 sm:gap-6 px-4 sm:px-8 pt-8 sm:pt-20 pb-6 sm:pb-10 bg-gradient-to-b from-[#3a151b] via-[#1a0e11] to-spotify-base border-b border-neutral-800/40">
        {/* Avatar */}
        <div className="w-28 h-28 sm:w-44 sm:h-44 rounded-full shadow-2xl overflow-hidden flex-shrink-0 bg-[#282828] border-4 border-black/40 flex items-center justify-center">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.fullName || "User Avatar"}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#282828] text-neutral-300 flex items-center justify-center">
              <svg className="w-20 h-20 sm:w-28 sm:h-28 text-neutral-400 translate-y-1.5 sm:translate-y-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>

        {/* Thông tin chính */}
        <div className="flex flex-col gap-1.5 sm:gap-2 text-center sm:text-left">
          <span className="text-xs font-bold text-white/80 uppercase tracking-widest">
            Hồ sơ cá nhân
          </span>
          <h1 className="text-2xl sm:text-5xl md:text-6xl font-black text-white leading-tight">
            {isLoading && !user ? "Đang tải..." : user?.fullName || "Người dùng"}
          </h1>
          <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-3 text-xs sm:text-sm text-spotify-sub mt-1 sm:mt-2 flex-wrap">
            <span>{user?.email}</span>
            <span>•</span>
            <span className="px-2.5 py-0.5 rounded-full bg-neutral-800 text-xs font-semibold text-white">
              {user?.role === "ROLE_ADMIN" ? "Quản trị viên" : "Thành viên"}
            </span>
          </div>
        </div>
      </div>

      {/* ── NỘI DUNG CHI TIẾT ── */}
      <div className="px-4 sm:px-8 py-6 sm:py-8 max-w-3xl">
        <h2 className="text-lg sm:text-xl font-bold text-white mb-4 sm:mb-6">Thông tin tài khoản</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {/* Card 1: Họ tên */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#fa2d48] flex-shrink-0">
              <UserIcon size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-spotify-sub font-medium">Họ và tên</span>
              <span className="text-sm font-semibold text-white mt-1 truncate">
                {user?.fullName || "Chưa cập nhật"}
              </span>
            </div>
          </div>

          {/* Card 2: Email */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#fa2d48] flex-shrink-0">
              <Mail size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-spotify-sub font-medium">Địa chỉ Email</span>
              <span className="text-sm font-semibold text-white mt-1 truncate">
                {user?.email}
              </span>
            </div>
          </div>

          {/* Card 3: Vai trò */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#fa2d48] flex-shrink-0">
              <Shield size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-spotify-sub font-medium">Quyền hạn</span>
              <span className="text-sm font-semibold text-white mt-1 truncate">
                {user?.role || "USER"}
              </span>
            </div>
          </div>

          {/* Card 4: Ngày tham gia */}
          <div className="bg-[#181818] border border-neutral-800/80 rounded-xl p-4 sm:p-5 flex items-start gap-3.5 sm:gap-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-white/5 flex items-center justify-center text-[#fa2d48] flex-shrink-0">
              <Calendar size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-spotify-sub font-medium">Ngày gia nhập</span>
              <span className="text-sm font-semibold text-white mt-1 truncate">
                {formatDate(user?.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="pt-6 border-t border-neutral-800 flex items-center gap-4">
          <Button
            variant="secondary"
            size="md"
            onClick={handleLogout}
            className="flex items-center gap-2 text-[#fa2d48] border-[#fa2d48]/40 hover:border-[#fa2d48] hover:bg-[#fa2d48]/10"
          >
            <LogOut size={18} />
            Đăng xuất
          </Button>
        </div>
      </div>
    </div>
  );
};
