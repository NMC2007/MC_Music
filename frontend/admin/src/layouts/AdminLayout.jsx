import React, { useRef, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export const AdminLayout = () => {
  const location = useLocation();
  const mainRef = useRef(null);

  // Tự động cuộn lên đầu trang mỗi khi chuyển route
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="h-screen w-full bg-spotify-black flex overflow-hidden text-spotify-text p-2 sm:p-2.5 gap-2 sm:gap-2.5 select-none">
      {/* ── SIDEBAR CỐ ĐỊNH BÊN TRÁI ── */}
      <Sidebar />

      {/* ── KHUNG CHỨA NỘI DUNG CHÍNH (MAIN VIEW) ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-spotify-base rounded-2xl border border-white/[0.04]">
        {/* Topbar điều hướng */}
        <Topbar />

        {/* Nội dung trang con (Dashboard, Songs, Albums, Users, Artists) */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-5 sm:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

