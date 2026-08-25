# Hướng dẫn Kiểm thử và Sử dụng API - Artists Service

Tài liệu này tổng hợp toàn bộ các API thuộc **Artists Service**. 
**LƯU Ý QUAN TRỌNG:** Tất cả các endpoint dưới đây đều phải được gọi thông qua **API Gateway (Port 8686)** để đảm bảo tính nhất quán và xử lý CORS tự động. Không gọi trực tiếp vào port của Artists Service.

Base URL cho Artists Service thông qua Gateway là: `http://localhost:8686/api/artist`

---

## 1. Authentication (Xác thực)

Nhóm API này dùng để quản lý tài khoản của Nghệ sĩ (Artist) - người sáng tạo và đăng tải âm nhạc.

### 1.1. Đăng ký tài khoản Nghệ sĩ (Register)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/artist/auth/register`
- **Mô tả:** Tạo tài khoản nghệ sĩ mới. Yêu cầu nhập nghệ danh (`stageName`) thay vì tên đầy đủ.
- **Body (JSON):**
  ```json
  {
      "email": "artist1@example.com",
      "password": "password123",
      "stageName": "Sơn Tùng M-TP"
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông tin Artist cùng cặp `accessToken` và `refreshToken` (có chứa claim `ROLE_ARTIST`).

### 1.2. Đăng nhập (Login)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/artist/auth/login`
- **Mô tả:** Đăng nhập vào hệ thống dành riêng cho Nghệ sĩ.
- **Body (JSON):**
  ```json
  {
      "email": "artist1@example.com",
      "password": "password123"
  }
  ```
- **Response thành công (200 OK):**
  Trả về `accessToken` và `refreshToken`.

### 1.3. Làm mới Token (Refresh Token)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/artist/auth/refresh`
- **Mô tả:** Cấp lại Access Token và Refresh Token mới (Refresh Token Rotation).
- **Body (JSON):**
  ```json
  {
      "refreshToken": "<CHUỖI_REFRESH_TOKEN_CỦA_ARTIST>"
  }
  ```
- **Response thành công (200 OK):**
  Trả về cặp token hoàn toàn mới. Refresh Token cũ bị vô hiệu.

### 1.4. Đăng xuất (Logout)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/artist/auth/logout`
- **Mô tả:** Đăng xuất nghệ sĩ, vô hiệu hóa (xóa) Refresh Token.
- **Body (JSON):**
  ```json
  {
      "refreshToken": "<CHUỖI_REFRESH_TOKEN_CỦA_ARTIST>"
  }
  ```
- **Response thành công (200 OK):** 
  Xóa Refresh Token thành công.

---

## 2. CRUD & Quản lý Nhạc (Sắp triển khai)

*(Các API cập nhật tiểu sử, upload bài hát, tạo album, xem thống kê lượt nghe... sẽ được cập nhật tại đây khi hoàn thành).*
