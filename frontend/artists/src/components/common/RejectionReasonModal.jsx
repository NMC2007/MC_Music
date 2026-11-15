import React from "react";
import { AlertTriangle, CheckCircle, ShieldAlert } from "lucide-react";
import { Modal } from "#/components/ui/Modal";
import { Button } from "#/components/ui/Button";

// Bản đồ dịch mã quy tắc sang tên tiếng Việt và hướng dẫn xử lý
const RULE_MAP = {
  RULE_COPYRIGHT: {
    title: "Vi phạm bản quyền âm nhạc",
    description: "Nội dung chứa bản ghi âm, sample, vocal hoặc giai điệu đang có tranh chấp bản quyền sở hữu trí tuệ.",
    tip: "Vui lòng sử dụng bản ghi gốc thuộc quyền sở hữu của bạn hoặc cung cấp giấy phép sử dụng hợp pháp.",
  },
  RULE_AUDIO_QUALITY: {
    title: "Chất lượng âm thanh không đạt chuẩn",
    description: "Tệp âm thanh bị rè, méo tiếng, clipping, hoặc thời lượng không khớp.",
    tip: "Vui lòng xuất lại tệp âm thanh định dạng MP3 (tối thiểu 320kbps) hoặc WAV với mức âm lượng chuẩn hóa (-14 LUFS).",
  },
  RULE_METADATA: {
    title: "Siêu dữ liệu (Metadata) không hợp lệ",
    description: "Tên bài hát, tên nghệ sĩ hoặc nghệ sĩ hợp tác không chính xác, viết hoa tùy tiện hoặc spam từ khóa.",
    tip: "Vui lòng chỉnh sửa lại tên bài hát và danh sách nghệ sĩ đúng chính tả và quy chuẩn.",
  },
  RULE_COVER_ART: {
    title: "Ảnh bìa không đạt chuẩn",
    description: "Ảnh bìa mờ nhòe (độ phân giải thấp), chứa watermark lạ, quảng cáo hoặc hình ảnh phản cảm.",
    tip: "Vui lòng tải lên ảnh bìa hình vuông (tối thiểu 1000x1000px), độ phân giải cao và không có watermark của nền tảng khác.",
  },
  RULE_EXPLICIT: {
    title: "Thiếu cảnh báo nội dung nhạy cảm",
    description: "Ca từ có chứa từ ngữ thô tục, bạo lực hoặc người lớn nhưng chưa bật nhãn cảnh báo Explicit.",
    tip: "Vui lòng vào màn hình Chỉnh sửa và tích chọn ô 'Nội dung nhạy cảm (Explicit)'.",
  },
  RULE_COMMUNITY: {
    title: "Vi phạm tiêu chuẩn cộng đồng",
    description: "Nội dung kích động bạo lực, thù hận hoặc xuyên tạc thông tin.",
    tip: "Nội dung vi phạm nghiêm trọng tiêu chuẩn cộng đồng của MC Music.",
  },
  RULE_OTHER: {
    title: "Quy định bổ sung khác",
    description: "Nội dung chưa đáp ứng một số tiêu chuẩn vận hành của nền tảng.",
    tip: "Vui lòng tham khảo kỹ lời nhắn chi tiết từ Ban quản trị bên dưới.",
  },
};

/**
 * Phân tích chuỗi lý do từ chối:
 * Dạng "RULE_XXX: Lời nhắn chi tiết..." hoặc text thuần
 */
const parseRejectionReason = (rawReason) => {
  if (!rawReason) return { ruleCode: null, ruleInfo: null, note: "Không có lời nhắn chi tiết." };

  const match = rawReason.match(/^(RULE_[A-Z_]+):\s*(.*)$/s);
  if (match) {
    const code = match[1];
    const note = match[2].trim();
    return {
      ruleCode: code,
      ruleInfo: RULE_MAP[code] || { title: code, description: "", tip: "" },
      note: note || "Vui lòng kiểm tra lại theo quy chuẩn của nền tảng.",
    };
  }

  return {
    ruleCode: null,
    ruleInfo: null,
    note: rawReason,
  };
};

export const RejectionReasonModal = ({ isOpen, onClose, item }) => {
  if (!item) return null;

  const { title, type = "song", status = "REJECTED", reason } = item;
  const isTakedown = status === "TAKEDOWN";
  const { ruleInfo, note } = parseRejectionReason(reason);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isTakedown ? "Thông báo Gỡ bỏ Nội dung" : "Lý do Từ chối Kiểm duyệt"}
      maxWidth="max-w-md"
    >
      <div className="space-y-4 text-sm text-neutral-300">
        {/* Banner cảnh báo */}
        <div
          className={`flex items-start gap-3 p-3.5 rounded-xl border ${
            isTakedown
              ? "bg-neutral-800/60 border-neutral-700/60 text-neutral-200"
              : "bg-rose-500/10 border-rose-500/20 text-rose-300"
          }`}
        >
          {isTakedown ? (
            <AlertTriangle className="text-amber-400 flex-shrink-0 mt-0.5" size={20} />
          ) : (
            <ShieldAlert className="text-rose-400 flex-shrink-0 mt-0.5" size={20} />
          )}
          <div>
            <p className="font-semibold text-white">
              {type === "album" ? "Album" : "Bài hát"}: <span className="text-[#fa2d48]">"{title}"</span>
            </p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {isTakedown
                ? "Nội dung này đã bị gỡ bỏ khỏi nền tảng do vi phạm chính sách."
                : "Nội dung này chưa vượt qua vòng kiểm duyệt của Ban quản trị."}
            </p>
          </div>
        </div>

        {/* Danh mục quy tắc vi phạm (nếu có) */}
        {ruleInfo && (
          <div className="bg-[#121212] p-3.5 rounded-xl border border-white/[0.05]">
            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
              Danh mục vi phạm
            </span>
            <p className="text-white font-medium text-sm flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              {ruleInfo.title}
            </p>
            {ruleInfo.description && (
              <p className="text-xs text-neutral-400 mt-1">{ruleInfo.description}</p>
            )}
          </div>
        )}

        {/* Lời nhắn chi tiết từ Admin */}
        <div className="bg-[#121212] p-3.5 rounded-xl border border-white/[0.05]">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block mb-1">
            Ghi chú từ Ban quản trị (Admin)
          </span>
          <p className="text-neutral-200 whitespace-pre-wrap leading-relaxed text-xs sm:text-sm bg-neutral-900/60 p-2.5 rounded-lg border border-white/[0.03]">
            {note}
          </p>
        </div>

        {/* Hướng dẫn khắc phục */}
        {ruleInfo?.tip && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-3 rounded-xl flex items-start gap-2.5">
            <CheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={16} />
            <div className="text-xs text-emerald-300/90 leading-relaxed">
              <span className="font-semibold text-emerald-300">Gợi ý khắc phục: </span>
              {ruleInfo.tip}
            </div>
          </div>
        )}

        {/* Nút đóng */}
        <div className="pt-2 flex justify-end">
          <Button variant="dark" size="sm" onClick={onClose} className="px-5">
            Đã hiểu
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RejectionReasonModal;

