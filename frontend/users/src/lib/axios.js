import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Đảm bảo lấy biến môi trường theo chuẩn của Vite (có tiền tố VITE_)
// Sử dụng proxy của Vite để tránh lỗi CORS
const API_BASE_URL = "/api";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json"
    },
    // Timeout cho request để tránh treo giao diện (10s)
    timeout: 10000,
});

// Interceptor cho Request: Xử lý trước khi gửi API
api.interceptors.request.use(
    (config) => {
        // Lấy token từ Zustand một cách an toàn (tránh lỗi circular dependency nếu import thẳng store vào top level module đang được store đó import lại, 
        // nhưng ở đây axios.js không phụ thuộc vào thứ gì khác nên an toàn).
        const token = useAuthStore.getState().accessToken;

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
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

// Interceptor cho Response: Xử lý kết quả trả về từ Backend
api.interceptors.response.use(
    (response) => {
        // Trả về thẳng response để sử dụng
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // Xử lý các lỗi HTTP chung
        if (error.response) {
            const status = error.response.status;

            // Xử lý khi Token hết hạn (401)
            if (status === 401 && originalRequest && !originalRequest._retry) {
                // Nếu 401 xảy ra ở chính các endpoint auth (login, register, refresh), không thử refresh
                const isAuthEndpoint = originalRequest.url?.includes("/user/auth/");
                if (isAuthEndpoint) {
                    return Promise.reject(error);
                }

                const { refreshToken, logout, setTokens } = useAuthStore.getState();

                if (!refreshToken) {
                    logout();
                    return Promise.reject(error);
                }

                if (isRefreshing) {
                    // Nếu đang trong quá trình refresh token, đưa request vào hàng đợi
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
                    // Gọi API refresh token (sử dụng axios trực tiếp để tránh qua interceptor lặp)
                    const res = await axios.post(`${API_BASE_URL}/user/auth/refresh`, {
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
                        throw new Error("Không nhận được access token mới từ server");
                    }
                } catch (refreshErr) {
                    processQueue(refreshErr, null);
                    logout();
                    return Promise.reject(refreshErr);
                } finally {
                    isRefreshing = false;
                }
            } else if (status === 403) {
                console.warn("Forbidden! You don't have permission.");
            } else if (status >= 500) {
                console.error("Server error. Please try again later.");
            }
        } else if (error.request) {
            console.error("Network error. No response received from server.");
        }

        return Promise.reject(error);
    }
);

export default api;