# Hướng dẫn Kiểm thử và Sử dụng API - Users Service

Tài liệu này tổng hợp toàn bộ các API thuộc **Users Service**. 
**LƯU Ý QUAN TRỌNG:** Tất cả các endpoint dưới đây đều phải được gọi thông qua **API Gateway (Port 8686)** để đảm bảo tính nhất quán và xử lý CORS tự động. Không gọi trực tiếp vào port của Users Service.

Base URL cho Users Service thông qua Gateway là: `http://localhost:8686/api/user`

---

## 1. Authentication (Xác thực)

Nhóm API này dùng để quản lý tài khoản người nghe nhạc (đăng ký, đăng nhập, bảo mật).

### 1.1. Đăng ký tài khoản (Register)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/auth/register`
- **Mô tả:** Tạo tài khoản người dùng mới.
- **Body (JSON):**
  ```json
  {
      "email": "user1@example.com",
      "password": "password123",
      "fullName": "Nguyễn Văn A"
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông tin user cùng cặp `accessToken` và `refreshToken` mới.

### 1.2. Đăng nhập (Login)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/auth/login`
- **Mô tả:** Đăng nhập vào hệ thống.
- **Body (JSON):**
  ```json
  {
      "email": "user1@example.com",
      "password": "password123"
  }
  ```
- **Response thành công (200 OK):**
  Trả về `accessToken` và `refreshToken`.

### 1.3. Làm mới Token (Refresh Token)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/auth/refresh`
- **Mô tả:** Cấp lại Access Token và Refresh Token mới khi Access Token cũ hết hạn (Refresh Token Rotation).
- **Body (JSON):**
  ```json
  {
      "refreshToken": "<CHUỖI_REFRESH_TOKEN_HIỆN_TẠI>"
  }
  ```
- **Response thành công (200 OK):**
  Trả về cặp `accessToken` và `refreshToken` hoàn toàn mới. Refresh Token cũ đã bị xóa.

### 1.4. Đăng xuất (Logout)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/auth/logout`
- **Mô tả:** Đăng xuất người dùng, vô hiệu hóa (xóa) Refresh Token khỏi hệ thống.
- **Body (JSON):**
  ```json
  {
      "refreshToken": "<CHUỖI_REFRESH_TOKEN_HIỆN_TẠI>"
  }
  ```
- **Response thành công (200 OK):** 
  Token đã bị vô hiệu hóa, người dùng phải login lại để lấy token mới.

---

## 2. CRUD & Dữ liệu người dùng (Sắp triển khai)

*(Các API lấy thông tin cá nhân, tạo Playlist, thả tim bài hát, lịch sử nghe nhạc... sẽ được cập nhật tại đây khi hoàn thành).*
