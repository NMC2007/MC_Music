import React from "react";
import { useLocation, useNavigate } from "react-router";
import { Home, Search, Library, User } from "lucide-react";
import { Button } from "../components/ui/Button";
import { MOBILE_NAV_TABS } from "../constants/navigation";
import { LAYOUT_CONFIG, Z_INDEX } from "../constants/layout";

// Bản đồ icon từ Lucide React
const ICON_MAP = {
  Home,
  Search,
  Library,
  User,
};

export const MobileBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isTabActive = (tab) => {
    if (tab.matchExact) {
      return location.pathname === tab.path;
    }
    if (tab.activePaths && tab.activePaths.some((p) => location.pathname.startsWith(p))) {
      return true;
    }
    return location.pathname.startsWith(tab.path);
  };

  return (
    <nav
      aria-label="Thanh điều hướng di động"
      className={`fixed bottom-0 left-0 right-0 ${LAYOUT_CONFIG.BOTTOM_NAV_HEIGHT} bg-[#121212]/95 backdrop-blur-xl border-t border-neutral-800/80 flex items-center justify-around md:hidden px-4 py-1 ${Z_INDEX.BOTTOM_NAV}`}
      style={{ paddingBottom: "max(4px, env(safe-area-inset-bottom, 0px))" }}
    >
      {MOBILE_NAV_TABS.map((tab) => {
        const IconComponent = ICON_MAP[tab.iconName] || Home;
        const active = isTabActive(tab);

        return (
          <Button
            key={tab.id}
            type="button"
            variant="ghost"
            size="md"
            iconOnly
            aria-label={tab.label}
            aria-current={active ? "page" : undefined}
            onClick={() => navigate(tab.path)}
            className={`!w-12 !h-11 hover:!bg-transparent active:!bg-white/5 select-none ${
              active
                ? "!text-[#fa2d48] scale-110"
                : "text-spotify-sub hover:text-white"
            }`}
          >
            <IconComponent size={22} strokeWidth={active ? 2.4 : 2} />
          </Button>
        );
      })}
    </nav>
  );
};
