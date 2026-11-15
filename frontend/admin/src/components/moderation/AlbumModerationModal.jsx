import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Disc3,
  Music,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  ListMusic,
  Play,
} from "lucide-react";
import { toast } from "sonner";

import { updateAlbumStatusApi, getSongsByAlbumApi } from "../../api/catalog";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { CoverImage } from "../ui/CoverImage";
import { AudioPlayerBar } from "../audio/AudioPlayerBar";
import { RejectAlbumModal } from "./RejectAlbumModal";
import { MODERATION_RULES_LIST } from "../../utils/rules";
import { formatDate, formatDuration, formatDateTime } from "../../utils/formatters";

/**
 * AlbumModerationModal: Bảng thẩm định & kiểm duyệt Album toàn diện
 * - Kích thước lớn chiếm khoảng 80% - 85% màn hình (w-[92vw] max-w-6xl max-h-[90vh])
 * - Hiển thị đầy đủ: Thông tin Album, Nghệ sĩ sở hữu, Danh sách tracklist bài hát kèm nghe thử từng bài
 * - Bắt buộc Admin phải duyệt qua toàn bộ 7 quy tắc thì nút "Phê Duyệt Album" mới được kích hoạt
 */
export const AlbumModerationModal = ({
  isOpen,
  onClose,
  album,
  albumsList = [],
  onSelectAlbum,
}) => {
  const queryClient = useQueryClient();

  // Bộ checklist 7 quy tắc kiểm duyệt: key là mã quy tắc, value là boolean
  const [checkedRules, setCheckedRules] = useState({});

  // Bài hát đang được chọn để nghe thử trong danh sách track của album
  const [activeTrack, setActiveTrack] = useState(null);

  // Modal Từ chối Album
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRuleCode, setRejectingRuleCode] = useState(null);

  // Reset checklist và track đang nghe khi chuyển album
  const [prevAlbumId, setPrevAlbumId] = useState(album?.id);
  if (album?.id !== prevAlbumId) {
    setPrevAlbumId(album?.id);
    setCheckedRules({});
    setActiveTrack(null);
  }

  // Khóa cuộn body và lắng nghe phím ESC
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (!isRejectModalOpen) {
          onClose();
        }
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose, isRejectModalOpen]);

  // ── TRUY VẤN DANH SÁCH BÀI HÁT THUỘC ALBUM ──
  const { data: songsData, isLoading: isSongsLoading } = useQuery({
    queryKey: ["albumSongs", album?.id],
    queryFn: () => getSongsByAlbumApi(album?.id, { page: 0, size: 100 }),
    enabled: Boolean(isOpen && album?.id),
  });

  const albumSongs = Array.isArray(songsData?.data)
    ? songsData.data
    : (songsData?.data?.content || []);

  // Tự động chọn track đầu tiên để nghe thử khi danh sách track tải xong
  const [prevSongsLen, setPrevSongsLen] = useState(0);
  if (albumSongs.length > 0 && (!activeTrack || prevSongsLen !== albumSongs.length)) {
    setPrevSongsLen(albumSongs.length);
    if (!activeTrack || !albumSongs.some((s) => s.id === activeTrack.id)) {
      setActiveTrack(albumSongs[0]);
    }
  }

  // Xác định vị trí album hiện tại trong danh sách để điều hướng nhanh
  const currentIndex = album ? albumsList.findIndex((a) => a.id === album.id) : -1;
  const prevAlbum = currentIndex > 0 ? albumsList[currentIndex - 1] : null;
  const nextAlbum = currentIndex >= 0 && currentIndex < albumsList.length - 1 ? albumsList[currentIndex + 1] : null;

  // ── MUTATION PHÊ DUYỆT ALBUM (Đặt trước early return để tuân thủ Rules of Hooks) ──
  const approveMutation = useMutation({
    mutationFn: (albumId) =>
      updateAlbumStatusApi(albumId, {
        status: "APPROVED",
        rejectionReason: null,
      }),
    onSuccess: () => {
      toast.success("Đã phê duyệt album thành công!", {
        description: `Album "${album?.title || "này"}" và toàn bộ bài hát đã được công khai trên nền tảng.`,
      });
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: ["adminPendingAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["pendingAlbumsCount"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardPendingAlbums"] });
      queryClient.invalidateQueries({ queryKey: ["adminPendingSongs"] });

      if (nextAlbum) {
        onSelectAlbum(nextAlbum);
      } else if (prevAlbum) {
        onSelectAlbum(prevAlbum);
      } else {
        onClose();
      }
    },
    onError: (err) => {
      console.error("Lỗi khi duyệt album:", err);
      const msg = err.response?.data?.message || "Không thể phê duyệt album. Vui lòng thử lại.";
      toast.error("Phê duyệt album thất bại", { description: msg });
    },
  });

  if (!isOpen || !album) return null;

  // ── XỬ LÝ CHECKLIST 7 QUY TẮC ──
  const handleToggleRule = (ruleCode) => {
    setCheckedRules((prev) => ({
      ...prev,
      [ruleCode]: !prev[ruleCode],
    }));
  };

  const handleSelectAllRules = () => {
    const allChecked = {};
    MODERATION_RULES_LIST.forEach((r) => {
      allChecked[r.code] = true;
    });
    setCheckedRules(allChecked);
    toast.info("Đã đánh dấu toàn bộ 7 quy tắc đạt chuẩn!");
  };

  const handleResetRules = () => {
    setCheckedRules({});
  };

  const checkedCount = Object.values(checkedRules).filter(Boolean).length;
  const isAllRulesPassed = MODERATION_RULES_LIST.length > 0 && checkedCount === MODERATION_RULES_LIST.length;

  const handleApprove = () => {
    if (!isAllRulesPassed) {
      toast.error("Yêu cầu kiểm tra đầy đủ:", {
        description: "Bạn cần kiểm tra và xác nhận đạt chuẩn toàn bộ 7 quy tắc trước khi phê duyệt album.",
      });
      return;
    }
    approveMutation.mutate(album.id);
  };

  const handleOpenReject = (ruleCode = null) => {
    setRejectingRuleCode(ruleCode);
    setIsRejectModalOpen(true);
  };

  const handleRejectSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["adminPendingAlbums"] });
    queryClient.invalidateQueries({ queryKey: ["pendingAlbumsCount"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardPendingAlbums"] });

    if (nextAlbum) {
      onSelectAlbum(nextAlbum);
    } else if (prevAlbum) {
      onSelectAlbum(prevAlbum);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      {/* Lớp nền mờ (Backdrop) */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bảng Hộp Thoại Kiểm Duyệt Album Kích Thước ~80% - 85% Màn Hình */}
      <div
        className="relative w-[92vw] max-w-6xl max-h-[90vh] bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.98)] z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* ── HEADER CỐ ĐỊNH ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Disc3 size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  Bảng Thẩm Định & Kiểm Duyệt Album
                </h3>
                <StatusBadge status="PENDING" size="sm" />
              </div>
              <p className="text-xs text-neutral-400 font-mono truncate" title={album.id}>
                Album ID: {album.id}
              </p>
            </div>
          </div>

          {/* Điều hướng Trước / Sau & Nút Đóng */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-white/[0.04] text-xs">
              <button
                type="button"
                onClick={() => prevAlbum && onSelectAlbum(prevAlbum)}
                disabled={!prevAlbum}
                className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Album trước"
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </button>
              <span className="text-[11px] text-neutral-500 px-1 font-mono">
                {currentIndex + 1} / {albumsList.length}
              </span>
              <button
                type="button"
                onClick={() => nextAlbum && onSelectAlbum(nextAlbum)}
                disabled={!nextAlbum}
                className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Album tiếp theo"
              >
                <span>Sau</span>
                <ChevronRight size={14} />
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-2 flex-shrink-0"
              title="Đóng (ESC)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── THÂN MODAL CUỘN ĐỘC LẬP ── */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-6 flex-1">
          {/* ── KHỐI 1: THÔNG TIN ALBUM TỔNG QUAN ── */}
          <div className="flex flex-col sm:flex-row items-start gap-5 p-5 rounded-2xl bg-[#1e1e1e] border border-white/[0.04]">
            <CoverImage
              src={album.coverImage || album.coverUrl}
              alt={album.title}
              isAlbum
              className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl shadow-xl flex-shrink-0"
              fallbackIconSize={40}
            />

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status="PENDING" size="sm" />
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  {album.albumType || "ALBUM"}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">
                  {album.totalTracks || albumSongs.length} ca khúc
                </span>
              </div>

              <h2 className="text-2xl font-black text-white tracking-tight break-words">
                {album.title}
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-neutral-400 pt-1">
                <div>
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Nghệ sĩ sở hữu</span>
                  <span className="text-white font-bold">{album.ownerName || "Chưa cập nhật"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Ngày phát hành</span>
                  <span className="text-white font-mono">{formatDate(album.releaseDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Ngày đăng ký</span>
                  <span className="text-white">{formatDateTime(album.createdAt)}</span>
                </div>
              </div>

              {album.description && (
                <p className="text-xs text-neutral-300 pt-1 leading-relaxed bg-black/20 p-2.5 rounded-xl border border-white/[0.02]">
                  {album.description}
                </p>
              )}
            </div>
          </div>

          {/* ── KHỐI 2: DANH SÁCH BÀI HÁT THUỘC ALBUM (TRACKLIST) ── */}
          <div className="p-5 rounded-2xl bg-[#1e1e1e] border border-white/[0.04] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                <ListMusic size={15} className="text-[#fa2d48]" />
                Danh sách ca khúc trong Album ({albumSongs.length} bài hát)
              </span>
              <span className="text-[11px] text-neutral-500">
                Nhấn Play để thẩm định âm thanh từng track
              </span>
            </div>

            {isSongsLoading ? (
              <p className="text-xs text-neutral-500 py-4 text-center">Đang nạp danh sách bài hát...</p>
            ) : albumSongs.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-500">
                <Music size={24} className="mx-auto mb-1.5 opacity-40" />
                <span>Album này hiện chưa có bài hát nào được thêm vào.</span>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-52 overflow-y-auto scrollbar-thin pr-1">
                {albumSongs.map((song, idx) => {
                  const isCurrentPlaying = activeTrack?.id === song.id;
                  return (
                    <div
                      key={song.id}
                      onClick={() => setActiveTrack(song)}
                      className={`py-2.5 px-3 rounded-xl flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                        isCurrentPlaying
                          ? "bg-[#fa2d48]/15 border border-[#fa2d48]/30 text-white"
                          : "hover:bg-white/[0.02] text-neutral-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-5 text-center font-mono text-neutral-500 text-xs">
                          {idx + 1}
                        </span>

                        <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0 text-white">
                          <Play size={12} fill={isCurrentPlaying ? "currentColor" : "none"} className="ml-0.5" />
                        </div>

                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate max-w-[280px] sm:max-w-md text-white">
                            {song.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-neutral-400">
                              {song.ownerName || album.ownerName}
                            </span>
                            {song.explicit && (
                              <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300">
                                EXPLICIT
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-xs font-mono text-neutral-400">
                          {formatDuration(song.durationSeconds || song.duration)}
                        </span>
                        <StatusBadge status={song.status || "PENDING"} size="sm" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── KHỐI 3: TRÌNH PHÁT NHẠC THẨM ĐỊNH (AUDIO PLAYER BAR) ── */}
          {activeTrack && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                <Music size={14} className="text-[#fa2d48]" /> Đang thẩm định âm thanh track:{" "}
                <span className="text-white font-bold">"{activeTrack.title}"</span>
              </span>
              <AudioPlayerBar
                src={activeTrack.audioUrl}
                title={activeTrack.title}
                artist={activeTrack.ownerName || album.ownerName}
              />
            </div>
          )}

          {/* ── KHỐI 4: BỘ 7 QUY TẮC KIỂM DUYỆT ALBUM (CORE CHECKLIST) ── */}
          <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#fa2d48]/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#fa2d48]" size={18} />
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Bộ 7 Quy Tắc Thẩm Định Album Bắt Buộc
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Admin bắt buộc phải kiểm tra và xác nhận đạt chuẩn toàn bộ 7 quy tắc trước khi có thể phê duyệt album.
                </p>
              </div>

              {/* Lối tắt chọn nhanh */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllRules}
                  className="text-xs px-3 py-1.5 rounded-lg bg-[#fa2d48]/20 hover:bg-[#fa2d48] text-[#fa2d48] hover:text-white font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={13} />
                  <span>Đánh dấu đạt tất cả (7/7)</span>
                </button>
                {checkedCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetRules}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Bỏ chọn
                  </button>
                )}
              </div>
            </div>

            {/* Thanh Tiến trình Checklist */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-neutral-300">
                  Tiến độ kiểm định chất lượng Album:
                </span>
                <span
                  className={`font-bold font-mono ${
                    isAllRulesPassed ? "text-emerald-400" : "text-[#fa2d48]"
                  }`}
                >
                  {checkedCount} / {MODERATION_RULES_LIST.length} quy tắc
                </span>
              </div>
              <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    isAllRulesPassed ? "bg-emerald-500" : "bg-[#fa2d48]"
                  }`}
                  style={{
                    width: `${(checkedCount / MODERATION_RULES_LIST.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            {/* Danh sách 7 Quy tắc có Checkbox */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
              {MODERATION_RULES_LIST.map((rule, idx) => {
                const isChecked = Boolean(checkedRules[rule.code]);
                return (
                  <div
                    key={rule.code}
                    className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                      isChecked
                        ? "bg-emerald-500/10 border-emerald-500/30 text-white"
                        : "bg-[#222222] border-white/[0.04] text-neutral-300 hover:border-white/10"
                    }`}
                  >
                    <div
                      onClick={() => handleToggleRule(rule.code)}
                      className="flex items-start gap-2.5 cursor-pointer flex-1"
                    >
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 border transition-colors ${
                          isChecked
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-neutral-800 border-neutral-600 hover:border-neutral-400"
                        }`}
                      >
                        {isChecked && <Check size={14} strokeWidth={3} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">
                            {idx + 1}. {rule.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 line-clamp-2 leading-relaxed">
                          {rule.description}
                        </p>
                      </div>
                    </div>

                    {/* Nút báo vi phạm riêng cho từng quy tắc */}
                    <div className="flex justify-end pt-1 border-t border-white/[0.04]">
                      <button
                        type="button"
                        onClick={() => handleOpenReject(rule.code)}
                        className="text-[10px] font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-2 py-0.5 rounded transition-colors flex items-center gap-1 cursor-pointer"
                        title={`Báo vi phạm quy tắc: ${rule.title}`}
                      >
                        <XCircle size={12} />
                        <span>Báo vi phạm quy tắc này</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FOOTER CỐ ĐỊNH: QUYẾT ĐỊNH DUYỆT / TỪ CHỐI ── */}
        <div className="px-6 py-4 bg-[#1a1a1a] border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-400">
            {isAllRulesPassed ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Đã kiểm định đạt 7/7 quy tắc. Sẵn sàng phê duyệt toàn bộ album!
              </span>
            ) : (
              <span className="text-[#fa2d48] font-medium flex items-center gap-1.5">
                <ShieldCheck size={15} /> Cần kiểm tra đủ 7 quy tắc trước khi có thể phê duyệt album.
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="dark"
              size="sm"
              onClick={onClose}
              disabled={approveMutation.isPending}
            >
              Đóng lại
            </Button>

            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => handleOpenReject(null)}
              disabled={approveMutation.isPending}
              className="text-xs px-4"
            >
              <XCircle size={15} />
              <span>Từ Chối Album</span>
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleApprove}
              disabled={!isAllRulesPassed || approveMutation.isPending}
              isLoading={approveMutation.isPending}
              tooltip={
                !isAllRulesPassed
                  ? "Bắt buộc kiểm tra và tick chọn đủ 7/7 quy tắc trước khi duyệt"
                  : "Phê duyệt và công khai album kèm các bài hát"
              }
              className="text-xs px-6"
            >
              <CheckCircle2 size={16} />
              <span>Phê Duyệt Album</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── MODAL TỪ CHỐI ALBUM ── */}
      <RejectAlbumModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        album={album}
        initialRuleCode={rejectingRuleCode}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
};

export default AlbumModerationModal;
