import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Sử dụng proxy của Vite ("/api" -> "http://localhost:8686/api") để định tuyến qua API Gateway
const API_BASE_URL = "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // Timeout 15 giây (tăng thêm thời gian cho upload file media)
  timeout: 15000,
});

// Interceptor cho Request: Tự động đính kèm JWT Bearer Token của Artist
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Tự động gỡ bỏ header Content-Type mặc định nếu request gửi FormData
    // để Axios và trình duyệt tự động thiết lập "multipart/form-data; boundary=..." chính xác
    if (config.data instanceof FormData && config.headers) {
      if (typeof config.headers.delete === "function") {
        config.headers.delete("Content-Type");
        config.headers.delete("content-type");
      } else {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor cho Response: Xử lý refresh token âm thầm khi gặp mã lỗi 401
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const status = error.response.status;

      // Xử lý khi Token hết hạn (401)
      if (status === 401 && originalRequest && !originalRequest._retry) {
        // Nếu 401 xảy ra tại các endpoint auth của artist (login, register, refresh), không thử lại
        const isAuthEndpoint = originalRequest.url?.includes("/artist/auth/");
        if (isAuthEndpoint) {
          return Promise.reject(error);
        }

        const { refreshToken, logout, setTokens } = useAuthStore.getState();

        if (!refreshToken) {
          logout();
          return Promise.reject(error);
        }

        if (isRefreshing) {
          // Nếu đang trong tiến trình làm mới token, đưa request vào hàng đợi chờ
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((newToken) => {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Gọi API refresh token trực tiếp bằng instance axios độc lập để tránh lặp vô tận
          const res = await axios.post(`${API_BASE_URL}/artist/auth/refresh`, {
            refreshToken,
          });

          const data = res.data?.data;
          const newAccessToken = data?.accessToken;
          const newRefreshToken = data?.refreshToken;

          if (newAccessToken) {
            setTokens(newAccessToken, newRefreshToken);
            processQueue(null, newAccessToken);
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            return api(originalRequest);
          } else {
            throw new Error("Không nhận được token mới từ máy chủ");
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          logout();
          return Promise.reject(refreshErr);
        } finally {
          isRefreshing = false;
        }
      } else if (status === 403) {
        console.warn("Truy cập bị từ chối: Tài khoản không có quyền thực hiện thao tác này.");
      } else if (status >= 500) {
        console.error("Lỗi máy chủ nội bộ. Vui lòng thử lại sau.");
      }
    } else if (error.request) {
      console.error("Lỗi mạng: Không nhận được phản hồi từ Gateway/Server.");
    }

    return Promise.reject(error);
  }
);

export default api;
