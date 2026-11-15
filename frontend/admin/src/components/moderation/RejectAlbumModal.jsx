import React, { useState } from "react";
import {
  AlertTriangle,
  XCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { CoverImage } from "../ui/CoverImage";
import { MODERATION_RULES, MODERATION_RULES_LIST, formatRejectionReason } from "../../utils/rules";
import { updateAlbumStatusApi } from "../../api/catalog";

export const RejectAlbumModal = ({
  isOpen,
  onClose,
  album,
  initialRuleCode,
  onSuccess,
}) => {
  const [selectedRule, setSelectedRule] = useState(initialRuleCode || "RULE_COPYRIGHT");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevInitialRule, setPrevInitialRule] = useState(initialRuleCode);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Cập nhật quy tắc ban đầu ngay trong render-phase (tuân thủ React 19)
  if (isOpen !== prevIsOpen || initialRuleCode !== prevInitialRule) {
    setPrevIsOpen(isOpen);
    setPrevInitialRule(initialRuleCode);
    if (initialRuleCode && MODERATION_RULES[initialRuleCode]) {
      setSelectedRule(initialRuleCode);
    } else {
      setSelectedRule("RULE_COPYRIGHT");
    }
    setNote("");
  }

  if (!album) return null;

  const currentRuleObj = MODERATION_RULES[selectedRule] || MODERATION_RULES.RULE_OTHER;

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!note.trim()) {
      toast.error("Vui lòng nhập lý do hoặc hướng dẫn cụ thể cho nghệ sĩ!");
      return;
    }

    try {
      setIsSubmitting(true);
      const fullReason = formatRejectionReason(selectedRule, note);

      await updateAlbumStatusApi(album.id, {
        status: "REJECTED",
        rejectionReason: fullReason,
      });

      toast.success("Đã từ chối album vi phạm!", {
        description: `Lý do "${currentRuleObj.title}" và trạng thái từ chối đã được cascade xuống toàn bộ bài hát trong album.`,
      });

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi khi từ chối album:", err);
      const msg = err.response?.data?.message || "Không thể cập nhật trạng thái album. Vui lòng thử lại.";
      toast.error("Từ chối album thất bại", { description: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFillQuickNote = (templateNote) => {
    setNote(templateNote);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Từ Chối Kiểm Duyệt Album"
      description="Album vi phạm sẽ bị từ chối và toàn bộ bài hát trong album sẽ tự động cascade sang trạng thái từ chối kèm lý do."
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Card Tóm tắt Album bị từ chối */}
        <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#121212] border border-white/[0.04]">
          <CoverImage
            src={album.coverImage || album.coverUrl}
            alt={album.title}
            isAlbum
            className="w-12 h-12 rounded-lg"
            fallbackIconSize={20}
          />
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
              Album vi phạm
            </span>
            <p className="text-sm font-bold text-white truncate">{album.title}</p>
            <p className="text-xs text-neutral-400 truncate">
              Chủ sở hữu: <span className="text-white font-medium">{album.ownerName || "Nghệ sĩ"}</span> ({album.totalTracks || 0} bài hát)
            </p>
          </div>
        </div>

        {/* 1. Chọn Quy tắc Vi phạm */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-300">
            Quy tắc vi phạm chuẩn hóa <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
            {MODERATION_RULES_LIST.map((rule) => {
              const isSelected = selectedRule === rule.code;
              return (
                <div
                  key={rule.code}
                  onClick={() => setSelectedRule(rule.code)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-rose-500/15 border-rose-500/60 text-white shadow-sm"
                      : "bg-[#202020] border-white/[0.04] text-neutral-400 hover:text-white hover:border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#fa2d48]">{rule.code}</span>
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                  </div>
                  <p className="text-xs font-semibold text-white mt-0.5 line-clamp-1">
                    {rule.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Thông tin chi tiết của quy tắc đã chọn */}
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs space-y-1">
          <p className="font-bold text-rose-300 flex items-center gap-1.5">
            <AlertTriangle size={14} />
            {currentRuleObj.title}
          </p>
          <p className="text-neutral-300 leading-relaxed">{currentRuleObj.description}</p>
          <p className="text-emerald-400 pt-1 font-medium">
            <span className="font-bold">Gợi ý cho nghệ sĩ:</span> {currentRuleObj.tip}
          </p>
        </div>

        {/* 2. Ghi chú chi tiết cho Nghệ sĩ */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-neutral-300">
              Ghi chú chi tiết từ Ban Quản trị <span className="text-rose-400">*</span>
            </label>
            <span className="text-[10px] text-neutral-400">Nghệ sĩ sẽ đọc được lời nhắn này</span>
          </div>

          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={currentRuleObj.placeholder || "Mô tả chi tiết nguyên nhân từ chối album và hướng khắc phục..."}
            className="w-full bg-[#202020] text-white text-xs rounded-xl p-3 outline-none border border-neutral-700 focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500 transition-all resize-none"
          />

          {/* Gợi ý điền nhanh */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-neutral-500 font-semibold flex items-center gap-1">
              <Sparkles size={11} className="text-[#fa2d48]" /> Gợi ý nhanh:
            </span>
            <button
              type="button"
              onClick={() => handleFillQuickNote(currentRuleObj.description)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#242424] hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Mô tả chuẩn
            </button>
            <button
              type="button"
              onClick={() => handleFillQuickNote(`${currentRuleObj.description} ${currentRuleObj.tip}`)}
              className="text-[11px] px-2 py-0.5 rounded-md bg-[#242424] hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors cursor-pointer"
            >
              Kèm hướng dẫn sửa
            </button>
          </div>
        </div>

        {/* Nút Hành động */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            isLoading={isSubmitting}
            className="px-5"
          >
            <XCircle size={15} />
            <span>Xác nhận Từ chối Album</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RejectAlbumModal;
