import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "sonner";

import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PendingSongsPage } from "./pages/PendingSongsPage";
import { PendingAlbumsPage } from "./pages/PendingAlbumsPage";
import { UsersPage } from "./pages/UsersPage";
import { ArtistsPage } from "./pages/ArtistsPage";

import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AdminLayout } from "./layouts/AdminLayout";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Thông báo Sonner nổi bật phong cách Spotify Dark */}
        <Toaster theme="dark" position="top-right" richColors />

        <Routes>
          {/* 1. Màn hình Xác thực Quản trị viên công khai */}
          <Route path="/login" element={<LoginPage />} />

          {/* 2. Không gian Quản trị: Được bảo vệ bởi ProtectedRoute & bao bọc trong AdminLayout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/songs" element={<PendingSongsPage />} />
              <Route path="/albums" element={<PendingAlbumsPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/artists" element={<ArtistsPage />} />
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
