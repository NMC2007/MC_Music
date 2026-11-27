import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import { Toaster } from 'sonner';

import { MainLayout } from './layouts/MainLayout';

const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('./pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const AlbumPage = lazy(() => import('./pages/AlbumPage').then((m) => ({ default: m.AlbumPage })));
const ArtistPage = lazy(() => import('./pages/ArtistPage').then((m) => ({ default: m.ArtistPage })));
const LikedSongsPage = lazy(() => import('./pages/LikedSongsPage').then((m) => ({ default: m.LikedSongsPage })));
const PlaylistPage = lazy(() => import('./pages/PlaylistPage').then((m) => ({ default: m.PlaylistPage })));
const SearchPage = lazy(() => import('./pages/SearchPage').then((m) => ({ default: m.SearchPage })));
const SectionPage = lazy(() => import('./pages/SectionPage').then((m) => ({ default: m.SectionPage })));
const SongPage = lazy(() => import('./pages/SongPage').then((m) => ({ default: m.SongPage })));
const LibraryPage = lazy(() => import('./pages/LibraryPage').then((m) => ({ default: m.LibraryPage })));

const PageLoader = () => (
  <div className="flex-1 min-h-[50vh] flex flex-col items-center justify-center gap-3">
    <div className="w-8 h-8 border-2 border-[#fa2d48] border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Toaster dùng để hiển thị thông báo góc trên bên phải */}
        <Toaster theme="dark" position="top-right" richColors />
        
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Group 1: Các trang được bọc trong MainLayout (Có Sidebar & Player) */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/song/:id" element={<SongPage />} />
              <Route path="/album/:id" element={<AlbumPage />} />
              <Route path="/artist/:id" element={<ArtistPage />} />
              <Route path="/playlist/:id" element={<PlaylistPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/collection/tracks" element={<LikedSongsPage />} />
              <Route path="/liked" element={<LikedSongsPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/section/:id" element={<SectionPage />} />
              <Route path="/genre/:id" element={<SectionPage />} />
            </Route>
            
            {/* Group 2: Các trang độc lập, toàn màn hình */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
