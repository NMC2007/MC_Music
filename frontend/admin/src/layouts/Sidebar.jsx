import React from "react";
import { NavLink, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  LayoutDashboard,
  Music,
  Disc3,
  Users,
  UserCheck,
  ShieldAlert,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { getPendingSongsApi, getPendingAlbumsApi } from "../api/catalog";

export const Sidebar = () => {
  const navigate = useNavigate();

  // Truy vấn số lượng bài hát & album đang chờ kiểm duyệt để hiển thị badge
  const { data: songsData } = useQuery({
    queryKey: ["pendingSongsCount"],
    queryFn: () => getPendingSongsApi({ page: 0, size: 1 }),
    staleTime: 1000 * 30, // 30 giây
    refetchInterval: 1000 * 60, // polling mỗi 60 giây
  });

  const { data: albumsData } = useQuery({
    queryKey: ["pendingAlbumsCount"],
    queryFn: () => getPendingAlbumsApi({ page: 0, size: 1 }),
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60,
  });

  const pendingSongsCount = songsData?.data?.totalElements ?? 0;
  const pendingAlbumsCount = albumsData?.data?.totalElements ?? 0;

  const navItems = [
    {
      to: "/",
      label: "Tổng quan",
      icon: LayoutDashboard,
      end: true,
    },
    {
      to: "/songs",
      label: "Kiểm duyệt Bài hát",
      icon: Music,
      badge: pendingSongsCount > 0 ? pendingSongsCount : null,
      badgeColor: "bg-[#fa2d48] text-white",
    },
    {
      to: "/albums",
      label: "Kiểm duyệt Album",
      icon: Disc3,
      badge: pendingAlbumsCount > 0 ? pendingAlbumsCount : null,
      badgeColor: "bg-amber-500 text-black",
    },
    {
      to: "/users",
      label: "Quản lý Người dùng",
      icon: Users,
    },
    {
      to: "/artists",
      label: "Quản lý Nghệ sĩ",
      icon: UserCheck,
    },
  ];

  return (
    <aside className="w-64 lg:w-72 flex-shrink-0 bg-spotify-base rounded-2xl flex flex-col p-4 justify-between select-none">
      {/* ── 1. LOGO & BRAND HEADER ── */}
      <div>
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#fa2d48] flex items-center justify-center shadow-[0_0_20px_rgba(250,45,72,0.4)] flex-shrink-0">
            <ShieldAlert size={22} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-black text-white tracking-wider truncate">
              MC MUSIC
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#fa2d48] block truncate">
              Admin Portal
            </span>
          </div>
        </div>

        {/* ── 2. MENU ĐIỀU HƯỚNG CHÍNH ── */}
        <div className="space-y-1.5">
          <p className="px-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
            Hệ thống quản trị
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

                    {item.badge !== null && item.badge !== undefined && (
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-transform ${
                          isActive
                            ? "bg-white text-black"
                            : item.badgeColor || "bg-neutral-800 text-neutral-300"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* ── 3. THẺ SHORTCUT QUY TẮC KIỂM DUYỆT ── */}
        <div className="mt-8 p-4 rounded-xl bg-[#181818] border border-white/[0.04] relative overflow-hidden hidden sm:block">
          <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-[#fa2d48]/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 text-xs font-bold text-[#fa2d48] mb-1.5">
            <Sparkles size={14} /> Tiêu chuẩn phát hành
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed mb-3">
            7 Quy tắc kiểm duyệt bản quyền, âm thanh & siêu dữ liệu bài hát.
          </p>
          <button
            onClick={() => navigate("/songs")}
            className="w-full py-2 px-3 rounded-lg bg-[#242424] hover:bg-[#fa2d48] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group"
          >
            <span>Vào hàng đợi duyệt</span>
            <ExternalLink size={13} className="group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

