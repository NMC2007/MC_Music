import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 phút không tự động refetch lại dữ liệu tĩnh
      gcTime: 1000 * 60 * 10, // 10 phút giữ bộ nhớ đệm
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

