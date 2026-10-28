import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
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
import { SearchPage } from './pages/SearchPage';

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
            <Route path="/search" element={<SearchPage />} />
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
