import React, { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  X,
  Music,
  CheckCircle2,
  XCircle,
  Users,
  ShieldCheck,
  FileText,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

import { updateSongStatusApi, getSongLyricsApi } from "../../api/catalog";
import { Button } from "../ui/Button";
import { StatusBadge } from "../ui/StatusBadge";
import { CoverImage } from "../ui/CoverImage";
import { AudioPlayerBar } from "../audio/AudioPlayerBar";
import { RejectSongModal } from "./RejectSongModal";
import { MODERATION_RULES_LIST } from "../../utils/rules";
import { formatDuration, formatDateTime } from "../../utils/formatters";

/**
 * SongModerationModal: Bảng kiểm duyệt bài hát toàn diện
 * - Kích thước lớn chiếm khoảng 80% - 85% màn hình (w-[88vw] max-w-6xl max-h-[88vh])
 * - Hiển thị đầy đủ: Thông tin tác phẩm, Nghệ sĩ sở hữu, Nghệ sĩ tham gia, Thanh phát nhạc Cloudinary, Lời bài hát
 * - Bắt buộc Admin phải duyệt qua toàn bộ 7 quy tắc kiểm duyệt thì nút "Phê Duyệt" mới được kích hoạt
 */
export const SongModerationModal = ({
  isOpen,
  onClose,
  song,
  songsList = [],
  onSelectSong,
}) => {
  const queryClient = useQueryClient();

  // Bộ checklist 7 quy tắc: key là mã quy tắc, value là boolean
  const [checkedRules, setCheckedRules] = useState({});

  // Trạng thái hiển thị lời bài hát (Lyrics)
  const [showLyrics, setShowLyrics] = useState(false);

  // Modal Từ chối bài hát
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingRuleCode, setRejectingRuleCode] = useState(null);

  // Reset quy tắc khi chuyển đổi bài hát hoặc đóng modal
  const [prevSongId, setPrevSongId] = useState(song?.id);
  if (song?.id !== prevSongId) {
    setPrevSongId(song?.id);
    setCheckedRules({});
    setShowLyrics(false);
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

  // ── TRUY VẤN LỜI BÀI HÁT (LYRICS) ──
  const { data: lyricsData, isLoading: isLyricsLoading } = useQuery({
    queryKey: ["songLyricsModal", song?.id],
    queryFn: () => getSongLyricsApi(song?.id),
    enabled: Boolean(isOpen && song?.id && showLyrics),
  });

  const songLyrics = typeof lyricsData?.data === "string"
    ? lyricsData.data
    : (lyricsData?.data?.content || null);

  // Xác định vị trí bài hát hiện tại trong danh sách để điều hướng nhanh
  const currentIndex = song ? songsList.findIndex((s) => s.id === song.id) : -1;
  const prevSong = currentIndex > 0 ? songsList[currentIndex - 1] : null;
  const nextSong = currentIndex >= 0 && currentIndex < songsList.length - 1 ? songsList[currentIndex + 1] : null;

  // ── MUTATION PHÊ DUYỆT BÀI HÁT (Đặt trên cùng để tuân thủ Rules of Hooks) ──
  const approveMutation = useMutation({
    mutationFn: (songId) =>
      updateSongStatusApi(songId, {
        status: "APPROVED",
        rejectionReason: null,
      }),
    onSuccess: () => {
      toast.success("Đã phê duyệt bài hát thành công!", {
        description: `Bài hát "${song?.title || "này"}" đã được công khai trên nền tảng.`,
      });
      // Invalidate các query liên quan
      queryClient.invalidateQueries({ queryKey: ["adminPendingSongs"] });
      queryClient.invalidateQueries({ queryKey: ["pendingSongsCount"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardPendingSongs"] });

      // Nếu còn bài tiếp theo trong danh sách, tự động chuyển sang bài đó
      if (nextSong) {
        onSelectSong(nextSong);
      } else if (prevSong) {
        onSelectSong(prevSong);
      } else {
        onClose();
      }
    },
    onError: (err) => {
      console.error("Lỗi khi duyệt bài hát:", err);
      const msg = err.response?.data?.message || "Không thể phê duyệt bài hát. Vui lòng thử lại.";
      toast.error("Phê duyệt thất bại", { description: msg });
    },
  });

  if (!isOpen || !song) return null;

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
        description: "Bạn cần kiểm tra và tích chọn toàn bộ 7 quy tắc kiểm duyệt trước khi phê duyệt bài hát.",
      });
      return;
    }
    approveMutation.mutate(song.id);
  };

  const handleOpenReject = (ruleCode = null) => {
    setRejectingRuleCode(ruleCode);
    setIsRejectModalOpen(true);
  };

  const handleRejectSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["adminPendingSongs"] });
    queryClient.invalidateQueries({ queryKey: ["pendingSongsCount"] });
    queryClient.invalidateQueries({ queryKey: ["dashboardPendingSongs"] });

    if (nextSong) {
      onSelectSong(nextSong);
    } else if (prevSong) {
      onSelectSong(prevSong);
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

      {/* Bảng Hộp Thoại Kiểm Duyệt Kích Thước ~80% - 85% Màn Hình */}
      <div
        className="relative w-[92vw] max-w-6xl max-h-[90vh] bg-[#161616] border border-white/[0.08] rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.98)] z-10 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* ── HEADER CỐ ĐỊNH CỦA BẢNG KIỂM DUYỆT ── */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1a1a1a] border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#fa2d48]/15 border border-[#fa2d48]/30 flex items-center justify-center text-[#fa2d48] flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
                  Bảng Thẩm Định & Kiểm Duyệt Bài Hát
                </h3>
                <StatusBadge status="PENDING" size="sm" />
              </div>
              <p className="text-xs text-neutral-400 font-mono truncate" title={song.id}>
                Song ID: {song.id}
              </p>
            </div>
          </div>

          {/* Điều hướng Bài Trước / Bài Sau & Đóng */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-[#202020] p-1 rounded-xl border border-white/[0.04] text-xs">
              <button
                type="button"
                onClick={() => prevSong && onSelectSong(prevSong)}
                disabled={!prevSong}
                className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Bài hát trước"
              >
                <ChevronLeft size={14} />
                <span>Trước</span>
              </button>
              <span className="text-[11px] text-neutral-500 px-1 font-mono">
                {currentIndex + 1} / {songsList.length}
              </span>
              <button
                type="button"
                onClick={() => nextSong && onSelectSong(nextSong)}
                disabled={!nextSong}
                className="px-2.5 py-1.5 rounded-lg flex items-center gap-1 font-semibold text-neutral-300 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                title="Bài hát tiếp theo"
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

        {/* ── NỘI DUNG CUỘN ĐỘC LẬP (SCROLLABLE BODY) ── */}
        <div className="p-6 overflow-y-auto scrollbar-thin space-y-6 flex-1">
          {/* ── KHỐI 1: TÁC PHẨM & TÁC GIẢ (SPLIT 2 CỘT) ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Cột 1: Thông tin Bài hát */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-[#1e1e1e] border border-white/[0.04]">
              <CoverImage
                src={song.coverImage || song.coverUrl}
                alt={song.title}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl shadow-lg flex-shrink-0"
                fallbackIconSize={36}
              />

              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  {song.explicit && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                      EXPLICIT
                    </span>
                  )}
                  {song.genres?.map((g) => (
                    <span
                      key={g.id || g}
                      className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300"
                    >
                      {g.name || g}
                    </span>
                  ))}
                </div>

                <h2 className="text-xl font-black text-white tracking-tight break-words">
                  {song.title}
                </h2>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-400 pt-1">
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Thời lượng</span>
                    <span className="font-mono text-white font-bold">
                      {formatDuration(song.durationSeconds || song.duration)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-neutral-500 font-semibold uppercase block">Ngày gửi duyệt</span>
                    <span className="text-white">
                      {formatDateTime(song.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cột 2: Nghệ sĩ sở hữu & Nghệ sĩ tham gia */}
            <div className="lg:col-span-5 flex flex-col gap-3">
              {/* Box Nghệ sĩ sở hữu */}
              <div className="p-3.5 rounded-xl bg-[#1e1e1e] border border-white/[0.04] flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-[#fa2d48]/20 border border-[#fa2d48]/40 text-[#fa2d48] font-bold flex items-center justify-center text-xs flex-shrink-0">
                    {song.ownerName ? song.ownerName.charAt(0).toUpperCase() : "A"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                      Nghệ sĩ sở hữu tác phẩm
                    </span>
                    <p className="text-xs font-bold text-white truncate">
                      {song.ownerName || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded-full bg-[#fa2d48]/20 text-[#fa2d48] font-bold flex-shrink-0">
                  Chủ sở hữu
                </span>
              </div>

              {/* Box Nghệ sĩ tham gia */}
              <div className="p-3.5 rounded-xl bg-[#1e1e1e] border border-white/[0.04] space-y-1.5 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
                    <Users size={12} className="text-sky-400" /> Nghệ sĩ tham gia ({song.artists?.length || 0})
                  </span>
                  <span className="text-[10px] text-neutral-500">Featuring / Hợp tác</span>
                </div>

                <div className="space-y-1 max-h-20 overflow-y-auto scrollbar-thin pr-1">
                  {!song.artists || song.artists.length === 0 ? (
                    <p className="text-[11px] text-neutral-500 italic py-1">
                      Tác phẩm độc tấu / Solo (Không có nghệ sĩ tham gia khác).
                    </p>
                  ) : (
                    song.artists.map((artist, idx) => (
                      <div
                        key={artist.artistId || idx}
                        className="flex items-center justify-between p-1 px-2 rounded-lg bg-black/30 border border-white/[0.02] text-xs"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0" />
                          <span className="text-[11px] font-semibold text-white truncate">
                            {artist.artistName || "Nghệ sĩ phụ"}
                          </span>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-300 font-mono uppercase">
                          {artist.role || "FEATURING"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── KHỐI 2: TRÌNH PHÁT NHẠC THẨM ĐỊNH (AUDIO PLAYER BAR) ── */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Music size={14} className="text-[#fa2d48]" /> Trình nghe kiểm định âm thanh
            </span>
            <AudioPlayerBar
              src={song.audioUrl}
              title={song.title}
              artist={song.ownerName}
            />
          </div>

          {/* ── KHỐI 3: KIỂM TRA LỜI BÀI HÁT (LYRICS) ── */}
          <div className="p-4 rounded-xl bg-[#1e1e1e] border border-white/[0.04] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
                <FileText size={14} className="text-[#fa2d48]" />
                Kiểm tra Lời bài hát (Lyrics)
              </span>
              <button
                type="button"
                onClick={() => setShowLyrics(!showLyrics)}
                className="text-xs text-[#fa2d48] hover:underline font-semibold cursor-pointer"
              >
                {showLyrics ? "Thu gọn lời" : "Xem ca từ thẩm định"}
              </button>
            </div>

            {showLyrics && (
              <div className="mt-2 pt-2 border-t border-white/[0.04] text-xs animate-in fade-in duration-150">
                {isLyricsLoading ? (
                  <p className="text-neutral-500 py-2">Đang tải lời bài hát...</p>
                ) : songLyrics ? (
                  <div className="max-h-40 overflow-y-auto scrollbar-thin p-3 rounded-lg bg-black/40 text-neutral-300 leading-relaxed whitespace-pre-line font-sans border border-white/[0.04]">
                    {songLyrics}
                  </div>
                ) : (
                  <p className="text-neutral-500 italic py-2">
                    Bài hát này chưa được nghệ sĩ đính kèm lời bài hát (Lyrics).
                  </p>
                )}
              </div>
            )}
          </div>

          {/* ── KHỐI 4: BỘ 7 QUY TẮC KIỂM DUYỆT BẮT BUỘC (CORE CHECKLIST) ── */}
          <div className="p-5 rounded-2xl bg-[#1a1a1a] border border-[#fa2d48]/30 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="text-[#fa2d48]" size={18} />
                  <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider">
                    Bộ 7 Quy Tắc Thẩm Định Bắt Buộc
                  </h4>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Admin bắt buộc phải kiểm tra và xác nhận đạt chuẩn toàn bộ 7 quy tắc trước khi có thể phê duyệt.
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
                  Tiến độ kiểm định chất lượng:
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

        {/* ── FOOTER CỐ ĐỊNH: QUYẾT ĐỊNH PHÊ DUYỆT / TỪ CHỐI ── */}
        <div className="px-6 py-4 bg-[#1a1a1a] border-t border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-shrink-0">
          <div className="text-xs text-neutral-400">
            {isAllRulesPassed ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 size={15} /> Đã thẩm định đạt 7/7 quy tắc. Sẵn sàng phê duyệt công khai!
              </span>
            ) : (
              <span className="text-[#fa2d48] font-medium flex items-center gap-1.5">
                <ShieldCheck size={15} /> Cần kiểm tra đủ 7 quy tắc trước khi có thể phê duyệt.
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
              <span>Từ Chối Bài Hát</span>
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
                  : "Phê duyệt và công khai bài hát"
              }
              className="text-xs px-6"
            >
              <CheckCircle2 size={16} />
              <span>Phê Duyệt Bài Hát</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ── MODAL TỪ CHỐI BÀI HÁT ── */}
      <RejectSongModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        song={song}
        initialRuleCode={rejectingRuleCode}
        onSuccess={handleRejectSuccess}
      />
    </div>
  );
};

export default SongModerationModal;
