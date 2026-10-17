import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';
import { showLoginToast } from '../utils/toastUtils';
import { getSongLyrics } from '../api/catalog/public';

const BUFFER_SIZE = 6;

// Kiểm tra trạng thái đăng nhập từ localStorage để quyết định lưu/khôi phục trình phát
const checkIsAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  try {
    const authRaw = localStorage.getItem('mc-music-auth');
    if (!authRaw) return false;
    const parsed = JSON.parse(authRaw);
    return !!parsed?.state?.isAuthenticated;
  } catch {
    return false;
  }
};

// Storage tùy biến: Chỉ đọc/ghi trạng thái nghe khi người dùng đã đăng nhập tài khoản
const authAwareStorage = {
  getItem: (name) => {
    if (!checkIsAuthenticated()) return null;
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    if (!checkIsAuthenticated()) {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
      return;
    }
    try {
      localStorage.setItem(name, value);
    } catch {
      // ignore
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

// Thuật toán xáo trộn mảng Fisher-Yates
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Tìm bài hát tiếp theo từ sourcePool để nạp bù vào hàng đợi
const getNextCandidate = (currentQueue, currentSong, sourcePool, repeatMode) => {
  if (!sourcePool || sourcePool.length === 0) return null;
  const existingIds = new Set([
    ...(currentSong ? [currentSong.id] : []),
    ...currentQueue.map((s) => s.id),
  ]);

  let lastIndex = -1;
  if (currentQueue.length > 0) {
    const lastSong = currentQueue[currentQueue.length - 1];
    lastIndex = sourcePool.findIndex((s) => s.id === lastSong.id);
  } else if (currentSong) {
    lastIndex = sourcePool.findIndex((s) => s.id === currentSong.id);
  }

  const total = sourcePool.length;
  for (let offset = 1; offset <= total; offset++) {
    const targetIdx = (lastIndex + offset) % total;
    if (repeatMode !== 'all' && lastIndex + offset >= total) {
      break;
    }
    const candidate = sourcePool[targetIdx];
    if (candidate && !existingIds.has(candidate.id)) {
      return candidate;
    }
  }

  // Nếu tất cả bài đều đã nằm trong hàng đợi nhưng repeatMode === 'all'
  if (repeatMode === 'all' && total > 1) {
    for (let offset = 1; offset <= total; offset++) {
      const targetIdx = (lastIndex + offset) % total;
      const candidate = sourcePool[targetIdx];
      if (candidate && candidate.id !== currentSong?.id) {
        return candidate;
      }
    }
  }

  return null;
};

export const usePlayerStore = create(
  persist(
    (set, get) => ({
      currentSong: null,
      isPlaying: false,
      currentTime: 0, // Vị trí phát hiện tại (giây)
      queue: [], // Hàng đợi đệm đúng 6 bài chờ
      originalQueue: [], // Bản sao lưu thứ tự gốc để khôi phục khi tắt Shuffle
      sourcePool: [], // Toàn bộ bài hát thuộc ngữ cảnh hiện tại (Album, Artist, Trending...)
      sourceIndex: -1, // Vị trí bài đang phát trong sourcePool
      history: [], // Lịch sử các bài vừa nghe trong phiên

      isShuffle: false,
      repeatMode: 'off', // 'off' | 'all' | 'one'
      volume: 1, // 0 đến 1
      lyricsCache: {}, // { [songId]: { content, language, notFound, isLoading } }

      // Bật / tạm dừng phát
      setIsPlaying: (isPlaying) => set({ isPlaying }),

      // Cập nhật vị trí phát hiện tại
      setCurrentTime: (currentTime) => set({ currentTime }),

      // Cài đặt âm lượng
      setVolume: (volume) => set({ volume }),

      // Đặt lại toàn bộ trình phát về trạng thái ban đầu (khi đăng xuất)
      resetPlayer: () => {
        set({
          currentSong: null,
          isPlaying: false,
          currentTime: 0,
          queue: [],
          originalQueue: [],
          sourcePool: [],
          sourceIndex: -1,
          history: [],
          isShuffle: false,
          repeatMode: 'off',
        });
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('mc-music-player');
          } catch {
            // ignore
          }
        }
      },

  /**
   * Tải lời bài hát và lưu trạng thái vào cache (chỉ gọi 1 lần duy nhất cho mỗi bài hát)
   */
  fetchLyrics: async (songId) => {
    if (!songId) return;
    const { lyricsCache } = get();

    // Nếu bài này đã có trong cache (kể cả trạng thái không có lời), tuyệt đối KHÔNG gọi lại API
    if (lyricsCache[songId]) return;

    // Đánh dấu đang tải
    set((state) => ({
      lyricsCache: {
        ...state.lyricsCache,
        [songId]: {
          isLoading: true,
          content: null,
          language: null,
          notFound: false,
        },
      },
    }));

    try {
      const res = await getSongLyrics(songId);
      const data = res?.data;
      set((state) => ({
        lyricsCache: {
          ...state.lyricsCache,
          [songId]: {
            isLoading: false,
            content: data?.content || null,
            language: data?.language || null,
            notFound: !data?.content,
          },
        },
      }));
    } catch {
      // 404 hoặc lỗi -> lưu trạng thái notFound = true để các lần sau không bắn request nữa
      set((state) => ({
        lyricsCache: {
          ...state.lyricsCache,
          [songId]: {
            isLoading: false,
            content: null,
            language: null,
            notFound: true,
          },
        },
      }));
    }
  },

  /**
   * Phát 1 bài kèm ngữ cảnh nguồn (Album, Artist, Trending...)
   * Nạp ngay bài đang chọn và chuẩn bị đúng 6 bài chờ kế tiếp
   */
  playSongWithContext: (song, sourceList = [], startIndex) => {
    if (!song) return;
    const pool = sourceList && sourceList.length > 0 ? sourceList : [song];
    const resolvedIndex =
      startIndex !== undefined
        ? startIndex
        : pool.findIndex((s) => s.id === song.id);
    const validIndex = resolvedIndex >= 0 ? resolvedIndex : 0;

    // Tạo hàng đợi đệm đúng BUFFER_SIZE (6 bài) từ sourcePool
    const buffer = [];
    const state = get();
    const total = pool.length;

    for (let i = 1; i <= Math.min(BUFFER_SIZE, total - 1); i++) {
      const nextIdx = (validIndex + i) % total;
      if (pool[nextIdx] && pool[nextIdx].id !== song.id) {
        buffer.push(pool[nextIdx]);
      }
    }

    let finalQueue = buffer;
    let savedOriginal = [...buffer];

    // Nếu đang bật shuffle thì xáo trộn danh sách 6 bài chờ
    if (state.isShuffle) {
      finalQueue = shuffleArray(buffer);
    }

    set({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      queue: finalQueue,
      originalQueue: savedOriginal,
      sourcePool: pool,
      sourceIndex: validIndex,
    });
  },

  /**
   * Tương thích ngược với hàm setCurrentSong cũ
   */
  setCurrentSong: (song) => {
    const { sourcePool } = get();
    if (sourcePool && sourcePool.length > 0 && sourcePool.some((s) => s.id === song.id)) {
      get().playSongWithContext(song, sourcePool);
    } else {
      get().playSongWithContext(song, [song]);
    }
  },

  /**
   * Phát lại 1 bài hát từ lịch sử nghe
   * Giữ nguyên vẹn danh sách phát tiếp theo (queue), originalQueue và sourcePool
   */
  playHistorySong: (song) => {
    if (!song) return;
    const { currentSong, history } = get();

    let updatedHistory = history;
    if (currentSong && currentSong.id !== song.id) {
      updatedHistory = [currentSong, ...history.filter((s) => s.id !== currentSong.id)].slice(0, 30);
    }

    set({
      currentSong: song,
      isPlaying: true,
      currentTime: 0,
      history: updatedHistory,
      // queue, originalQueue, sourcePool được bảo lưu nguyên vẹn 100%
    });
  },

  /**
   * Phát bài tiếp theo (Auto-Next hoặc bấm nút Next)
   * Lấy bài #1 của queue lên phát và tự động lấy 1 bài bù vào cuối queue để giữ đủ 6 bài
   */
  playNext: () => {
    const {
      queue,
      currentSong,
      sourcePool,
      repeatMode,
      isShuffle,
      originalQueue,
      history,
    } = get();

    if (!currentSong) return;

    // Nếu hàng đợi không còn bài nào
    if (queue.length === 0) {
      if (repeatMode === 'all' && sourcePool.length > 0) {
        // Lặp lại từ bài đầu tiên của pool
        get().playSongWithContext(sourcePool[0], sourcePool, 0);
      } else {
        set({ isPlaying: false });
      }
      return;
    }

    // Lấy bài đầu tiên trong hàng đợi lên làm bài phát chính
    const nextSong = queue[0];
    const newQueue = queue.slice(1);

    // Lưu bài hiện tại vào stack history
    const updatedHistory = [currentSong, ...history].slice(0, 30);

    // Tính index mới trong sourcePool
    const newSourceIndex = sourcePool.findIndex((s) => s.id === nextSong.id);

    // Nạp thêm 1 bài mới vào cuối hàng đợi để duy trì đúng 6 bài chờ
    const refillCandidate = getNextCandidate(
      newQueue,
      nextSong,
      sourcePool,
      repeatMode
    );
    if (refillCandidate) {
      newQueue.push(refillCandidate);
    }

    // Đồng bộ lại originalQueue nếu đang không ở chế độ shuffle
    let newOriginalQueue = originalQueue;
    if (!isShuffle) {
      newOriginalQueue = [...newQueue];
    } else if (refillCandidate) {
      newOriginalQueue = [...originalQueue.filter((s) => s.id !== nextSong.id), refillCandidate];
    }

    set({
      currentSong: nextSong,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      originalQueue: newOriginalQueue,
      sourceIndex: newSourceIndex >= 0 ? newSourceIndex : 0,
      history: updatedHistory,
    });
  },

  /**
   * Lùi về bài trước đó
   * YÊU CẦU: Người dùng phải đăng nhập để dùng tính năng này
   */
  playPrevious: (currentAudioTime = 0) => {
    const isAuthenticated = useAuthStore.getState().isAuthenticated;

    // Chặn người dùng chưa đăng nhập
    if (!isAuthenticated) {
      showLoginToast("nghe lại bài hát trước đó");
      return false;
    }

    const { currentSong, history, queue, sourcePool, sourceIndex } = get();
    if (!currentSong) return false;

    // Nếu bài hát đã phát > 3 giây, tua lại từ đầu bài hát
    if (currentAudioTime > 3) {
      return 'replay';
    }

    // Lấy bài gần nhất từ stack history nếu có
    if (history.length > 0) {
      const prevSong = history[0];
      const remainingHistory = history.slice(1);

      // Đưa bài hiện tại về lại đầu hàng đợi
      const updatedQueue = [currentSong, ...queue].slice(0, BUFFER_SIZE);

      const prevIndex = sourcePool.findIndex((s) => s.id === prevSong.id);

      set({
        currentSong: prevSong,
        isPlaying: true,
        currentTime: 0,
        queue: updatedQueue,
        history: remainingHistory,
        sourceIndex: prevIndex >= 0 ? prevIndex : sourceIndex,
      });
      return true;
    }

    // Nếu không có history nhưng có bài trước đó trong sourcePool
    if (sourcePool.length > 0 && sourceIndex > 0) {
      const prevSong = sourcePool[sourceIndex - 1];
      const updatedQueue = [currentSong, ...queue].slice(0, BUFFER_SIZE);

      set({
        currentSong: prevSong,
        isPlaying: true,
        currentTime: 0,
        queue: updatedQueue,
        sourceIndex: sourceIndex - 1,
      });
      return true;
    }

    return 'replay';
  },

  /**
   * Bật / Tắt Trộn bài (Smart Shuffle)
   * Khi bật: xáo trộn 6 bài trong queue
   * Khi tắt: hoàn trả nguyên vẹn thứ tự ban đầu từ originalQueue
   */
  toggleShuffle: () => {
    const { isShuffle, queue, originalQueue } = get();
    const nextShuffle = !isShuffle;

    if (nextShuffle) {
      // Bật shuffle: sao lưu thứ tự gốc và xáo trộn queue
      const snapshot = [...queue];
      const shuffled = shuffleArray(queue);
      set({
        isShuffle: true,
        originalQueue: snapshot,
        queue: shuffled,
      });
    } else {
      // Tắt shuffle: khôi phục nguyên vẹn thứ tự ban đầu
      const restored = originalQueue.length > 0 ? [...originalQueue] : queue;
      set({
        isShuffle: false,
        queue: restored,
      });
    }
  },

  /**
   * Xoay vòng chế độ lặp lại: 'off' -> 'all' -> 'one' -> 'off'
   */
  toggleRepeatMode: () => {
    const { repeatMode } = get();
    const modes = ['off', 'all', 'one'];
    const nextIdx = (modes.indexOf(repeatMode) + 1) % modes.length;
    set({ repeatMode: modes[nextIdx] });
  },

  /**
   * Thay đổi thứ tự phát bằng kéo thả (Drag & Drop Reorder)
   */
  reorderQueue: (startIndex, endIndex) => {
    const { queue } = get();
    const updated = [...queue];
    const [movedItem] = updated.splice(startIndex, 1);
    updated.splice(endIndex, 0, movedItem);

    set({
      queue: updated,
      originalQueue: updated, // Cập nhật luôn thứ tự mới do user chủ động sắp xếp
    });
  },

  /**
   * Xóa một bài khỏi hàng đợi chờ phát
   * Tự động kéo 1 bài tiếp theo từ sourcePool lên bù vào để luôn đủ 6 bài
   */
  removeFromQueue: (songId) => {
    const { queue, currentSong, sourcePool, repeatMode, originalQueue } = get();
    const remaining = queue.filter((s) => s.id !== songId);

    // Tìm bài bù vào cuối
    const refill = getNextCandidate(remaining, currentSong, sourcePool, repeatMode);
    if (refill) {
      remaining.push(refill);
    }

    set({
      queue: remaining,
      originalQueue: originalQueue.filter((s) => s.id !== songId),
    });
  },
    }),
    {
      name: 'mc-music-player',
      storage: createJSONStorage(() => authAwareStorage),
      partialize: (state) => ({
        currentSong: state.currentSong,
        currentTime: state.currentTime,
        queue: state.queue,
        originalQueue: state.originalQueue,
        sourcePool: state.sourcePool,
        sourceIndex: state.sourceIndex,
        history: state.history,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
        volume: state.volume,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isPlaying = false;
        }
      },
    }
  )
);

// Lắng nghe sự kiện đăng xuất và đăng nhập để đồng bộ trạng thái lưu trữ
if (typeof window !== 'undefined') {
  window.addEventListener('mc-music-logout', () => {
    usePlayerStore.getState().resetPlayer();
  });

  window.addEventListener('mc-music-login', () => {
    const state = usePlayerStore.getState();
    if (state.currentSong) {
      try {
        const snapshot = {
          state: {
            currentSong: state.currentSong,
            currentTime: state.currentTime,
            queue: state.queue,
            originalQueue: state.originalQueue,
            sourcePool: state.sourcePool,
            sourceIndex: state.sourceIndex,
            history: state.history,
            isShuffle: state.isShuffle,
            repeatMode: state.repeatMode,
            volume: state.volume,
          },
          version: 0,
        };
        localStorage.setItem('mc-music-player', JSON.stringify(snapshot));
      } catch (e) {
        console.error(e);
      }
    }
  });
}

