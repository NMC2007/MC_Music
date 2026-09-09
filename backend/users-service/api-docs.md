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

## 2. Playlists

Nhóm API này dùng để quản lý danh sách phát cá nhân của người dùng.
**Yêu cầu:** Tất cả API trong nhóm này đều yêu cầu header `Authorization: Bearer <accessToken>`.

### 2.1. Tạo Playlist mới

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/playlists`
- **Mô tả:** Tạo một danh sách phát mới.
- **Body (JSON):**
  ```json
  {
    "name": "Nhạc Buồn",
    "description": "Tuyển tập những bài hát buồn",
    "coverImage": "https://example.com/image.jpg",
    "isPublic": true
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông tin chi tiết của Playlist vừa tạo.

### 2.2. Lấy danh sách Playlist của tôi

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/playlists`
- **Mô tả:** Lấy toàn bộ danh sách phát do người dùng hiện tại tạo.
- **Response thành công (200 OK):**
  Trả về mảng chứa các object Playlist.

### 2.3. Thêm bài hát vào Playlist

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs`
- **Mô tả:** Thêm một bài hát từ hệ thống vào Playlist. API sẽ tự động gọi sang Catalog Service để kiểm tra bài hát và lấy thông tin (denormalized data).
- **Body (JSON):**
  ```json
  {
    "songId": "<UUID_BÀI_HÁT>"
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông tin liên kết giữa bài hát và playlist.

### 2.4. Xóa bài hát khỏi Playlist

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs/{songId}`
- **Mô tả:** Gỡ bỏ một bài hát khỏi playlist.
- **Response thành công (200 OK):**
  Bài hát đã được xóa thành công.

### 2.5. Xem danh sách bài hát trong Playlist

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs`
- **Mô tả:** Lấy danh sách các bài hát bên trong một Playlist, xếp theo thứ tự thêm vào mới nhất.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết bài hát.

---

## 3. Dữ liệu người dùng khác (Sắp triển khai)

_(Các API thả tim bài hát, lịch sử nghe nhạc... sẽ được cập nhật tại đây khi hoàn thành)._
