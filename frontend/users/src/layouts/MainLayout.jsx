import React, { useRef, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomPlayer } from './BottomPlayer';
import { MobileBottomNav } from './MobileBottomNav';

export const MainLayout = () => {
  const location = useLocation();
  const mainRef = useRef(null);

  // Tự động cuộn lên đầu trang mỗi khi chuyển route
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  return (
    <div className="h-[100dvh] w-full bg-spotify-black flex flex-col overflow-hidden text-spotify-text">
      {/* Khung chứa Sidebar và Main Content */}
      <div className="flex-1 flex overflow-hidden p-0 md:p-2 gap-0 md:gap-2">
        {/* Sidebar cố định bên trái (chỉ hiển thị từ tablet/desktop trở lên) */}
        <Sidebar />
        
        {/* Vùng nội dung chính (Được bo tròn trên desktop) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-spotify-base md:rounded-lg">
          <Topbar />
          {/* Outlet là nơi render các trang (Home, Search,...). pt-16 để chừa chỗ cho Topbar (h-16).
              pb-36 trên mobile để chừa chỗ cho BottomPlayer và MobileBottomNav */}
          <main
            ref={mainRef}
            className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 md:px-6 pt-16 md:pt-20 pb-36 md:pb-6"
          >
            <Outlet />
          </main>
        </div>
      </div>

      {/* Thanh Player cố định dưới cùng */}
      <BottomPlayer />

      {/* Thanh Điều hướng dưới cùng dành riêng cho thiết bị di động */}
      <MobileBottomNav />
    </div>
  );
};
