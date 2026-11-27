/**
 * Cấu hình kích thước và phân lớp Z-Index tập trung cho toàn bộ ứng dụng Users Frontend
 * Tuân thủ nguyên tắc Zero Hardcoding (Không fix cứng số đo trong code).
 */

export const BREAKPOINTS = {
  MD_PX: 768,
  LG_PX: 1024,
};

export const LAYOUT_CONFIG = {
  TOPBAR_HEIGHT: "h-16",
  BOTTOM_NAV_HEIGHT: "min-h-[56px]",
  MINI_PLAYER_HEIGHT: "h-[56px]",
  MINI_PLAYER_BOTTOM_OFFSET: "bottom-[calc(60px+env(safe-area-inset-bottom,0px))]",
  // Khoảng đệm an toàn dưới chân trang:
  // Mobile: 56px (Nav) + 56px (Mini Player) + 32px (Khoảng thở) = ~144px (pb-36)
  BOTTOM_SPACING_MOBILE: "pb-36",
  BOTTOM_SPACING_DESKTOP: "pb-6",
  // Padding lề ngang nội dung:
  PADDING_X_MOBILE: "px-3",
  PADDING_X_DESKTOP: "px-6",
};

export const Z_INDEX = {
  CONTENT: "z-0",
  SIDEBAR: "z-10",
  TOPBAR: "z-30",
  BOTTOM_NAV: "z-40",
  MINI_PLAYER: "z-[45]",
  FULL_PLAYER: "z-[48]",
  MODAL: "z-50",
  TOAST: "z-[60]",
};
