import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useAuthStore } from './useAuthStore';
import { showLoginToast } from '../utils/toastUtils';
import { getSongLyrics, getPublicSongs, getSongById } from '../api/catalog/public';

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
const getNextCandidate = (currentQueue, currentSong, sourcePool, repeatMode, isAutoRadio = false) => {
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
    if (repeatMode !== 'all' && !isAutoRadio && lastIndex + offset >= total) {
      break;
    }
    const candidate = sourcePool[targetIdx];
    if (candidate && !existingIds.has(candidate.id)) {
      return candidate;
    }
  }

  // Nếu tất cả bài đều đã nằm trong hàng đợi nhưng repeatMode === 'all' hoặc đang ở chế độ auto-radio
  if ((repeatMode === 'all' || isAutoRadio) && total > 1) {
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
      isAutoRadio: false, // Trạng thái phát nhạc radio tự động theo thể loại (phát liên tục không gián đoạn)

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
          isAutoRadio: false,
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
   * Phát bài hát kèm tự động tạo hàng đợi thông minh dựa trên thể loại nhạc (Smart Genre Queue / Auto Radio)
   * 1. Lập tức phát bài hát ngay để không có độ trễ cho người dùng.
   * 2. Lấy thể loại của bài hát (từ dữ liệu có sẵn hoặc gọi getSongById nếu cần).
   * 3. Lấy danh sách các bài hát công khai cùng thể loại (hoặc bổ sung trending nếu thể loại có ít bài).
   * 4. Trộn ngẫu nhiên danh sách thể loại và nạp 6 bài chờ vào queue.
   * 5. Khi phát hết các bài, tự động lặp xoay vòng từ pool để luồng phát KHÔNG BAO GIỜ bị gián đoạn.
   */
  playWithAutoQueue: async (song) => {
    if (!song) return;
    const songId = song.id || song.songId;
    if (!songId) return;

    // Bước 1: Chuẩn bị thông tin bài hát
    let fullSong = song;
    // Nếu thiếu audioUrl hoặc thiếu genres, fetch chi tiết bài hát
    if (!fullSong.audioUrl || !fullSong.genres) {
      try {
        const res = await getSongById(songId);
        if (res?.data) {
          fullSong = { ...song, ...res.data, id: songId };
        }
      } catch (e) {
        console.error("Lỗi lấy thông tin bài hát:", e);
      }
    }

    fullSong = { ...fullSong, id: songId };

    // Bước 2: Bắt đầu phát ngay lập tức (Zero Latency)
    // Đặt sourcePool tạm thời là [fullSong], isAutoRadio = true
    set({
      currentSong: fullSong,
      isPlaying: true,
      currentTime: 0,
      queue: [],
      originalQueue: [],
      sourcePool: [fullSong],
      sourceIndex: 0,
      isAutoRadio: true,
    });

    // Bước 3: Tìm bài hát cùng thể loại trong background
    try {
      let genreId = null;
      if (fullSong.genres && Array.isArray(fullSong.genres) && fullSong.genres.length > 0) {
        const randomGenre = fullSong.genres[Math.floor(Math.random() * fullSong.genres.length)];
        genreId = randomGenre.id;
      }

      let candidateSongs = [];

      // Fetch bài theo thể loại
      if (genreId) {
        try {
          const res = await getPublicSongs({ genreId, size: 30 });
          candidateSongs = (res?.data?.content || []).filter((s) => s.id !== songId);
        } catch (err) {
          console.warn("Lỗi tải bài hát theo thể loại:", err);
        }
      }

      // Nếu không có bài cùng thể loại hoặc ít hơn 6 bài, bổ sung bài hát thịnh hành
      if (candidateSongs.length < 6) {
        try {
          const trendRes = await getPublicSongs({ size: 30, sort: 'playCount,desc' });
          const trendSongs = (trendRes?.data?.content || []).filter(
            (s) => s.id !== songId && !candidateSongs.some((c) => c.id === s.id)
          );
          candidateSongs = [...candidateSongs, ...trendSongs];
        } catch (err) {
          console.warn("Lỗi tải bài hát thịnh hành bổ sung:", err);
        }
      }

      // Xáo trộn ngẫu nhiên danh sách gợi ý
      const shuffled = shuffleArray(candidateSongs);
      const completePool = [fullSong, ...shuffled];
      const buffer = shuffled.slice(0, BUFFER_SIZE);

      // KIỂM TRA QUAN TRỌNG: Chỉ cập nhật nếu bài hát đang phát hiện tại vẫn là bài này
      // (Tránh trường hợp người dùng đã nhanh tay bấm chọn bài khác trên trang trong lúc đang tải)
      const current = get().currentSong;
      if (current && (current.id === songId || current.songId === songId)) {
        set({
          sourcePool: completePool,
          sourceIndex: 0,
          queue: buffer,
          originalQueue: [...buffer],
          isAutoRadio: true,
        });
      }
    } catch (err) {
      console.error("Lỗi khởi tạo hàng đợi tự động:", err);
    }
  },

  /**
   * Phát 1 bài kèm ngữ cảnh nguồn (Album, Artist, Trending...)
   * Nạp ngay bài đang chọn và chuẩn bị đúng 6 bài chờ kế tiếp
   */
  playSongWithContext: (song, sourceList = [], startIndex) => {
    if (!song) return;
    const pool = sourceList && sourceList.length > 0 ? sourceList : [song];

    // Nếu pool chỉ có 1 bài hát -> tự động chuyển sang playWithAutoQueue để lấy bài cùng thể loại
    if (pool.length <= 1) {
      get().playWithAutoQueue(song);
      return;
    }

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
      isAutoRadio: false,
    });
  },

  /**
   * Tương thích ngược với hàm setCurrentSong cũ
   */
  setCurrentSong: (song) => {
    const { sourcePool } = get();
    if (sourcePool && sourcePool.length > 1 && sourcePool.some((s) => s.id === song.id)) {
      get().playSongWithContext(song, sourcePool);
    } else {
      get().playWithAutoQueue(song);
    }
  },

  /**
   * Phát 1 bài hát trực tiếp từ trong Hàng đợi chờ phát (Queue Drawer)
   * YÊU CẦU ĐẶC BIỆT: Bảo lưu nguyên vẹn thứ tự các bài tiếp theo trong queue, KHÔNG RESET queue!
   * Đưa các bài bị bỏ qua và bài hiện tại vào history.
   * Tự động bù các bài từ sourcePool vào cuối queue để luôn duy trì BUFFER_SIZE (6 bài).
   */
  playQueueSong: (songId) => {
    const { queue, currentSong, history, sourcePool, repeatMode, isShuffle, originalQueue, isAutoRadio } = get();
    const songIndex = queue.findIndex((s) => (s.id === songId || s.songId === songId));
    if (songIndex === -1) return;

    const targetSong = queue[songIndex];

    // Các bài đứng trước targetSong trong queue coi như bị bỏ qua -> đưa cùng currentSong vào history
    const skippedSongs = queue.slice(0, songIndex);
    const remainingQueue = queue.slice(songIndex + 1);

    const updatedHistory = [
      ...(currentSong ? [currentSong] : []),
      ...skippedSongs.reverse(),
      ...history,
    ].slice(0, 30);

    // Nạp bù từ sourcePool vào cuối remainingQueue cho đủ BUFFER_SIZE (6 bài)
    let newQueue = [...remainingQueue];
    while (newQueue.length < BUFFER_SIZE) {
      const refill = getNextCandidate(newQueue, targetSong, sourcePool, repeatMode, isAutoRadio);
      if (!refill) break;
      newQueue.push(refill);
    }

    // Cập nhật originalQueue
    let newOriginalQueue = originalQueue;
    if (!isShuffle) {
      newOriginalQueue = [...newQueue];
    } else {
      newOriginalQueue = [
        ...originalQueue.filter((s) => s.id !== targetSong.id && !skippedSongs.some((sk) => sk.id === s.id)),
        ...newQueue.slice(remainingQueue.length),
      ];
    }

    const newSourceIndex = sourcePool.findIndex((s) => s.id === targetSong.id);

    set({
      currentSong: targetSong,
      isPlaying: true,
      currentTime: 0,
      queue: newQueue,
      originalQueue: newOriginalQueue,
      sourceIndex: newSourceIndex >= 0 ? newSourceIndex : 0,
      history: updatedHistory,
    });
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
   * Thêm 1 bài hát vào Hàng đợi chờ phát (Add to Queue / Play Next)
   * YÊU CẦU:
   * - Bài hát được thêm vào ngay phía sau bài đang phát hiện tại.
   * - Nếu người dùng thêm từ 2 bài trở lên, các bài sẽ sắp xếp theo thứ tự lần lượt được thêm:
   *   (Bài thêm trước phát trước, bài thêm sau phát tiếp theo).
   */
  addToQueue: async (song) => {
    if (!song) return;
    const songId = song.id || song.songId;
    if (!songId) return;

    const { currentSong, queue, isShuffle, originalQueue, sourcePool } = get();

    // Nếu chưa có bài nào đang phát, bắt đầu phát bài này luôn
    if (!currentSong) {
      await get().playWithAutoQueue(song);
      return;
    }

    // Đảm bảo đầy đủ thông tin bài hát (như audioUrl, duration...)
    let fullSong = song;
    if (!fullSong.audioUrl) {
      try {
        const res = await getSongById(songId);
        if (res?.data) {
          fullSong = { ...song, ...res.data, id: songId };
        }
      } catch (err) {
        console.error("Lỗi lấy thông tin bài hát khi thêm vào hàng đợi:", err);
      }
    }

    fullSong = { ...fullSong, id: songId, isUserQueued: true };

    // Lọc bỏ bài này nếu nó đã xuất hiện ở phía sau trong queue (tránh lặp bài)
    const filteredQueue = queue.filter((s) => (s.id || s.songId) !== songId);

    // Tìm vị trí chèn: sau các bài đã được người dùng ưu tiên thêm vào hàng đợi trước đó
    let insertIndex = 0;
    while (insertIndex < filteredQueue.length && filteredQueue[insertIndex].isUserQueued) {
      insertIndex++;
    }

    const newQueue = [
      ...filteredQueue.slice(0, insertIndex),
      fullSong,
      ...filteredQueue.slice(insertIndex),
    ];

    // Bổ sung bài này vào sourcePool nếu chưa có trong pool
    let newSourcePool = sourcePool;
    if (!sourcePool.some((s) => (s.id || s.songId) === songId)) {
      newSourcePool = [...sourcePool, fullSong];
    }

    // Cập nhật originalQueue
    let newOriginalQueue = originalQueue;
    if (!isShuffle) {
      newOriginalQueue = [...newQueue];
    } else {
      newOriginalQueue = [
        ...originalQueue.filter((s) => (s.id || s.songId) !== songId),
        fullSong,
      ];
    }

    set({
      queue: newQueue,
      originalQueue: newOriginalQueue,
      sourcePool: newSourcePool,
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
      isAutoRadio,
    } = get();

    if (!currentSong) return;

    // Nếu hàng đợi không còn bài nào
    if (queue.length === 0) {
      if ((repeatMode === 'all' || isAutoRadio) && sourcePool.length > 0) {
        // Lặp lại từ bài đầu tiên của pool để luồng phát liên tục không bị gián đoạn
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
      repeatMode,
      isAutoRadio
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
    const { queue, currentSong, sourcePool, repeatMode, originalQueue, isAutoRadio } = get();
    const remaining = queue.filter((s) => s.id !== songId);

    // Tìm bài bù vào cuối
    const refill = getNextCandidate(remaining, currentSong, sourcePool, repeatMode, isAutoRadio);
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
        isAutoRadio: state.isAutoRadio,
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
            isAutoRadio: state.isAutoRadio,
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

