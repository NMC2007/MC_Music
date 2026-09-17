import React from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomPlayer } from './BottomPlayer';

export const MainLayout = () => {
  return (
    <div className="h-screen w-full bg-spotify-black flex flex-col overflow-hidden text-spotify-text">
      {/* Khung chứa Sidebar và Main Content */}
      <div className="flex-1 flex overflow-hidden p-2 gap-2">
        {/* Sidebar cố định bên trái */}
        <Sidebar />
        
        {/* Vùng nội dung chính (Được bo tròn) */}
        <div className="flex-1 flex flex-col relative overflow-hidden bg-spotify-base rounded-lg">
          <Topbar />
          {/* Outlet là nơi render các trang (Home, Search,...). pt-16 để chừa chỗ cho Topbar (h-16) */}
          <main className="flex-1 overflow-y-auto scrollbar-thin px-6 pb-6 pt-20">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Thanh Player cố định dưới cùng */}
      <BottomPlayer />
    </div>
  );
};
