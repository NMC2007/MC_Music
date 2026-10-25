import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, User, LogOut, ChevronDown, X } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { logoutApi, getCurrentUserApi } from '../api/auth/auth';
import { searchCatalogApi } from '../api/catalog/public';
import { CoverImage } from '../components/ui/CoverImage';

// ─── Debounce hook ────────────────────────────────────────────────────────────
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
};

export const Topbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isHome = location.pathname === '/';
  const isSearchPage = location.pathname === '/search';

  const { user, isAuthenticated, logout, setUser, refreshToken } = useAuthStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ── Search state ────────────────────────────────────────────────────────
  const [inputValue, setInputValue] = useState(searchParams.get('q') || '');
  const [isFocused, setIsFocused] = useState(false);
  const debouncedKeyword = useDebounce(inputValue.trim(), 350);
  const inputRef = useRef(null);
  const suggestBoxRef = useRef(null);

  // Đồng bộ inputValue khi URL thay đổi (ví dụ khi người dùng back/forward)
  useEffect(() => {
    if (isSearchPage) {
      const q = searchParams.get('q') || '';
      if (q !== inputValue) {
        setInputValue(q);
      }
    } else {
      // Nếu rời khỏi trang search, không xóa input để UX mượt hơn
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, searchParams]);

  // ── Fetch gợi ý tìm kiếm (debounced) ────────────────────────────────────
  const { data: suggestData, isLoading: isLoadingSuggest } = useQuery({
    queryKey: ['searchSuggest', debouncedKeyword],
    queryFn: () => searchCatalogApi(debouncedKeyword, 5),
    enabled: debouncedKeyword.length > 0 && isFocused,
    staleTime: 1000 * 20,
  });

  const suggestResult = suggestData?.data || null;
  const suggestSongs = suggestResult?.songs || [];
  const suggestArtists = suggestResult?.artists || [];
  const suggestAlbums = suggestResult?.albums || [];

  // ── Tính toán danh sách gợi ý mix (tối đa 6 mục) ────────────────────────
  const suggestions = [];
  if (suggestResult?.topResult) {
    suggestions.push({ _type: 'top', ...suggestResult.topResult });
  }
  suggestArtists.slice(0, 2).forEach((a) => suggestions.push({ _type: 'artist', ...a }));
  suggestSongs.slice(0, 3).forEach((s) => suggestions.push({ _type: 'song', ...s }));
  suggestAlbums.slice(0, 2).forEach((a) => suggestions.push({ _type: 'album', ...a }));

  // Loại bỏ trùng lặp
  const seenIds = new Set();
  const uniqueSuggestions = suggestions.filter((s) => {
    const id = s.id || s.item?.id;
    if (!id || seenIds.has(id)) return false;
    seenIds.add(id);
    return true;
  });

  // ── Đóng suggest box khi click ra ngoài ─────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        suggestBoxRef.current && !suggestBoxRef.current.contains(e.target) &&
        inputRef.current && !inputRef.current.contains(e.target)
      ) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Xử lý nhấn Enter → điều hướng tới /search?q=... ────────────────────
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = inputValue.trim();
      if (!q) return;
      setIsFocused(false);
      inputRef.current?.blur();
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
    if (e.key === 'Escape') {
      setIsFocused(false);
      inputRef.current?.blur();
    }
  };

  // ── Xử lý click vào gợi ý ───────────────────────────────────────────────
  const handleSuggestionClick = (suggestion) => {
    setIsFocused(false);
    const type = suggestion._type;

    if (type === 'artist' || (type === 'top' && suggestion.type === 'ARTIST')) {
      const id = suggestion.id || suggestion.item?.id;
      navigate(`/artist/${id}`);
    } else if (type === 'album' || (type === 'top' && suggestion.type === 'ALBUM')) {
      const id = suggestion.id || suggestion.item?.id;
      navigate(`/album/${id}`);
    } else {
      // Song → điều hướng sang trang search và phát nhạc
      const q = inputValue.trim() || suggestion.title || '';
      navigate(`/search?q=${encodeURIComponent(q)}`);
    }
  };

  // ── Xử lý bấm vào icon Search → điều hướng đến /search ─────────────────
  const handleSearchIconClick = () => {
    if (inputValue.trim()) {
      navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
    } else {
      navigate('/search');
    }
    inputRef.current?.focus();
  };

  // ── Auth actions ─────────────────────────────────────────────────────────
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

  const showSuggestBox = isFocused && inputValue.trim().length > 0;

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
            <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33z" />
            </svg>
          ) : (
            <svg role="img" height="24" width="24" aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33A2 2 0 0 1 22 7.577V21a1 1 0 0 1-1 1h-5.5a1 1 0 0 1-1-1v-5h-3v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z" />
            </svg>
          )}
        </Button>

        {/* ── Thanh Tìm kiếm tích hợp Nút Duyệt tìm chuẩn Spotify ────────── */}
        <div className="relative max-w-[480px] w-full hidden md:flex">
          {/* Vỏ bao bọc thanh tìm kiếm dạng viên thuốc (Pill Search Bar) */}
          <div
            className={`flex items-center w-full h-12 bg-spotify-card hover:bg-spotify-card-hover rounded-full transition-all border-2 pl-3 pr-2.5 ${
              isFocused ? 'border-white bg-[#2a2a2a]' : 'border-transparent'
            }`}
          >
            {/* Icon Search - click để vào /search */}
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="text-spotify-sub hover:text-white transition-colors cursor-pointer flex items-center justify-center mr-2 flex-shrink-0"
              title="Tìm kiếm"
              tabIndex={-1}
            >
              <Search size={20} />
            </button>

            {/* Ô nhập từ khóa */}
            <input
              ref={inputRef}
              type="text"
              id="topbar-search-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Bạn muốn nghe gì?"
              className="flex-1 bg-transparent text-spotify-text placeholder-spotify-sub text-sm font-medium outline-none border-none py-2 min-w-0"
              autoComplete="off"
            />

            {/* Cụm hành động bên phải: Xóa (X), Vách ngăn dọc (|), Nút Duyệt tìm */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {/* Nút xóa X (chỉ hiện khi có nhập text) */}
              {inputValue && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setInputValue('');
                    inputRef.current?.focus();
                    if (isSearchPage) navigate('/search');
                  }}
                  className="p-1 text-spotify-sub hover:text-white transition-colors cursor-pointer rounded-full"
                  title="Xóa tìm kiếm"
                >
                  <X size={18} />
                </button>
              )}

              {/* Vách ngăn dọc tinh tế giữa ô nhập và nút Duyệt tìm */}
              <div className="w-[1px] h-6 bg-neutral-600/60 mx-1 flex-shrink-0" />

              {/* Nút Duyệt tìm (Browse) tích hợp trực tiếp bên trong thanh tìm kiếm */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                iconOnly
                onClick={(e) => {
                  e.stopPropagation();
                  navigate('/search');
                }}
                className={`!w-8 !h-8 !p-0 hover:!bg-transparent cursor-pointer flex-shrink-0 ${
                  isSearchPage
                    ? 'text-white'
                    : 'text-spotify-sub hover:text-white'
                }`}
                tooltip="Duyệt tìm"
                tooltipPosition="bottom"
                aria-label="Duyệt tìm"
              >
                {/* Icon ngăn kéo Duyệt tìm: dạng viền mặc định, dạng tô đậm màu trắng khi ở trang /search giống cơ chế nút Home */}
                {isSearchPage ? (
                  /* Dạng tô đậm màu trắng (Filled / Active) */
                  <svg
                    role="img"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="flex-shrink-0 transition-transform group-hover/btn:scale-105"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M3 10a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V10zm9 2.4a1.6 1.6 0 1 0 0 3.2a1.6 1.6 0 0 0 0-3.2z M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2H6zm4-2.8h4a0.8 0.8 0 0 1 0.8 0.8a0.8 0.8 0 0 1-0.8 0.8h-4a0.8 0.8 0 0 1-0.8-0.8a0.8 0.8 0 0 1 0.8-0.8z"
                    />
                  </svg>
                ) : (
                  /* Dạng viền (Outline / Inactive) mặc định */
                  <svg
                    role="img"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="flex-shrink-0 transition-transform group-hover/btn:scale-105"
                  >
                    <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
                    <line x1="10" y1="6" x2="14" y2="6" />
                    <rect x="3" y="8" width="18" height="12" rx="2" />
                    <circle cx="12" cy="14" r="1.5" />
                  </svg>
                )}
              </Button>
            </div>
          </div>

          {/* ── Suggest Dropdown (khớp 100% với chiều rộng và lề trái thanh tìm kiếm) ── */}
          {showSuggestBox && (
            <div
              ref={suggestBoxRef}
              className="absolute top-full mt-2 left-0 w-full bg-[#282828] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-neutral-700/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
            >
              {isLoadingSuggest ? (
                <div className="px-2 py-1">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="w-10 h-10 rounded bg-neutral-700 animate-pulse flex-shrink-0" />
                      <div className="flex flex-col gap-1.5 flex-1">
                        <div className="h-3 bg-neutral-700 animate-pulse rounded w-2/3" />
                        <div className="h-2.5 bg-neutral-700/60 animate-pulse rounded w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : uniqueSuggestions.length > 0 ? (
                <div className="px-1">
                  {uniqueSuggestions.slice(0, 7).map((suggestion, idx) => {
                    const type = suggestion._type;
                    const isTopResult = type === 'top';
                    const itemData = isTopResult ? suggestion.item : suggestion;
                    const actualType = isTopResult ? suggestion.type?.toLowerCase() : type;

                    const name = actualType === 'artist' ? (itemData.stageName || itemData.name) : (itemData.title || itemData.name);
                    const image = actualType === 'artist' ? itemData.avatarUrl : itemData.coverImage;
                    const subtitle = actualType === 'artist'
                      ? 'Nghệ sĩ'
                      : actualType === 'album'
                      ? `Album • ${itemData.ownerName || ''}`
                      : `Bài hát • ${itemData.ownerName || ''}`;

                    return (
                      <button
                        key={`${type}-${itemData.id}-${idx}`}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg hover:bg-neutral-700/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className={`w-10 h-10 flex-shrink-0 overflow-hidden shadow-md ${actualType === 'artist' ? 'rounded-full' : 'rounded-md'}`}>
                          <CoverImage
                            src={image}
                            alt={name}
                            isArtist={actualType === 'artist'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium text-white truncate">{name}</span>
                          <span className="text-xs text-spotify-sub truncate">{subtitle}</span>
                        </div>
                        {isTopResult && (
                          <span className="text-[10px] bg-neutral-600 text-neutral-300 px-2 py-0.5 rounded-full flex-shrink-0">
                            Top
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {/* "Tìm tất cả kết quả cho..." */}
                  <div className="border-t border-neutral-700/60 mt-1 pt-1 px-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFocused(false);
                        navigate(`/search?q=${encodeURIComponent(inputValue.trim())}`);
                      }}
                      className="w-full text-left px-3 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Tìm tất cả kết quả cho "{inputValue}"
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-spotify-sub px-4 py-4 text-center">
                  Không tìm thấy kết quả cho "{inputValue}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hành động của người dùng (Auth) */}
      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <div className="relative" ref={dropdownRef}>
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
                className={`text-neutral-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-white' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-[#282828] border border-[#3e3e3e] rounded-lg shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-neutral-700/60 mb-1">
                  <p className="text-xs text-neutral-400">Tài khoản</p>
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.fullName || user?.email}
                  </p>
                </div>

                <button
                  onClick={() => { setIsDropdownOpen(false); navigate('/profile'); }}
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
