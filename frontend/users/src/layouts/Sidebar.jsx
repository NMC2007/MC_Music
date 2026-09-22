import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Library,
  Plus,
  List,
  Pin,
  Heart,
  Bookmark,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuthStore } from "../store/useAuthStore";
import { toast } from "sonner";

// --- MOCK DATA ---
const filters = ["Playlist", "Album", "Nghệ sĩ"];

const mockLibrary = [];

export const Sidebar = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [width, setWidth] = useState(320); // Mặc định w-80 = 320px để rộng rãi hiển thị list
  const [isResizing, setIsResizing] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const handleProtectedAction = (actionName) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để sử dụng tính năng này!", {
        description: `Bạn cần đăng nhập để ${actionName}.`,
      });
      return false;
    }
    return true;
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;

      let newWidth = e.clientX - 8;

      if (newWidth < 280) newWidth = 280;
      if (newWidth > 420) newWidth = 420;

      setWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
    } else {
      document.body.style.userSelect = "";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  // --- Scroll Logic cho Filters ---
  const scrollRef = useRef(null);
  const [showLeft, setShowLeft] = useState(false);
  const [showRight, setShowRight] = useState(true);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setShowLeft(scrollLeft > 0);
    setShowRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener("resize", handleScroll);
    return () => window.removeEventListener("resize", handleScroll);
  }, []);

  useEffect(() => {
    handleScroll();
  }, [width]);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -150 : 150;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };
  // --------------------------------

  return (
    <aside
      className="flex-shrink-0 flex flex-col gap-2 h-full z-10 relative group"
      style={{ width: `${width}px` }}
    >
      {/* Library */}
      <div className="bg-spotify-base rounded-lg flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 text-spotify-sub font-bold">
          <div className="flex items-center gap-2 flex-1 min-w-0 hover:text-white transition cursor-pointer">
            <Library size={24} className="flex-shrink-0" />
            <span className="text-base truncate">Thư viện</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
            <Button 
              variant="dark" 
              size="sm" 
              tooltip="Tạo danh sách phát mới" 
              tooltipPosition="bottom-right"
              onClick={() => handleProtectedAction("tạo danh sách phát mới")}
            >
              <Plus size={16} />
              Tạo
            </Button>
          </div>
        </div>

        {/* Filters */}
        {isAuthenticated && (
          <div className="relative group/filter flex-shrink-0">
          {showLeft && (
            <>
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-spotify-base from-30% to-transparent z-[5] pointer-events-none" />
              <Button
                variant="glass" size="sm" iconOnly
                onClick={() => scroll("left")}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10"
              >
                <ChevronLeft size={20} />
              </Button>
            </>
          )}

          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex items-center gap-2 px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {filters.map((filter) => (
              <Button key={filter} variant="dark" size="sm">
                {filter}
              </Button>
            ))}
          </div>

          {showRight && (
            <>
              <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-spotify-base from-30% to-transparent z-[5] pointer-events-none" />
              <Button
                variant="glass" size="sm" iconOnly
                onClick={() => scroll("right")}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10"
              >
                <ChevronRight size={20} />
              </Button>
            </>
          )}
          </div>
        )}

        {/* Sub-header (Search & Sort) */}
        {isAuthenticated && (
          <div className="flex items-center justify-between px-4 py-2 flex-shrink-0 mt-1 h-10">
          {isSearchExpanded ? (
            <div className="relative flex items-center bg-[#2a2a2a] rounded-md h-8 px-2 flex-1 mr-2">
              <Search size={16} className="text-spotify-sub flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Tìm kiếm trong Thư viện"
                className="bg-transparent border-none outline-none text-white text-sm ml-2 w-full placeholder-spotify-sub"
                onBlur={() => setIsSearchExpanded(false)}
              />
            </div>
          ) : (
            <Button variant="ghost" size="sm" iconOnly onClick={() => setIsSearchExpanded(true)} tooltip="Tìm kiếm trong thư viện" tooltipPosition="bottom-left">
              <Search size={18} />
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="px-2 hover:bg-transparent hover:scale-105 flex-shrink-0"
            tooltip="Sắp xếp" tooltipPosition="bottom-right"
          >
            {!isSearchExpanded && <span>Gần đây</span>}
            <List size={18} />
          </Button>
          </div>
        )}

        {/* List Items */}
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-2">
          {isAuthenticated ? (
            mockLibrary.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-[#1a1a1a] cursor-pointer group transition-colors"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center overflow-hidden">
                  {item.type === "liked" && (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-blue-300 flex items-center justify-center rounded-md">
                      <Heart size={20} className="text-white fill-white" />
                    </div>
                  )}
                  {item.type === "episodes" && (
                    <div className="w-full h-full bg-[#006450] flex items-center justify-center rounded-md">
                      <Bookmark
                        size={20}
                        className="text-[#1ed760] fill-[#1ed760]"
                      />
                    </div>
                  )}
                  {(item.type === "artist" || item.type === "album") && (
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`w-full h-full object-cover ${item.type === "artist" ? "rounded-full" : "rounded-md"}`}
                    />
                  )}
                </div>

                {/* Text Content */}
                <div className="flex flex-col flex-1 min-w-0 justify-center">
                  <span className="text-sm font-medium text-white truncate">
                    {item.title}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-spotify-sub mt-0.5 overflow-hidden">
                    {item.pinned && (
                      <Pin
                        size={12}
                        className="text-[#1ed760] fill-[#1ed760] flex-shrink-0 rotate-45"
                      />
                    )}
                    <span className="truncate">{item.subtitle}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-[#242424] rounded-lg p-5 mt-2 flex flex-col gap-4 text-white">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-base">Tạo danh sách phát đầu tiên của bạn</span>
                <span className="text-sm font-medium">Rất dễ! Chúng tôi sẽ giúp bạn</span>
              </div>
              <div className="mt-1">
                <Button 
                  variant="white" 
                  size="sm" 
                  className="font-bold text-black rounded-full px-4 w-max"
                  onClick={() => handleProtectedAction("tạo danh sách phát mới")}
                >
                  Tạo danh sách phát
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resizer Handle */}
      <div
        className="absolute top-0 -right-2 w-4 h-full cursor-col-resize z-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        onMouseDown={(e) => {
          e.preventDefault();
          setIsResizing(true);
        }}
      >
        <div
          className={`h-full w-[2px] transition-colors ${isResizing ? "bg-white/60" : "hover:bg-white/30"}`}
        ></div>
      </div>
    </aside>
  );
};
