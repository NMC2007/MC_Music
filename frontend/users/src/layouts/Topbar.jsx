import React from 'react';
import { Search, ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Button } from '../components/ui/Button';

export const Topbar = () => {
  const navigate = useNavigate();

  return (
    <header className="absolute top-0 left-0 w-full h-16 bg-spotify-base/80 backdrop-blur-md z-40 flex items-center justify-between px-6 transition-all rounded-t-lg">
      {/* Điều hướng & Tìm kiếm */}
      <div className="flex items-center gap-4 flex-1">
        {/* Nút Back/Forward */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" iconOnly onClick={() => navigate(-1)} className="bg-black/50" tooltip="Quay lại" tooltipPosition="bottom-left">
            <ChevronLeft size={20} />
          </Button>
          <Button variant="ghost" size="sm" iconOnly onClick={() => navigate(1)} className="bg-black/50" tooltip="Tiếp theo" tooltipPosition="bottom">
            <ChevronRight size={20} />
          </Button>
        </div>
        
        {/* Nút Home */}
        <Button variant="white" size="md" iconOnly onClick={() => navigate('/')} className="ml-2" tooltip="Trang chủ" tooltipPosition="bottom">
          <Home size={24} />
        </Button>

        {/* Thanh tìm kiếm */}
        <div className="relative max-w-sm w-full hidden md:block group">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-sub group-focus-within:text-white" />
          <input
            type="text"
            placeholder="Bạn muốn nghe gì?"
            className="w-full bg-spotify-card hover:bg-spotify-card-hover text-spotify-text placeholder-spotify-sub rounded-full pl-10 pr-4 py-3 outline-none focus:ring-2 focus:ring-white transition-all border-none"
          />
        </div>
      </div>

      {/* Hành động của người dùng (Auth) */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="md" className="hidden sm:flex" onClick={() => navigate('/register')}>
          Đăng ký
        </Button>
        <Button variant="white" size="md" onClick={() => navigate('/login')}>
          Đăng nhập
        </Button>
      </div>
    </header>
  );
};
