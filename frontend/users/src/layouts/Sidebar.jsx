import React from 'react';
import { Home, Search, Library, Plus } from 'lucide-react';
import { Link } from 'react-router';

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-spotify-black flex-shrink-0 flex flex-col p-2 gap-2 h-full z-10">
      {/* Top menu */}
      <div className="bg-spotify-base rounded-lg p-4 flex flex-col gap-5">
        <Link to="/" className="flex items-center gap-4 text-spotify-sub hover:text-white transition cursor-pointer font-bold">
          <Home size={24} />
          <span>Trang chủ</span>
        </Link>
        <Link to="/search" className="flex items-center gap-4 text-spotify-sub hover:text-white transition cursor-pointer font-bold">
          <Search size={24} />
          <span>Tìm kiếm</span>
        </Link>
      </div>
      
      {/* Library */}
      <div className="bg-spotify-base rounded-lg flex-1 flex flex-col p-2 overflow-hidden">
        <div className="flex items-center justify-between p-2 text-spotify-sub hover:text-white transition cursor-pointer font-bold">
          <div className="flex items-center gap-2">
            <Library size={24} />
            <span>Thư viện</span>
          </div>
          <button className="hover:bg-spotify-hover p-1.5 rounded-full transition text-spotify-sub hover:text-white">
            <Plus size={20} />
          </button>
        </div>
        
        {/* Nơi chứa các Playlist tạo sẵn hoặc Box gợi ý */}
        <div className="flex-1 overflow-y-auto scrollbar-thin mt-2 p-2">
          <div className="bg-spotify-card p-4 rounded-lg mb-4">
            <h4 className="font-bold mb-2">Tạo danh sách phát đầu tiên</h4>
            <p className="text-sm text-spotify-text mb-5">Rất dễ, chúng tôi sẽ giúp bạn</p>
            <button className="bg-white text-black font-bold py-1.5 px-4 rounded-full text-sm hover:scale-105 transition-transform">
              Tạo danh sách phát
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
