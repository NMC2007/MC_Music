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

## 2. Public API (Dành cho mọi người dùng)

### 2.1. Lấy danh sách toàn bộ nghệ sĩ
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/artist/public/artists`
- **Mô tả:** Lấy danh sách toàn bộ các nghệ sĩ đang hoạt động (is_active = true) để hiển thị trên giao diện người dùng. Không yêu cầu đăng nhập.
- **Query Parameters:**
  - `page` (Int, Optional): Số trang (Mặc định: 0).
  - `size` (Int, Optional): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Optional): Sắp xếp kết quả. Định dạng: `field,direction`. Mặc định: `createdAt,desc`.
    - **Các giá trị field hợp lệ:** `followerCount`, `createdAt`, `stageName`
    - **Các giá trị direction hợp lệ:** `asc`, `desc`
    - **Ví dụ:** `sort=followerCount,desc` (nghệ sĩ nhiều follower nhất lên đầu)
- **Response thành công (200 OK):**
  ```json
  {
      "success": true,
      "statusCode": 200,
      "message": "Lấy danh sách nghệ sĩ thành công",
      "data": {
          "content": [
              {
                  "id": "uuid",
                  "stageName": "Sơn Tùng M-TP",
                  "avatarUrl": "http...",
                  "coverUrl": "http...",
                  "biography": "Tiểu sử nghệ sĩ...",
                  "followerCount": 150000,
                  "createdAt": "2026-01-15T08:00:00"
              }
          ],
          "pageable": { "...": "..." },
          "totalElements": 20,
          "totalPages": 2
      },
      "timestamp": "2026-09-20T11:00:00Z"
  }
  ```

### 2.2. Lấy thông tin chi tiết một nghệ sĩ
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/artist/public/artists/{id}`
- **Mô tả:** Lấy thông tin chi tiết (profile) của một nghệ sĩ cụ thể theo ID. Chỉ trả về thông tin nếu nghệ sĩ đang hoạt động (is_active = true). Không yêu cầu đăng nhập.
- **Path Parameters:**
  - `id` (UUID, Required): ID của nghệ sĩ.
- **Response thành công (200 OK):**
  ```json
  {
      "success": true,
      "statusCode": 200,
      "message": "Lấy thông tin nghệ sĩ thành công",
      "data": {
          "id": "uuid",
          "stageName": "Sơn Tùng M-TP",
          "avatarUrl": "http...",
          "coverUrl": "http...",
          "biography": "Tiểu sử nghệ sĩ...",
          "followerCount": 150000,
          "createdAt": "2026-01-15T08:00:00"
      },
      "timestamp": "2026-09-20T11:00:00Z"
  }
  ```
- **Response lỗi (404 Not Found):**
  ```json
  {
      "success": false,
      "statusCode": 404,
      "message": "Không tìm thấy nghệ sĩ hoặc nghệ sĩ đã bị khóa",
      "data": null,
      "timestamp": "2026-09-20T11:00:00Z"
  }
  ```

---

## 3. CRUD & Quản lý Nhạc (Sắp triển khai)


_(Các API cập nhật tiểu sử, upload bài hát, tạo album, xem thống kê lượt nghe... sẽ được cập nhật tại đây khi hoàn thành)._
