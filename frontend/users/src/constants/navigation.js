/**
 * Cấu hình danh mục Tab điều hướng đáy trên thiết bị di động (Mobile Bottom Navigation)
 * Tuân thủ nguyên tắc dễ mở rộng, bảo trì và không hardcode.
 */

export const LIBRARY_FILTERS = ["Playlist", "EP", "Album", "Nghệ sĩ"];

export const MOBILE_NAV_TABS = [
  {
    id: "home",
    label: "Trang chủ",
    path: "/",
    iconName: "Home",
    matchExact: true,
  },
  {
    id: "search",
    label: "Tìm kiếm",
    path: "/search",
    iconName: "Search",
    matchExact: false,
  },
  {
    id: "library",
    label: "Thư viện",
    path: "/library",
    iconName: "Library",
    matchExact: false,
    // Danh sách các path thuộc phạm trù Thư viện
    activePaths: ["/library", "/collection/tracks", "/liked", "/playlist"],
  },
  {
    id: "profile",
    label: "Cá nhân",
    path: "/profile",
    iconName: "User",
    matchExact: false,
    activePaths: ["/profile", "/login", "/register"],
  },
];
