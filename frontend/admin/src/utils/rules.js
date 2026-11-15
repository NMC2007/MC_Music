/**
 * Bộ quy tắc kiểm duyệt âm nhạc chuẩn hóa của nền tảng MC Music
 * Dùng chung giữa Admin Web (để chọn lý do từ chối/gỡ bỏ) và Artist Studio (để hiển thị giải thích).
 */
export const MODERATION_RULES = {
  RULE_COPYRIGHT: {
    code: "RULE_COPYRIGHT",
    title: "Vi phạm bản quyền âm nhạc",
    description: "Nội dung chứa bản ghi âm, sample, vocal hoặc giai điệu đang có tranh chấp bản quyền sở hữu trí tuệ.",
    tip: "Vui lòng sử dụng bản ghi gốc thuộc quyền sở hữu của bạn hoặc cung cấp giấy phép sử dụng hợp pháp.",
    placeholder: "Mô tả đoạn nhạc, sample hoặc đối tác khiếu nại bản quyền...",
  },
  RULE_AUDIO_QUALITY: {
    code: "RULE_AUDIO_QUALITY",
    title: "Chất lượng âm thanh không đạt chuẩn",
    description: "Tệp âm thanh bị rè, méo tiếng, clipping, hoặc thời lượng không khớp.",
    tip: "Vui lòng xuất lại tệp âm thanh định dạng MP3 (tối thiểu 320kbps) hoặc WAV với mức âm lượng chuẩn hóa (-14 LUFS).",
    placeholder: "Chỉ rõ đoạn giây bị rè, méo tiếng hoặc vấn đề chất lượng...",
  },
  RULE_METADATA: {
    code: "RULE_METADATA",
    title: "Siêu dữ liệu (Metadata) không hợp lệ",
    description: "Tên bài hát, tên nghệ sĩ hoặc nghệ sĩ hợp tác không chính xác, viết hoa tùy tiện hoặc spam từ khóa.",
    tip: "Vui lòng chỉnh sửa lại tên bài hát và danh sách nghệ sĩ đúng chính tả và quy chuẩn.",
    placeholder: "Chỉ rõ lỗi chính tả, tên nghệ sĩ sai hoặc ký tự không hợp lệ...",
  },
  RULE_COVER_ART: {
    code: "RULE_COVER_ART",
    title: "Ảnh bìa không đạt chuẩn",
    description: "Ảnh bìa mờ nhòe (độ phân giải thấp), chứa watermark lạ, quảng cáo hoặc hình ảnh phản cảm.",
    tip: "Vui lòng tải lên ảnh bìa hình vuông (tối thiểu 1000x1000px), độ phân giải cao và không có watermark của nền tảng khác.",
    placeholder: "Chỉ rõ vấn đề về ảnh bìa (độ phân giải, watermark, kích thước)...",
  },
  RULE_EXPLICIT: {
    code: "RULE_EXPLICIT",
    title: "Thiếu cảnh báo nội dung nhạy cảm",
    description: "Ca từ có chứa từ ngữ thô tục, bạo lực hoặc người lớn nhưng chưa bật nhãn cảnh báo Explicit.",
    tip: "Vui lòng vào màn hình Chỉnh sửa và tích chọn ô 'Nội dung nhạy cảm (Explicit)'.",
    placeholder: "Chỉ rõ đoạn ca từ nhạy cảm cần gắn nhãn Explicit...",
  },
  RULE_COMMUNITY: {
    code: "RULE_COMMUNITY",
    title: "Vi phạm tiêu chuẩn cộng đồng",
    description: "Nội dung kích động bạo lực, thù hận, phân biệt đối xử hoặc xuyên tạc thông tin.",
    tip: "Nội dung vi phạm nghiêm trọng tiêu chuẩn cộng đồng của MC Music.",
    placeholder: "Chỉ rõ điều khoản tiêu chuẩn cộng đồng bị vi phạm...",
  },
  RULE_OTHER: {
    code: "RULE_OTHER",
    title: "Quy định bổ sung khác",
    description: "Nội dung chưa đáp ứng một số tiêu chuẩn vận hành kỹ thuật hoặc pháp lý của nền tảng.",
    tip: "Vui lòng tham khảo kỹ lời nhắn chi tiết từ Ban quản trị bên dưới.",
    placeholder: "Ghi chú chi tiết lý do và yêu cầu cần khắc phục...",
  },
};

/**
 * Danh sách dạng mảng để render dropdown/select trong Modal từ chối
 */
export const MODERATION_RULES_LIST = Object.values(MODERATION_RULES);

/**
 * Ghép mã quy tắc và ghi chú của Admin thành chuỗi chuẩn lưu vào DB:
 * Cấu trúc: "RULE_CODE: Lời nhắn chi tiết..."
 */
export const formatRejectionReason = (ruleCode, note) => {
  const cleanCode = ruleCode || "RULE_OTHER";
  const cleanNote = (note || "").trim();
  if (!cleanNote) {
    const defaultTitle = MODERATION_RULES[cleanCode]?.title || cleanCode;
    return `${cleanCode}: ${defaultTitle}`;
  }
  return `${cleanCode}: ${cleanNote}`;
};

/**
 * Phân tích chuỗi lý do từ chối từ cơ sở dữ liệu:
 * Trả về { ruleCode, ruleInfo, note }
 */
export const parseRejectionReason = (rawReason) => {
  if (!rawReason) {
    return {
      ruleCode: null,
      ruleInfo: null,
      note: "Không có lời nhắn chi tiết.",
    };
  }

  const match = rawReason.match(/^(RULE_[A-Z_]+):\s*(.*)$/s);
  if (match) {
    const code = match[1];
    const note = match[2].trim();
    return {
      ruleCode: code,
      ruleInfo: MODERATION_RULES[code] || { code, title: code, description: "", tip: "" },
      note: note || MODERATION_RULES[code]?.title || "Vui lòng kiểm tra lại theo quy chuẩn của nền tảng.",
    };
  }

  return {
    ruleCode: null,
    ruleInfo: null,
    note: rawReason,
  };
};

export default MODERATION_RULES;

