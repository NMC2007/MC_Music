import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import {
  Plus,
  ChevronDown,
  User,
  Image as ImageIcon,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "#/store/useAuthStore";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";

export const Topbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { artist, logout } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Lấy tiêu đề trang tương ứng với pathname
  const getPageInfo = () => {
    switch (location.pathname) {
      case "/":
        return { title: "Tổng quan Studio", subtitle: "Thống kê hoạt động & thành tích tác phẩm" };
      case "/songs":
        return { title: "Quản lý Bài hát", subtitle: "Danh sách tác phẩm, tải lên & kiểm duyệt" };
      case "/albums":
        return { title: "Bộ sưu tập Album", subtitle: "Album, EP & Đĩa đơn chính thức" };
      case "/profile":
        return { title: "Hồ sơ Nghệ sĩ", subtitle: "Cập nhật thông tin thương hiệu & hình ảnh" };
      default:
        return { title: "Artist Studio", subtitle: "Cổng thông tin quản trị âm nhạc" };
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

  const handleOpenOnboarding = () => {
    setIsDropdownOpen(false);
    window.dispatchEvent(new CustomEvent("open-artist-onboarding"));
  };

  const handleQuickUpload = () => {
    navigate("/songs?action=upload");
  };

  return (
    <header className="sticky top-0 z-30 h-18 bg-spotify-base/90 backdrop-blur-xl px-6 flex items-center justify-between transition-all select-none">
      {/* ── BÊN TRÁI: TIÊU ĐỀ TRANG DYNAMIC ── */}
      <div>
        <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
          {title}
        </h2>
        <p className="text-xs text-spotify-sub hidden sm:block mt-0.5">
          {subtitle}
        </p>
      </div>

      {/* ── BÊN PHẢI: HÀNH ĐỘNG NHANH & PROFILE DROPDOWN ── */}
      <div className="flex items-center gap-4">
        {/* Nút "+ Tải nhạc mới" */}
        <Button
          variant="primary"
          size="sm"
          onClick={handleQuickUpload}
          className="shadow-[0_4px_16px_rgba(250,45,72,0.3)] hidden sm:flex"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Tải nhạc mới</span>
        </Button>

        {/* Dropdown Hồ sơ Nghệ sĩ */}
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full bg-[#181818] hover:bg-[#222222] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
              <CoverImage
                src={artist?.avatarUrl}
                alt={artist?.stageName}
                className="w-full h-full object-cover"
                isArtist
              />
            </div>
            <span className="text-xs font-bold text-white max-w-[120px] truncate hidden md:inline-block group-hover:text-[#fa2d48] transition-colors">
              {artist?.stageName || "Nghệ sĩ"}
            </span>
            <ChevronDown
              size={14}
              className={`text-neutral-400 group-hover:text-white transition-transform duration-200 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Menu Dropdown Popup */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1f1f1f] shadow-[0_20px_45px_rgba(0,0,0,0.95)] py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* Header profile info */}
              <div className="px-4 py-2.5 bg-white/[0.02]">
                <p className="text-xs font-bold text-white truncate">
                  {artist?.stageName || "Nghệ sĩ"}
                </p>
                <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                  {artist?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate("/profile");
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <User size={15} className="text-neutral-400" />
                  <span>Trang hồ sơ cá nhân</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenOnboarding}
                  className="w-full px-4 py-2 text-left text-xs text-neutral-300 hover:text-white hover:bg-white/5 flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <ImageIcon size={15} className="text-neutral-400" />
                  <span>Cập nhật ảnh đại diện / bìa</span>
                </button>
              </div>

              {/* Divider & Logout */}
              <div className="pt-1 mt-1 bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer font-medium"
                >
                  <LogOut size={15} />
                  <span>Đăng xuất Studio</span>
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
