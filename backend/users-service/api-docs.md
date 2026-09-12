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

## 3. Lịch sử và Yêu thích (Favorites & History)

Nhóm API này dùng để quản lý lượt thả tim và lịch sử nghe nhạc của người dùng.
**Yêu cầu:** Tất cả API trong nhóm này đều yêu cầu header `Authorization: Bearer <accessToken>`.

### 3.1. Yêu thích bài hát

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/favorites/{songId}`
- **Mô tả:** Đánh dấu một bài hát là yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để tăng `likeCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 3.2. Bỏ yêu thích bài hát

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/favorites/{songId}`
- **Mô tả:** Gỡ bỏ một bài hát khỏi danh sách yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để giảm `likeCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 3.3. Lấy danh sách bài hát yêu thích

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/favorites`
- **Mô tả:** Lấy danh sách toàn bộ bài hát yêu thích của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết bài hát yêu thích, sắp xếp mới nhất lên đầu.

### 3.4. Yêu thích Album

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums/{albumId}`
- **Mô tả:** Đánh dấu một album là yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để tăng `likeCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 3.5. Bỏ yêu thích Album

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums/{albumId}`
- **Mô tả:** Gỡ bỏ một album khỏi danh sách yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để giảm `likeCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 3.6. Lấy danh sách Album yêu thích

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums`
- **Mô tả:** Lấy danh sách toàn bộ album yêu thích của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết album yêu thích, sắp xếp mới nhất lên đầu.

### 3.7. Theo dõi Nghệ sĩ

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists/{artistId}`
- **Mô tả:** Theo dõi một nghệ sĩ. Hệ thống sẽ tự động gọi sang Artists Service để tăng `followerCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 3.8. Hủy theo dõi Nghệ sĩ

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists/{artistId}`
- **Mô tả:** Hủy theo dõi một nghệ sĩ. Hệ thống sẽ tự động gọi sang Artists Service để giảm `followerCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 3.9. Lấy danh sách Nghệ sĩ đang theo dõi

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists`
- **Mô tả:** Lấy danh sách toàn bộ nghệ sĩ mà người dùng hiện tại đang theo dõi.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết album yêu thích, sắp xếp mới nhất lên đầu.

### 3.10. Ghi nhận lịch sử nghe nhạc

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/history`
- **Mô tả:** Ghi nhận 1 lần nghe bài hát của người dùng. Hệ thống sẽ tự động gọi sang Catalog Service để tăng `playCount`.
- **Body (JSON):**
  ```json
  {
    "songId": "<UUID_BÀI_HÁT>",
    "durationListened": 120
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông báo ghi nhận thành công.

### 3.11. Lấy lịch sử nghe nhạc

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/history`
- **Mô tả:** Lấy lịch sử nghe nhạc gần đây của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng lịch sử nghe nhạc, sắp xếp mới nhất lên đầu.
