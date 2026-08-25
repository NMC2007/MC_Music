# Hướng dẫn Kiểm thử và Sử dụng API - Admin Service

Tài liệu này tổng hợp toàn bộ các API thuộc **Admin Service**.
**LƯU Ý QUAN TRỌNG:** Tất cả các endpoint dưới đây đều phải được gọi thông qua **API Gateway (Port 8686)**. Không gọi trực tiếp vào port của Admin Service.

Base URL cho Admin Service thông qua Gateway là: `http://localhost:8686/api/admin`

---

## 1. Authentication (Xác thực)

Nhóm API này dùng để đăng nhập và quản lý phiên làm việc của Quản trị viên (Admin).
_Lưu ý: Không có tính năng Đăng ký (Register) cho Admin. Tài khoản được cấp sẵn trong Database._

**Tài khoản mặc định:**

- **Email:** `admin@mcmusic.com`
- **Password:** `[PASSWORD]`

### 1.1. Đăng nhập (Login)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/admin/auth/login`
- **Mô tả:** Đăng nhập vào hệ thống dành riêng cho Admin.
- **Body (JSON):**
  ```json
  {
    "email": "admin@mcmusic.com",
    "password": "[PASSWORD]"
  }
  ```
- **Response thành công (200 OK):**
  Trả về `accessToken` và `refreshToken` (token sẽ chứa quyền `SUPER_ADMIN`).

### 1.2. Làm mới Token (Refresh Token)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/admin/auth/refresh`
- **Mô tả:** Cấp lại Access Token và Refresh Token mới.
- **Body (JSON):**
  ```json
  {
    "refreshToken": "<CHUỖI_REFRESH_TOKEN_CỦA_ADMIN>"
  }
  ```
- **Response thành công (200 OK):**
  Trả về cặp token hoàn toàn mới. Refresh Token cũ bị vô hiệu.

### 1.3. Đăng xuất (Logout)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/admin/auth/logout`
- **Mô tả:** Đăng xuất admin, vô hiệu hóa (xóa) Refresh Token.
- **Body (JSON):**
  ```json
  {
    "refreshToken": "<CHUỖI_REFRESH_TOKEN_CỦA_ADMIN>"
  }
  ```
- **Response thành công (200 OK):**
  Xóa Refresh Token thành công.

---

## 2. Quản lý Hệ thống (Sắp triển khai)

_(Các API quản lý Users, Artists, duyệt bài hát, thống kê hệ thống... sẽ được cập nhật tại đây khi hoàn thành)._
