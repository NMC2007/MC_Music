import { create } from 'zustand';

export const usePlayerStore = create((set) => ({
  currentSong: null,
  isPlaying: false,
  queue: [],
  volume: 1, // Âm lượng từ 0 đến 1

  // Set bài hát hiện tại và tự động phát
  setCurrentSong: (song) => set({ currentSong: song, isPlaying: true }),
  
  // Chuyển đổi trạng thái play/pause
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  
  // Đặt danh sách phát hiện tại
  setQueue: (queue) => set({ queue }),
  
  // Điều chỉnh âm lượng
  setVolume: (volume) => set({ volume }),
  
  // Phát bài tiếp theo trong queue
  playNext: () => set((state) => {
    if (!state.currentSong || state.queue.length === 0) return state;
    
    const currentIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
    if (currentIndex !== -1 && currentIndex < state.queue.length - 1) {
      return { currentSong: state.queue[currentIndex + 1], isPlaying: true };
    }
    
    // Nêú đang ở bài cuối, có thể loop hoặc dừng
    return { isPlaying: false };
  }),
  
  // Phát bài trước đó
  playPrevious: () => set((state) => {
    if (!state.currentSong || state.queue.length === 0) return state;
    
    const currentIndex = state.queue.findIndex(s => s.id === state.currentSong.id);
    if (currentIndex > 0) {
      return { currentSong: state.queue[currentIndex - 1], isPlaying: true };
    }
    
    // Nếu đang ở bài đầu tiên, phát lại từ đầu
    return { currentSong: state.queue[0], isPlaying: true };
  }),
}));
