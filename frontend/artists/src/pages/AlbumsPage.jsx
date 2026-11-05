import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import {
  Disc3,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  AlertTriangle,
  X,
  Library,
} from "lucide-react";
import { toast } from "sonner";
import { getMyAlbumsApi, deleteAlbumApi, restoreAlbumApi } from "#/api/catalog";
import { Button } from "#/components/ui/Button";
import { Modal } from "#/components/ui/Modal";
import { SkeletonCard } from "#/components/ui/Skeleton";
import { CreateAlbumModal } from "#/components/albums/CreateAlbumModal";
import { EditAlbumModal } from "#/components/albums/EditAlbumModal";
import { AlbumDetailModal } from "#/components/albums/AlbumDetailModal";
import { AlbumActionMenu } from "#/components/albums/AlbumActionMenu";
import { AlbumCard } from "#/components/albums/AlbumCard";

const PAGE_SIZE = 12;

// ─── SUB-COMPONENT: PAGINATION ────────────────────────────────────────────────
const Pagination = ({ page, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
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

// ─── MAIN ALBUMS PAGE ─────────────────────────────────────────────────────────
export const AlbumsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── STATE ──
  const [activeTab, setActiveTab] = useState("active"); // "active" | "trash"
  const [page, setPage] = useState(0);
  const [searchInput, setSearchInput] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);      // album object
  const [deleteTarget, setDeleteTarget] = useState(null);  // album object to confirm delete
  const [detailTarget, setDetailTarget] = useState(null);  // album object for tracklist modal

  // Action menu state
  const [activeMenu, setActiveMenu] = useState(null);

  const isTrashTab = activeTab === "trash";

  // ── DEBOUNCE TÌM KIẾM 400ms ─────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchKeyword(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── RESET TRANG KHI CHUYỂN TAB ───────────────────────────────────────────
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setPage(0);
  };

  // ── API: FETCH ALBUMS ───────────────────────────────────────────────────
  const { data: albumsRes, isLoading, isFetching } = useQuery({
    queryKey: ["myAlbums", page, activeTab],
    queryFn: () =>
      getMyAlbumsApi({
        page,
        size: PAGE_SIZE,
        isDeleted: isTrashTab,
      }),
    staleTime: 1000 * 60,
    placeholderData: (prev) => prev,
  });

  const rawAlbums = useMemo(
    () => albumsRes?.data?.content || [],
    [albumsRes?.data?.content]
  );
  const totalElements = albumsRes?.data?.totalElements || 0;
  const totalPages = albumsRes?.data?.totalPages || 0;

  // ── XỬ LÝ URL PARAMS (?action=create HOẶC ?albumId=...) ──────────────────
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get("action");
    const albumIdParam = params.get("albumId");

    if (action === "create") {
      setIsCreateOpen(true);
      navigate("/albums", { replace: true });
    } else if (albumIdParam && rawAlbums.length > 0) {
      const found = rawAlbums.find((a) => a.id === albumIdParam);
      if (found) {
        setDetailTarget(found);
      }
    }
  }, [location.search, navigate, rawAlbums]);

  // Lọc theo từ khóa tìm kiếm
  const albums = searchKeyword
    ? rawAlbums.filter((a) =>
        a.title?.toLowerCase().includes(searchKeyword.toLowerCase().trim())
      )
    : rawAlbums;

  // ── MUTATION: XÓA MỀM ALBUM ────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (albumId) => deleteAlbumApi(albumId),
    onSuccess: () => {
      toast.success("Đã chuyển Album vào thùng rác!", {
        description:
          "Toàn bộ bài hát trong Album cũng đã tự động chuyển vào Thùng rác.",
      });
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });
    },
    onError: (err) => {
      toast.error("Xóa Album thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // ── MUTATION: KHÔI PHỤC ALBUM ──────────────────────────────────────────
  const restoreMutation = useMutation({
    mutationFn: (albumId) => restoreAlbumApi(albumId),
    onSuccess: () => {
      toast.success("Đã khôi phục Album thành công!", {
        description:
          "Album và toàn bộ bài hát bên trong đã quay trở lại danh mục phát hành.",
      });
      queryClient.invalidateQueries({ queryKey: ["myAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["mySongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["artistRecentSongs"] });
      queryClient.invalidateQueries({ queryKey: ["artistDashboard"] });
    },
    onError: (err) => {
      toast.error("Khôi phục Album thất bại", {
        description: err.response?.data?.message || "Vui lòng thử lại sau.",
      });
    },
  });

  // ── HANDLERS ────────────────────────────────────────────────────────────
  const handleOpenMenu = (e, album) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setActiveMenu((prev) =>
      prev?.id === album.id
        ? null
        : {
            id: album.id,
            album,
            anchorRect: {
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
            },
          }
    );
  };

  const handleOpenDetail = (album) => {
    setDetailTarget(album);
  };

  return (
    <div className="space-y-6 w-full pb-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
            <Disc3 size={24} className="text-[#fa2d48]" />
            Bộ sưu tập Album
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            {isLoading
              ? "Đang tải dữ liệu..."
              : `${totalElements.toLocaleString()} ấn phẩm trong danh mục này`}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setIsCreateOpen(true)}
          className="shadow-[0_4px_20px_rgba(250,45,72,0.35)] flex-shrink-0"
        >
          <Plus size={16} strokeWidth={2.5} />
          Tạo Album mới
        </Button>
      </div>

      {/* ── TAB CHUYỂN ĐỔI: BỘ SƯU TẬP vs THÙNG RÁC ── */}
      <div className="flex items-center gap-3 border-b border-white/[0.06] pb-3">
        <button
          type="button"
          onClick={() => handleTabChange("active")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            !isTrashTab
              ? "bg-[#fa2d48] text-white shadow-[0_2px_12px_rgba(250,45,72,0.35)]"
              : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Disc3 size={15} />
          Bộ sưu tập phát hành
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("trash")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isTrashTab
              ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              : "text-neutral-400 hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          <Trash2 size={15} />
          Thùng rác
        </button>
      </div>

      {/* ── THANH TÌM KIẾM ALBUM ── */}
      <div className="relative max-w-xs">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Tìm theo tên album..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full h-9 bg-[#1e1e1e] hover:bg-[#242424] focus:bg-[#242424] text-sm text-white placeholder-neutral-500 rounded-full pl-9 pr-9 outline-none border border-neutral-700/60 focus:border-white/40 transition-all"
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => {
              setSearchInput("");
              setSearchKeyword("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── LƯỚI DANH SÁCH ALBUM ── */}
      <div
        className={`transition-opacity ${
          isFetching && !isLoading ? "opacity-70" : "opacity-100"
        }`}
      >
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} isArtist={false} />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="p-16 rounded-3xl bg-[#181818] text-center flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#fa2d48]/10 text-[#fa2d48] flex items-center justify-center">
              {isTrashTab ? <Trash2 size={32} /> : <Library size={32} />}
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">
                {isTrashTab
                  ? "Thùng rác trống"
                  : searchKeyword
                  ? "Không tìm thấy album nào phù hợp"
                  : "Chưa có Album nào được tạo"}
              </h3>
              <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                {isTrashTab
                  ? "Không có ấn phẩm nào bị xóa trong thùng rác."
                  : searchKeyword
                  ? "Thử tìm kiếm với từ khóa khác."
                  : "Gom nhóm các đĩa đơn, EP và Single để phát hành các ấn phẩm âm nhạc hoàn chỉnh."}
              </p>
            </div>
            {!isTrashTab && !searchKeyword && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                <Plus size={15} /> Tạo Album đầu tay
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <AlbumCard
                key={album.id}
                album={album}
                isTrash={isTrashTab}
                onOpenDetail={() => handleOpenDetail(album)}
                onOpenMenu={handleOpenMenu}
                onRestore={() => restoreMutation.mutate(album.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── PHÂN TRANG ── */}
      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      )}

      {/* ── ACTION MENU NỔI (REACT PORTAL) ── */}
      {activeMenu && (
        <AlbumActionMenu
          key={activeMenu.id}
          anchorRect={activeMenu.anchorRect}
          isTrash={isTrashTab}
          onViewDetails={() => handleOpenDetail(activeMenu.album)}
          onEdit={() => setEditTarget(activeMenu.album)}
          onDelete={() => setDeleteTarget(activeMenu.album)}
          onRestore={() => restoreMutation.mutate(activeMenu.album.id)}
          onClose={() => setActiveMenu(null)}
        />
      )}

      {/* ── MODAL: CHI TIẾT ALBUM & QUẢN LÝ TRACKLIST (DRAG & DROP) ── */}
      <AlbumDetailModal
        isOpen={!!detailTarget}
        album={detailTarget}
        onClose={() => setDetailTarget(null)}
      />

      {/* ── MODAL: TẠO ALBUM MỚI ── */}
      <CreateAlbumModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => setIsCreateOpen(false)}
      />

      {/* ── MODAL: CHỈNH SỬA ALBUM ── */}
      <EditAlbumModal
        isOpen={!!editTarget}
        album={editTarget}
        onClose={() => setEditTarget(null)}
        onSuccess={() => setEditTarget(null)}
      />

      {/* ── MODAL XÁC NHẬN: XÓA MỀM ALBUM (CÓ CẢNH BÁO CASCADE) ── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Xóa Album và toàn bộ bài hát?"
        description="Xác nhận đưa ấn phẩm vào Thùng rác."
        maxWidth="max-w-md"
      >
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-xs leading-relaxed">
            <AlertTriangle size={20} className="flex-shrink-0 text-rose-400 mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">
                Cảnh báo Xóa liên đới (Cascade Delete)
              </p>
              <p className="text-neutral-400 mb-2">
                Khi xóa Album <strong>"{deleteTarget?.title}"</strong>, toàn bộ{" "}
                <span className="text-rose-400 font-bold">
                  {deleteTarget?.totalTracks || 0} bài hát
                </span>{" "}
                thuộc Album này cũng sẽ tự động chuyển vào Thùng rác và tạm ẩn khỏi Catalog công khai.
              </p>
              <p className="text-[11px] text-neutral-500 italic">
                (Bạn có thể khôi phục lại cả Album và các bài hát bất cứ lúc nào từ tab Thùng rác).
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/[0.05]">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteMutation.isPending}
            >
              Hủy bỏ
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              isLoading={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              className="bg-rose-600 hover:bg-rose-700 shadow-[0_4px_16px_rgba(225,29,72,0.4)] px-6"
            >
              <Trash2 size={15} />
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AlbumsPage;
