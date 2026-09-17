import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

// Đảm bảo lấy biến môi trường theo chuẩn của Vite (có tiền tố VITE_)
// Sử dụng toán tử || để cung cấp giá trị dự phòng (fallback) an toàn là cổng 8686
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8686/api";

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

// Interceptor cho Response: Xử lý kết quả trả về từ Backend
api.interceptors.response.use(
    (response) => {
        // Trả về thẳng response để sử dụng
        return response;
    },
    (error) => {
        // Xử lý các lỗi HTTP chung
        if (error.response) {
            const status = error.response.status;

            if (status === 401) {
                // Lỗi xác thực (Token hết hạn hoặc không hợp lệ)
                console.warn("Unauthorized! Token may be expired.");
                // Tự động đăng xuất user khi token chết
                useAuthStore.getState().logout();
                // TODO: Chuyển hướng người dùng về trang login (cần xử lý ở component hoặc custom hook chứa useNavigate)
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