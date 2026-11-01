import React from "react";
import { NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Music,
  Disc3,
  UserCheck,
  Music2,
  LogOut,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useAuthStore } from "#/store/useAuthStore";
import { CoverImage } from "#/components/ui/CoverImage";

export const Sidebar = () => {
  const { artist, logout } = useAuthStore();
  const navigate = useNavigate();

  const navItems = [
    {
      to: "/",
      label: "Tổng quan",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/songs",
      label: "Quản lý Bài hát",
      icon: Music,
      badge: "Nhạc",
    },
    {
      to: "/albums",
      label: "Bộ sưu tập Album",
      icon: Disc3,
    },
    {
      to: "/profile",
      label: "Hồ sơ Nghệ sĩ",
      icon: UserCheck,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 bg-spotify-base rounded-2xl flex flex-col p-4 justify-between select-none">
      {/* ── 1. LOGO & BRAND HEADER ── */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#fa2d48] flex items-center justify-center shadow-[0_0_20px_rgba(250,45,72,0.4)] flex-shrink-0">
            <Music2 size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-white tracking-wider truncate">
              MC MUSIC
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#fa2d48] block truncate">
              Artist Studio
            </span>
          </div>
        </div>

        {/* ── 2. MENU ĐIỀU HƯỚNG CHÍNH ── */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Quản trị nội dung
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group ${
                    isActive
                      ? "bg-[#fa2d48] text-white shadow-[0_4px_16px_rgba(250,45,72,0.35)] scale-[1.01]"
                      : "text-spotify-sub hover:text-white hover:bg-neutral-800/60"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        size={18}
                        className={`transition-colors flex-shrink-0 ${
                          isActive
                            ? "text-white"
                            : "text-neutral-400 group-hover:text-white"
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && !isActive && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 font-medium">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ── 3. THẺ SHORTCUT SÁNG TẠO ── */}
        <div className="mt-8 p-4 rounded-xl bg-[#181818] relative overflow-hidden hidden sm:block">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#fa2d48]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-xs font-bold text-[#fa2d48] mb-1.5">
            <Sparkles size={14} /> Sẵn sàng phát hành?
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
            Tải lên bản nhạc mới hoặc tạo album để mở rộng tiếp cận khán giả.
          </p>
          <button
            onClick={() => navigate("/songs?action=upload")}
            className="w-full py-2 px-3 rounded-lg bg-[#242424] hover:bg-[#fa2d48] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
          >
            <UploadCloud size={14} className="group-hover:scale-110 transition-transform" />
            Tải nhạc lên ngay
          </button>
        </div>
      </div>

      {/* ── 4. THÔNG TIN NGHỆ SĨ & ĐĂNG XUẤT (FOOTER) ── */}
      <div className="pt-3">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#181818]">
          <div
            onClick={() => navigate("/profile")}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1"
          >
            <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0">
              <CoverImage
                src={artist?.avatarUrl}
                alt={artist?.stageName}
                className="w-full h-full object-cover"
                isArtist
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate group-hover:text-[#fa2d48] transition-colors">
                {artist?.stageName || "Nghệ sĩ"}
              </p>
              <p className="text-[10px] text-neutral-500 truncate">
                {artist?.email || "artist@mcmusic.vn"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer flex-shrink-0 ml-1.5"
            title="Đăng xuất"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
