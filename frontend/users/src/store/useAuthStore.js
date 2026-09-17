import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      login: (user, token) => set({ 
        user: user, 
        accessToken: token,
        isAuthenticated: true 
      }),
      
      logout: () => set({ 
        user: null, 
        accessToken: null,
        isAuthenticated: false 
      }),
    }),
    {
      name: 'mc-music-auth', // Tên key lưu trong localStorage
    }
  )
);
