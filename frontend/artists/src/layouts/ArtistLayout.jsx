import React, { useRef, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { OnboardingProfileModal } from "#/components/auth/OnboardingProfileModal";
import { useAuthStore } from "#/store/useAuthStore";
import { getArtistProfileApi } from "#/api/artist";

export const ArtistLayout = () => {
  const location = useLocation();
  const mainRef = useRef(null);
  const { hasCompletedOnboarding, setArtist } = useAuthStore();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(!hasCompletedOnboarding);

  // Gọi API lấy profile nghệ sĩ khi đã đăng nhập và đồng bộ vào store
  const { data: profileRes } = useQuery({
    queryKey: ["artistProfile"],
    queryFn: getArtistProfileApi,
    staleTime: 1000 * 60 * 5, // 5 phút
  });

  useEffect(() => {
    if (profileRes?.data) {
      setArtist((prev) => ({
        ...prev,
        ...profileRes.data,
      }));
    }
  }, [profileRes, setArtist]);

  // Tự động cuộn lên đầu trang mỗi khi chuyển route
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Lắng nghe sự kiện mở Onboarding từ Topbar hoặc các trang khác
  useEffect(() => {
    const handleOpen = () => setIsOnboardingOpen(true);
    window.addEventListener("open-artist-onboarding", handleOpen);
    return () => window.removeEventListener("open-artist-onboarding", handleOpen);
  }, []);

  return (
    <div className="h-screen w-full bg-spotify-black flex overflow-hidden text-spotify-text p-2 sm:p-2.5 gap-2 sm:gap-2.5 select-none">
      {/* ── SIDEBAR CỐ ĐỊNH BÊN TRÁI ── */}
      <Sidebar />

      {/* ── KHUNG CHỨA NỘI DUNG CHÍNH (MAIN VIEW) ── */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-spotify-base rounded-2xl">
        {/* Topbar điều hướng */}
        <Topbar />

        {/* Nội dung trang con (Dashboard, Songs, Albums, Profile) */}
        <main
          ref={mainRef}
          className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin p-5 sm:p-8"
        >
          <Outlet />
        </main>
      </div>

      {/* ── MODAL ONBOARDING THIẾT LẬP PROFILE ── */}
      <OnboardingProfileModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
      />
    </div>
  );
};

export default ArtistLayout;
