import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SongsPage } from "./pages/SongsPage";
import { AlbumsPage } from "./pages/AlbumsPage";
import { ProfilePage } from "./pages/ProfilePage";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ArtistLayout } from "./layouts/ArtistLayout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Thông báo Sonner nổi bật góc trên bên phải */}
        <Toaster theme="dark" position="top-right" richColors />

        <Routes>
          {/* 1. Màn hình Xác thực công khai */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* 2. Không gian làm việc Studio: Được bảo vệ bởi ProtectedRoute & bao bọc trong ArtistLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<ArtistLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/songs" element={<SongsPage />} />
              <Route path="/albums" element={<AlbumsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* 3. Bắt mọi đường dẫn không tồn tại và điều hướng an toàn về root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
