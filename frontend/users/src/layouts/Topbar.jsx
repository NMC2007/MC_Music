import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, User, LogOut, ChevronDown, X } from 'lucide-react';
import { useNavigate, useLocation, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { logoutApi, getCurrentUserApi } from '../api/auth/auth';
import { searchCatalogApi } from '../api/catalog/public';
import { CoverImage } from '../components/ui/CoverImage';
import { usePlayerStore } from '../store/usePlayerStore';

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
  const { playSongWithContext } = usePlayerStore();

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

        {/* ── Thanh Tìm kiếm + Nút Duyệt tìm ──────────────────────────────── */}
        <div className="flex items-center gap-2 max-w-[480px] w-full hidden md:flex">
          {/* Input wrapper */}
          <div className={`relative flex items-center bg-spotify-card hover:bg-spotify-card-hover rounded-full transition-all border flex-1 ${
            isFocused ? 'border-white bg-[#2a2a2a]' : 'border-transparent'
          }`}>
            {/* Icon Search - click để vào /search */}
            <button
              type="button"
              onClick={handleSearchIconClick}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-spotify-sub hover:text-white transition-colors cursor-pointer"
              title="Tìm kiếm"
            >
              {/* Dùng icon filled khi đang ở trang search, outlined khi không */}
              {isSearchPage ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11 2a9 9 0 1 1 0 18A9 9 0 0 1 11 2zm0 2a7 7 0 1 0 4.93 11.95l3.56 3.56 1.42-1.42-3.56-3.56A7 7 0 0 0 11 4z"/>
                </svg>
              ) : (
                <Search size={20} />
              )}
            </button>

            <input
              ref={inputRef}
              type="text"
              id="topbar-search-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onKeyDown={handleKeyDown}
              placeholder="Bạn muốn nghe gì?"
              className="w-full bg-transparent text-spotify-text placeholder-spotify-sub rounded-full pl-10 pr-10 py-3 outline-none border-none"
              autoComplete="off"
            />

            {/* Nút xóa X */}
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  inputRef.current?.focus();
                  if (isSearchPage) navigate('/search');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-spotify-sub hover:text-white transition-colors cursor-pointer"
                title="Xóa"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* ── Suggest Dropdown ─────────────────────────────────────────── */}
          {showSuggestBox && (
            <div
              ref={suggestBoxRef}
              className="absolute top-full mt-2 left-0 w-[360px] bg-[#282828] rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-neutral-700/60 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
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

        {/* ── Nút Duyệt tìm (Browse) chuẩn Spotify ──────────────────────── */}
        <div className="group/browse relative flex-shrink-0">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className={`w-12 h-12 rounded-full bg-[#1f1f1f] hover:bg-[#282828] flex items-center justify-center transition-all cursor-pointer ${
              isSearchPage && !inputValue.trim()
                ? 'text-white'
                : 'text-[#b3b3b3] hover:text-white'
            }`}
            aria-label="Duyệt tìm"
          >
            {/* Icon Duyệt tìm chuẩn Spotify — Filled khi đang ở /search (không có query), Outlined khi không */}
            {isSearchPage && !inputValue.trim() ? (
              /* Filled / Active */
              <svg role="img" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                <path d="M3 3h8v8H3zm0 10h8v8H3zm10-10h8v8h-8zm0 10h8v8h-8z"/>
              </svg>
            ) : (
              /* Outlined / Inactive */
              <svg role="img" width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="3" width="8" height="8" rx="1"/>
                <rect x="13" y="3" width="8" height="8" rx="1"/>
                <rect x="3" y="13" width="8" height="8" rx="1"/>
                <rect x="13" y="13" width="8" height="8" rx="1"/>
              </svg>
            )}
          </button>

          {/* Tooltip "Duyệt tìm" */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1 bg-[#1d1d1d] border border-neutral-700/60 text-white text-xs font-semibold rounded whitespace-nowrap shadow-lg opacity-0 group-hover/browse:opacity-100 pointer-events-none transition-opacity duration-150 z-50">
            Duyệt tìm
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-[#1d1d1d] border-l border-t border-neutral-700/60 rotate-45" />
          </div>
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
