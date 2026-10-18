import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';

import { MainLayout } from './layouts/MainLayout';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { AlbumPage } from './pages/AlbumPage';
import { ArtistPage } from './pages/ArtistPage';
import { LikedSongsPage } from './pages/LikedSongsPage';
import { PlaylistPage } from './pages/PlaylistPage';

// Khởi tạo React Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Tùy chọn để tránh refetch liên tục khi chuyển tab
      retry: 1, // Chỉ retry 1 lần nếu API lỗi
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Toaster dùng để hiển thị thông báo góc trên bên phải */}
        <Toaster theme="dark" position="top-right" richColors />
        
        <Routes>
          {/* Group 1: Các trang được bọc trong MainLayout (Có Sidebar & Player) */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/album/:id" element={<AlbumPage />} />
            <Route path="/artist/:id" element={<ArtistPage />} />
            <Route path="/playlist/:id" element={<PlaylistPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/collection/tracks" element={<LikedSongsPage />} />
            <Route path="/liked" element={<LikedSongsPage />} />
            {/* Các trang sau này như /search, /library sẽ thêm vào đây */}
          </Route>
          
          {/* Group 2: Các trang độc lập, toàn màn hình */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
