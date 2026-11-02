import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import {
  Music,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Play,
  Pause,
  X,
} from "lucide-react";
import { getMySongsApi } from "#/api/catalog";
import { Button } from "#/components/ui/Button";
import { CoverImage } from "#/components/ui/CoverImage";
import { StatusBadge } from "#/components/ui/StatusBadge";
import { SimpleAudioPlayer } from "#/components/ui/SimpleAudioPlayer";
import { MarqueeText } from "#/components/ui/MarqueeText";
import { SkeletonRow } from "#/components/ui/Skeleton";
import { UploadSongModal } from "#/components/songs/UploadSongModal";
import { LyricsModal } from "#/components/songs/LyricsModal";
import { SongArtistModal } from "#/components/songs/SongArtistModal";
import { SongActionMenu } from "#/components/songs/SongActionMenu";
import { formatNumber, formatDuration, formatDate } from "#/utils/formatters";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const STATUS_FILTERS = [
  { value: "", label: "Tất cả" },
  { value: "PENDING", label: "Chờ duyệt" },
  { value: "APPROVED", label: "Đã công khai" },
  { value: "REJECTED", label: "Bị từ chối" },
  { value: "TAKEDOWN", label: "Đã gỡ" },
];

// ─── SUB-COMPONENT: FILTER PILLS ──────────────────────────────────────────────
const StatusFilterPills = ({ activeStatus, onChange }) => (
  <div className="flex items-center gap-2 flex-wrap">
    {STATUS_FILTERS.map((f) => (
      <button
        key={f.value}
        type="button"
        onClick={() => onChange(f.value)}
        className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
          activeStatus === f.value
            ? "bg-[#fa2d48] text-white shadow-[0_2px_10px_rgba(250,45,72,0.4)]"
            : "bg-[#242424] text-neutral-400 hover:bg-neutral-700 hover:text-white"
        }`}
      >
        {f.label}
      </button>
    ))}
  </div>
);

// ─── SUB-COMPONENT: PAGINATION ────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-4">
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
        let pageNum = i;
        if (totalPages > 7) {
          if (page < 4) pageNum = i;
          else if (page > totalPages - 5) pageNum = totalPages - 7 + i;
          else pageNum = page - 3 + i;
        }
        return (
          <button
            key={pageNum}
            type="button"
            onClick={() => onPageChange(pageNum)}
            className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              page === pageNum
                ? "bg-[#fa2d48] text-white"
                : "text-neutral-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {pageNum + 1}
          </button>
        );
      })}

      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages - 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

// ─── SUB-COMPONENT: EMPTY STATE ───────────────────────────────────────────────
const EmptyState = ({ hasFilter, onUpload }) => (
  <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
    <div className="w-16 h-16 rounded-2xl bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center">
      <Music size={30} />
    </div>
    <div className="space-y-1">
      <h3 className="text-sm font-bold text-white">
        {hasFilter ? "Không tìm thấy bài hát nào" : "Chưa có bài hát nào được đăng tải"}
      </h3>
      <p className="text-xs text-neutral-400 max-w-xs">
        {hasFilter
          ? "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm."
          : "Tải lên bản thu đầu tiên để gửi vào hàng đợi kiểm duyệt."}
      </p>
    </div>
    {!hasFilter && (
      <Button variant="primary" size="sm" onClick={onUpload} className="mt-1">
        <Plus size={14} /> Tải bài hát đầu tiên
      </Button>
    )}
  </div>
);

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export const SongsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── STATE ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Modal state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [lyricsTarget, setLyricsTarget] = useState(null);    // song object
  const [artistTarget, setArtistTarget] = useState(null);    // song object

  // Audio preview state
  const [previewSong, setPreviewSong] = useState(null);

  // Action menu state — lưu { id, song, anchorEl }
  const [activeMenu, setActiveMenu] = useState(null);

  // ── TỰ ĐỘNG MỞ MODAL UPLOAD từ query param ?action=upload ────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("action") === "upload") {
      setIsUploadOpen(true);
      navigate("/songs", { replace: true });
    }
  }, [location.search, navigate]);

  // ── RESET TRANG KHI FILTER THAY ĐỔI ────────────────────────────────────
  const handleStatusChange = (val) => {
    setStatusFilter(val);
    setPage(0);
  };

  // ── DEBOUNCE TÌM KIẾM 500ms ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput);
      setPage(0);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── API: LẤY DANH SÁCH BÀI HÁT ─────────────────────────────────────────
  const { data: songsRes, isLoading, isFetching } = useQuery({
    queryKey: ["mySongs", page, statusFilter, searchKeyword],
    queryFn: () =>
      getMySongsApi({
        page,
        size: PAGE_SIZE,
        ...(statusFilter && { status: statusFilter }),
        ...(searchKeyword && { keyword: searchKeyword }),
      }),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  const songs = songsRes?.data?.content || [];
  const totalElements = songsRes?.data?.totalElements || 0;
  const totalPages = songsRes?.data?.totalPages || 0;

  const hasFilter = !!(statusFilter || searchKeyword);

  // ── HANDLERS ────────────────────────────────────────────────────────────
  const togglePreview = useCallback((song) => {
    setPreviewSong((prev) => (prev?.id === song.id ? null : song));
  }, []);

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchKeyword("");
    setPage(0);
  };

  const handleToggleMenu = (e, song) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveMenu((prev) =>
      prev?.id === song.id
        ? null
        : {
            id: song.id,
            song,
            anchorRect: {
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
            },
          }
    );
  };

  return (
    <div className="space-y-6 max-w-6xl pb-8">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Music size={24} className="text-[#fa2d48]" />
            Quản lý Tác phẩm
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {isLoading ? "Đang tải..." : `${totalElements.toLocaleString()} bài hát đã tải lên`}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsUploadOpen(true)}
          className="shadow-[0_4px_20px_rgba(250,45,72,0.35)] flex-shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tải bài hát mới
        </Button>
      </div>

      {/* ── THANH CÔNG CỤ: Tìm kiếm & Bộ lọc ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Ô tìm kiếm */}
        <div className="relative flex-1 max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Tìm theo tên bài hát..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full h-9 bg-[#1e1e1e] hover:bg-[#242424] focus:bg-[#242424] text-sm text-white placeholder-neutral-500 rounded-full pl-9 pr-9 outline-none border border-neutral-700/60 focus:border-white/40 transition-all"
          />
          {searchInput && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Bộ lọc trạng thái */}
        <StatusFilterPills activeStatus={statusFilter} onChange={handleStatusChange} />
      </div>

      {/* ── AUDIO PREVIEW (sticky khi phát nhạc) ── */}
      {previewSong && (
        <div className="sticky top-[4.5rem] z-20 animate-in fade-in slide-in-from-top-3 duration-200">
          <SimpleAudioPlayer
            src={previewSong.audioUrl}
            title={`Đang nghe thử: ${previewSong.title}`}
            autoPlay
            onClose={() => setPreviewSong(null)}
          />
        </div>
      )}

      {/* ── BẢNG DANH SÁCH BÀI HÁT ── */}
      <div className={`bg-[#181818] rounded-2xl overflow-hidden shadow-xl transition-opacity ${isFetching && !isLoading ? "opacity-70" : "opacity-100"}`}>
        {isLoading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : songs.length === 0 ? (
          <EmptyState hasFilter={hasFilter} onUpload={() => setIsUploadOpen(true)} />
        ) : (
          <div className="overflow-x-auto scrollbar-thin min-h-[320px]">
            <table className="w-full text-left text-sm select-none">
              <thead>
                <tr className="text-[11px] text-neutral-500 uppercase tracking-wider border-b border-white/[0.04]">
                  <th className="py-3.5 pl-5 pr-3 w-10 text-center">#</th>
                  <th className="py-3.5 px-4 w-[240px] sm:w-[280px] max-w-[280px]">Bài hát</th>
                  <th className="py-3.5 px-4 hidden md:table-cell min-w-[140px]">Thể loại</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Thời lượng</th>
                  <th className="py-3.5 px-4">Trạng thái</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell text-right">Nghe</th>
                  <th className="py-3.5 px-4 hidden sm:table-cell text-right">Thích</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell text-right">Ngày đăng</th>
                  <th className="py-3.5 pr-4 pl-2 w-12 text-center">···</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {songs.map((song) => {
                  const isPlaying = previewSong?.id === song.id;
                  const isMenuOpen = activeMenu?.id === song.id;
                  const genres = song.genres || [];

                  return (
                    <tr
                      key={song.id}
                      className="hover:bg-white/[0.025] transition-colors group"
                    >
                      {/* STT / Play */}
                      <td className="py-3 pl-5 pr-3 text-center">
                        <button
                          type="button"
                          onClick={() => togglePreview(song)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 group-hover:text-white hover:bg-[#fa2d48] transition-all cursor-pointer mx-auto"
                          title={isPlaying ? "Dừng" : "Nghe thử"}
                        >
                          {isPlaying ? (
                            <Pause size={12} fill="currentColor" />
                          ) : (
                            <Play size={12} fill="currentColor" className="ml-0.5" />
                          )}
                        </button>
                      </td>

                      {/* Tên bài hát & Cover */}
                      <td className="py-3 px-4 w-[240px] sm:w-[280px] max-w-[280px]">
                        <div className="flex items-center gap-3 w-full min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-neutral-800">
                            <CoverImage
                              src={song.coverImage}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0 overflow-hidden">
                            <MarqueeText
                              text={song.title}
                              as="p"
                              className={`text-sm font-bold text-white transition-colors group-hover:text-[#fa2d48] ${isPlaying ? "text-[#fa2d48]" : ""}`}
                            />
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">
                              {song.ownerName}
                              {song.explicit && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[9px] bg-neutral-800 text-neutral-400 uppercase font-bold tracking-wide">
                                  18+
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Thể loại */}
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[130px]">
                          {genres.slice(0, 2).map((g) => (
                            <span key={g.id} className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-400 font-medium truncate max-w-[60px]">
                              {g.name}
                            </span>
                          ))}
                          {genres.length > 2 && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-neutral-800 text-neutral-500">
                              +{genres.length - 2}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Thời lượng */}
                      <td className="py-3 px-4 text-xs text-neutral-400 hidden lg:table-cell font-mono">
                        {formatDuration(song.durationSeconds)}
                      </td>

                      {/* Trạng thái */}
                      <td className="py-3 px-4">
                        <StatusBadge status={song.status} size="sm" />
                      </td>

                      {/* Lượt nghe */}
                      <td className="py-3 px-4 text-xs text-neutral-300 hidden sm:table-cell text-right font-mono tabular-nums">
                        {formatNumber(song.playCount)}
                      </td>

                      {/* Lượt thích */}
                      <td className="py-3 px-4 text-xs text-neutral-300 hidden sm:table-cell text-right font-mono tabular-nums">
                        {formatNumber(song.likeCount)}
                      </td>

                      {/* Ngày đăng */}
                      <td className="py-3 px-4 text-[11px] text-neutral-500 hidden lg:table-cell text-right">
                        {formatDate(song.createdAt)}
                      </td>

                      {/* Menu thao tác */}
                      <td className="py-3 pr-4 pl-2 text-center">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, song)}
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer mx-auto ${
                            isMenuOpen
                              ? "bg-[#fa2d48]/20 text-[#fa2d48]"
                              : "text-neutral-500 hover:text-white hover:bg-white/10"
                          }`}
                          title="Thao tác"
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── PHÂN TRANG ── */}
      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* ── ACTION MENU NỔI (REACT PORTAL) ── */}
      {activeMenu && (
        <SongActionMenu
          key={activeMenu.id}
          anchorRect={activeMenu.anchorRect}
          isPreviewPlaying={previewSong?.id === activeMenu.song.id}
          onTogglePreview={() => togglePreview(activeMenu.song)}
          onEditLyrics={() => setLyricsTarget(activeMenu.song)}
          onAddArtist={() => setArtistTarget(activeMenu.song)}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {/* ── CÁC MODAL ── */}
      <UploadSongModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => setIsUploadOpen(false)}
      />

      <LyricsModal
        isOpen={!!lyricsTarget}
        onClose={() => setLyricsTarget(null)}
        song={lyricsTarget}
      />

      <SongArtistModal
        isOpen={!!artistTarget}
        onClose={() => setArtistTarget(null)}
        song={artistTarget}
      />
    </div>
  );
};

export default SongsPage;
