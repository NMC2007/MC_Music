import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, User, LogOut, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { logoutApi, getCurrentUserApi } from '../api/auth/auth';

export const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const { user, isAuthenticated, logout, setUser, refreshToken } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Tự động tải avatarUrl và thông tin profile mới nhất nếu chưa có
  useEffect(() => {
    if (isAuthenticated && !user?.avatarUrl) {
      getCurrentUserApi()
        .then((res) => {
          if (res?.data?.avatarUrl) {
            setUser({ ...user, avatarUrl: res.data.avatarUrl });
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated, user, setUser]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    try {
      if (refreshToken) {
        await logoutApi(refreshToken);
      }
    } catch (err) {
      console.warn('Lỗi khi thu hồi token từ server:', err);
    } finally {
      logout();
      toast.success('Đã đăng xuất thành công');
      navigate('/');
    }
  };

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
        <Button
          variant="dark"
          size="md"
          iconOnly
          onClick={() => navigate('/')}
          className={`ml-2 bg-[#1f1f1f] hover:bg-[#282828] transition-all ${
            isHome ? 'text-white' : 'text-[#b3b3b3] hover:text-white'
          }`}
          tooltip="Trang chủ"
          tooltipPosition="bottom"
        >
          {isHome ? (
            /* Icon Home dạng tô đậm (Filled) */
            <svg
              role="img"
              height="24"
              width="24"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" />
            </svg>
          ) : (
            /* Icon Home dạng viền (Outlined) */
            <svg
              role="img"
              height="24"
              width="24"
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33A2 2 0 0 1 22 7.577V21a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-5h-3v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z" />
            </svg>
          )}
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
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
            {/* User Pill Button */}
            <button
              onClick={() => setIsDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-1 pr-3 bg-black/60 hover:bg-[#282828] text-white rounded-full transition-all border border-neutral-800 hover:border-neutral-700 cursor-pointer"
            >
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User Avatar'}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-neutral-700/80"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#282828] border border-neutral-700/80 flex items-center justify-center text-neutral-300 overflow-hidden flex-shrink-0 shadow-sm">
                  <svg className="w-5 h-5 text-neutral-300 translate-y-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
              <span className="text-sm font-semibold max-w-[130px] truncate">
                {user?.fullName || user?.email?.split('@')[0] || 'Người dùng'}
              </span>
              <ChevronDown
                size={16}
                className={`text-neutral-400 transition-transform duration-200 ${
                  isDropdownOpen ? 'rotate-180 text-white' : ''
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-neutral-700/60 mb-1">
                  <p className="text-xs text-neutral-400">Tài khoản</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.fullName || user?.email}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-200 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <User size={16} className="text-neutral-400" />
                  <span>Xem trang cá nhân</span>
                </button>

                <div className="border-t border-neutral-700/60 my-1" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-[#fa2d48] hover:text-[#ff4b63] hover:bg-white/10 transition-colors text-left cursor-pointer"
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button
              variant="secondary"
              size="md"
              className="hidden sm:flex"
              onClick={() => navigate('/register')}
            >
              Đăng ký
            </Button>
            <Button variant="white" size="md" onClick={() => navigate('/login')}>
              Đăng nhập
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
