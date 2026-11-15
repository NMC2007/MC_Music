import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  ChevronDown,
  ShieldAlert,
  LogOut,
  Radio,
} from "lucide-react";
import { useAuthStore } from "../store/useAuthStore";

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, logout } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy tiêu đề trang tương ứng với pathname
  const getPageInfo = () => {
    switch (location.pathname) {
      case "/":
        return {
          title: "Tổng quan Hệ thống",
          subtitle: "Thống kê chỉ số vận hành & hàng đợi kiểm duyệt nội dung",
        };
      case "/songs":
        return {
          title: "Kiểm duyệt Bài hát",
          subtitle: "Danh sách ca khúc chờ thẩm định chất lượng theo bộ 7 quy chuẩn",
        };
      case "/albums":
        return {
          title: "Kiểm duyệt Album",
          subtitle: "Danh sách album, EP & đĩa đơn chờ phê duyệt phát hành",
        };
      case "/users":
        return {
          title: "Quản lý Người dùng",
          subtitle: "Danh sách tài khoản thính giả, kiểm tra & khóa/mở khóa",
        };
      case "/artists":
        return {
          title: "Quản lý Nghệ sĩ",
          subtitle: "Danh sách tài khoản nghệ danh, kiểm soát hồ sơ & trạng thái",
        };
      default:
        return {
          title: "Admin Portal",
          subtitle: "Cổng thông tin quản trị tập trung MC Music",
        };
    }
  };

  const { title, subtitle } = getPageInfo();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-18 bg-spotify-base/90 backdrop-blur-xl px-5 sm:px-8 flex items-center justify-between transition-all select-none border-b border-white/[0.04]">
      {/* ── BÊN TRÁI: TIÊU ĐỀ TRANG DYNAMIC ── */}
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-spotify-sub hidden sm:block mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* ── BÊN PHẢI: TRẠNG THÁI HỆ THỐNG & PROFILE DROPDOWN ── */}
      <div className="flex items-center gap-3.5">
        {/* Status Indicator */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Hệ thống: Trực tuyến</span>
        </div>

        {/* Dropdown Hồ sơ Admin */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#181818] hover:bg-[#222222] border border-white/[0.06] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full bg-[#fa2d48]/20 border border-[#fa2d48]/40 text-[#fa2d48] font-bold text-xs flex items-center justify-center flex-shrink-0">
              {admin?.fullName ? admin.fullName.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="text-left hidden md:block">
              <span className="text-xs font-bold text-white max-w-[120px] truncate block group-hover:text-[#fa2d48] transition-colors">
                {admin?.fullName || "Admin"}
              </span>
              <span className="text-[10px] text-[#fa2d48] font-semibold block leading-tight">
                {admin?.role || "SUPER_ADMIN"}
              </span>
            </div>
            <ChevronDown
              size={14}
              className={`text-neutral-400 group-hover:text-white transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menu Dropdown Popup */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#1f1f1f] border border-white/[0.08] shadow-[0_20px_45px_rgba(0,0,0,0.95)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header profile info */}
              <div className="px-4 py-2.5 bg-white/[0.02] border-b border-white/[0.04]">
                <p className="text-xs font-bold text-white truncate">
                  {admin?.fullName || "Quản trị viên"}
                </p>
                <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                  {admin?.email}
                </p>
                <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-[#fa2d48]/20 text-[#fa2d48] font-bold">
                  {admin?.role || "SUPER_ADMIN"}
                </span>
              </div>

              {/* Menu Quick Links */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/");
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Radio size={15} className="text-neutral-400" />
                  <span>Bảng điều khiển tổng quan</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/songs");
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ShieldAlert size={15} className="text-[#fa2d48]" />
                  <span>Hàng đợi kiểm duyệt bài hát</span>
                </button>
              </div>

              {/* Divider & Logout */}
              <div className="pt-1 mt-1 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất Quản trị</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
