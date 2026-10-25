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

## 2. Thông tin cá nhân (Profile)

Nhóm API này dùng để lấy và cập nhật thông tin cá nhân của người dùng đang đăng nhập.
**Yêu cầu:** Gửi kèm Header `Authorization: Bearer <accessToken>`.

### 2.1. Lấy thông tin cá nhân (Get Profile)

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/me`
- **Mô tả:** Lấy thông tin profile của người dùng hiện tại (dựa vào token).
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy thông tin profile thành công",
    "data": {
      "id": "uuid",
      "email": "user1@example.com",
      "fullName": "Nguyễn Văn A",
      "avatarUrl": "https://...",
      "createdAt": "2026-08-01T10:00:00"
    }
  }
  ```

### 2.2. Cập nhật thông tin cá nhân (Update Profile)

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/user/me`
- **Content-Type:** `multipart/form-data`
- **Mô tả:** Cập nhật tên hiển thị và ảnh đại diện của người dùng. Ảnh avatar được upload trực tiếp (tự động lưu lên Cloudinary). Nếu không gửi `avatarFile`, avatar hiện tại sẽ được giữ nguyên.
- **Body (Form-Data):**
  | Key | Type | Required | Mô tả |
  |---|---|---|---|
  | `fullName` | Text | ❌ Không bắt buộc | Tên hiển thị mới. Từ 2 đến 50 ký tự. Nếu không truyền sẽ giữ nguyên. |
  | `avatarFile` | File | ❌ Không bắt buộc | File ảnh avatar. Chỉ chấp nhận `.jpg`, `.jpeg`, `.png`. Tối đa 5MB. |
- **Response thành công (200 OK):**
  Trả về thông tin profile sau khi đã cập nhật (bao gồm `avatarUrl` mới nếu có upload ảnh).
- **Lỗi có thể gặp:**
  - `400 Bad Request`: Trống toàn bộ thông tin (không gửi tên, không gửi ảnh).
  - `400 Bad Request`: `fullName` quá ngắn/dài (nếu có truyền).
  - `400 Bad Request`: File ảnh không đúng định dạng (không phải jpg/png).
  - `500 Internal Server Error`: Lỗi upload ảnh từ phía Cloudinary.

---

## 3. Playlists (Danh sách phát)

Nhóm API này dùng để quản lý danh sách phát cá nhân của người dùng.
**Yêu cầu:** Tất cả API trong nhóm này đều yêu cầu header `Authorization: Bearer <accessToken>`.

### 3.1. Tạo Playlist mới

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/playlists`
- **Mô tả:** Tạo một danh sách phát mới cho người dùng. Hỗ trợ upload ảnh bìa trực tiếp dạng file lên Cloudinary qua `multipart/form-data`, hoặc tạo bằng `application/json`.
- **Headers:**
  - `Authorization: Bearer <accessToken>`
- **Cách 1 - Form Data (`multipart/form-data`):**
  - `name`: String (Bắt buộc, tên playlist, không được để trống)
  - `description`: String (Tùy chọn, mô tả playlist)
  - `coverImage` (hoặc `coverFile`): File (Tùy chọn, file ảnh `.jpg`, `.jpeg`, `.png`, tối đa 5MB)
  - `isPublic`: Boolean (Tùy chọn, mặc định: `false` - riêng tư)
- **Cách 2 - JSON (`application/json`):**
  ```json
  {
    "name": "Nhạc Chill Đêm",
    "description": "Tuyển tập những bài hát thư giãn đêm muộn",
    "isPublic": false
  }
  ```
- **Response thành công (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Tạo playlist thành công",
    "data": {
      "id": "c1f2e3d4-5678-90ab-cdef-1234567890ab",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Nhạc Chill Đêm",
      "description": "Tuyển tập những bài hát thư giãn đêm muộn",
      "coverImage": "https://res.cloudinary.com/.../mcmusic/playlists/xyz.jpg",
      "isPublic": false,
      "createdAt": "2026-10-24T17:10:00"
    },
    "timestamp": "2026-10-24T17:10:00"
  }
  ```

### 3.2. Lấy danh sách Playlist của tôi

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/playlists`
- **Mô tả:** Lấy toàn bộ danh sách phát do người dùng hiện tại tạo (có phân trang, sắp xếp theo thời gian tạo mới nhất).
- **Query Parameters:**
  - `page` (Int, Tùy chọn, mặc định: 0): Số trang.
  - `size` (Int, Tùy chọn, mặc định: 10): Số lượng bản ghi mỗi trang.
- **Response thành công (200 OK):**
  Trả về `data.content` chứa mảng các object Playlist.

### 3.3. Lấy chi tiết một Playlist

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}`
- **Mô tả:** Lấy thông tin chi tiết của một playlist theo ID. Nếu playlist ở chế độ riêng tư (`isPublic = false`), chỉ chủ sở hữu mới có quyền truy cập.
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy thông tin playlist thành công",
    "data": {
      "id": "c1f2e3d4-5678-90ab-cdef-1234567890ab",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Nhạc Chill Đêm",
      "description": "Mô tả playlist",
      "coverImage": "https://...",
      "isPublic": false,
      "createdAt": "2026-10-24T17:10:00"
    }
  }
  ```
- **Lỗi có thể gặp:**
  - `403 Forbidden`: Người dùng không phải chủ sở hữu của playlist riêng tư này.
  - `404 Not Found`: Không tìm thấy playlist với ID chỉ định.

### 3.4. Chỉnh sửa Playlist (Update Playlist) ⭐ _Mới_

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}`
- **Content-Type:** `multipart/form-data`
- **Mô tả:** Cập nhật thông tin danh sách phát (tên, ảnh bìa, mô tả, trạng thái công khai).
  - Thống nhất một định dạng duy nhất là **`multipart/form-data`** qua phương thức **`PUT`**.
  - **Hỗ trợ cập nhật một phần (Partial Update):** Tất cả các trường đều là tùy chọn. Người dùng gửi lên trường nào thì hệ thống chỉ cập nhật trường đó, các trường còn lại sẽ giữ nguyên giá trị hiện tại. Nếu gửi Form-data rỗng, hệ thống sẽ giữ nguyên toàn bộ và trả về dữ liệu playlist hiện tại.
  - **Bảo mật:** Chỉ người tạo playlist mới có quyền chỉnh sửa.
- **Headers:**
  - `Authorization: Bearer <accessToken>`
  - `Content-Type: multipart/form-data`
- **Body (Form-Data):**
  | Key | Type | Required | Mô tả |
  |---|---|---|---|
  | `name` | Text | ❌ Không bắt buộc | Tên playlist mới. Nếu không truyền sẽ giữ nguyên. Nếu truyền thì không được để trống hoặc chỉ chứa khoảng trắng. |
  | `description` | Text | ❌ Không bắt buộc | Mô tả playlist mới. Nếu không truyền sẽ giữ nguyên. |
  | `coverImage` (hoặc `coverFile`) | File | ❌ Không bắt buộc | File ảnh bìa mới (chấp nhận `.jpg`, `.jpeg`, `.png`, tối đa 5MB). Khi gửi file mới, hệ thống tự động upload lên Cloudinary và cập nhật URL mới. Nếu không truyền sẽ giữ nguyên ảnh cũ. |
  | `isPublic` | Boolean | ❌ Không bắt buộc | Trạng thái công khai (`true`/`false`). Nếu không truyền sẽ giữ nguyên. |

- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cập nhật playlist thành công",
    "data": {
      "id": "c1f2e3d4-5678-90ab-cdef-1234567890ab",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "name": "Tên Playlist Mới",
      "description": "Mô tả mới cho playlist",
      "coverImage": "https://res.cloudinary.com/.../new_cover.jpg",
      "isPublic": true,
      "createdAt": "2026-10-24T17:10:00"
    },
    "timestamp": "2026-10-25T12:00:00"
  }
  ```
- **Lỗi có thể gặp:**
  - `400 Bad Request`: Không gửi bất kỳ thông tin nào cần cập nhật (`"Vui lòng cung cấp ít nhất một thông tin cần cập nhật (tên, mô tả, ảnh bìa hoặc trạng thái công khai)"`).
  - `400 Bad Request`: Tên playlist truyền lên rỗng hoặc toàn khoảng trắng (`"Tên playlist không được để trống"`).
  - `400 Bad Request`: File ảnh sai định dạng (không phải jpg, jpeg, png) hoặc vượt quá 5MB.
  - `415 Unsupported Media Type` / `400 Bad Request`: Thiếu Content-Type hoặc gửi sai định dạng (ví dụ gửi JSON thay vì `multipart/form-data`). Hệ thống trả về thông báo lỗi chuẩn thay vì lỗi 500.
  - `403 Forbidden`: Người dùng không phải chủ sở hữu của playlist này (`"Bạn không có quyền chỉnh sửa playlist này"`).
  - `404 Not Found`: Không tìm thấy playlist theo `playlistId`.

### 3.5. Xóa Playlist (Delete Playlist) ⭐ _Mới_

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}`
- **Mô tả:** Xóa vĩnh viễn một danh sách phát. Hệ thống sẽ tự động dọn dẹp các bài hát liên kết bên trong bảng `playlist_songs` trước khi xóa playlist. **Bảo mật:** Chỉ người tạo playlist mới có quyền xóa.
- **Headers:**
  - `Authorization: Bearer <accessToken>`
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Xóa playlist thành công",
    "data": null,
    "timestamp": "2026-10-25T12:00:00"
  }
  ```
- **Lỗi có thể gặp:**
  - `403 Forbidden`: Người dùng không phải chủ sở hữu của playlist này (`"Bạn không có quyền xóa playlist này"`).
  - `404 Not Found`: Không tìm thấy playlist theo `playlistId`.

### 3.6. Thêm bài hát vào Playlist

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs`
- **Mô tả:** Thêm một bài hát từ hệ thống vào Playlist. API sẽ tự động gọi sang Catalog Service để kiểm tra bài hát và lấy thông tin (denormalized data). Chỉ chủ playlist mới có quyền thêm.
- **Body (JSON):**
  ```json
  {
    "songId": "<UUID_BÀI_HÁT>"
  }
  ```
- **Response thành công (201 Created):**
  Trả về thông tin liên kết giữa bài hát và playlist.

### 3.7. Xóa bài hát khỏi Playlist

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs/{songId}`
- **Mô tả:** Gỡ bỏ một bài hát khỏi playlist. Chỉ chủ playlist mới có quyền xóa bài hát.
- **Response thành công (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Xóa bài hát khỏi playlist thành công",
    "data": null
  }
  ```

### 3.8. Xem danh sách bài hát trong Playlist

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/playlists/{playlistId}/songs`
- **Mô tả:** Lấy danh sách các bài hát bên trong một Playlist, xếp theo thứ tự thêm vào mới nhất.
- **Query Parameters:**
  - `page` (Int, Tùy chọn, mặc định: 0)
  - `size` (Int, Tùy chọn, mặc định: 10)
- **Response thành công (200 OK):**
  Trả về danh sách bài hát có phân trang.

---

## 4. Lịch sử và Yêu thích (Favorites & History)

Nhóm API này dùng để quản lý lượt thả tim và lịch sử nghe nhạc của người dùng.
**Yêu cầu:** Tất cả API trong nhóm này đều yêu cầu header `Authorization: Bearer <accessToken>`.

### 4.1. Yêu thích bài hát

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/favorites/{songId}`
- **Mô tả:** Đánh dấu một bài hát là yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để tăng `likeCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 4.2. Bỏ yêu thích bài hát

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/favorites/{songId}`
- **Mô tả:** Gỡ bỏ một bài hát khỏi danh sách yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để giảm `likeCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 4.3. Lấy danh sách bài hát yêu thích

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/favorites`
- **Mô tả:** Lấy danh sách toàn bộ bài hát yêu thích của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết bài hát yêu thích, sắp xếp mới nhất lên đầu.

### 4.4. Yêu thích Album

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums/{albumId}`
- **Mô tả:** Đánh dấu một album là yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để tăng `likeCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 4.5. Bỏ yêu thích Album

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums/{albumId}`
- **Mô tả:** Gỡ bỏ một album khỏi danh sách yêu thích. Hệ thống sẽ tự động gọi sang Catalog Service để giảm `likeCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 4.6. Lấy danh sách Album yêu thích

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/favorites/albums`
- **Mô tả:** Lấy danh sách toàn bộ album yêu thích của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết album yêu thích, sắp xếp mới nhất lên đầu.

### 4.7. Theo dõi Nghệ sĩ

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists/{artistId}`
- **Mô tả:** Theo dõi một nghệ sĩ. Hệ thống sẽ tự động gọi sang Artists Service để tăng `followerCount`.
- **Response thành công (201 Created):**
  Trả về thông báo thành công.

### 4.8. Hủy theo dõi Nghệ sĩ

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists/{artistId}`
- **Mô tả:** Hủy theo dõi một nghệ sĩ. Hệ thống sẽ tự động gọi sang Artists Service để giảm `followerCount`.
- **Response thành công (200 OK):**
  Trả về thông báo thành công.

### 4.9. Lấy danh sách Nghệ sĩ đang theo dõi

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/follows/artists`
- **Mô tả:** Lấy danh sách toàn bộ nghệ sĩ mà người dùng hiện tại đang theo dõi.
- **Response thành công (200 OK):**
  Trả về mảng chi tiết nghệ sĩ, sắp xếp mới nhất lên đầu.

### 4.10. Ghi nhận lịch sử nghe nhạc

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

### 4.11. Lấy lịch sử nghe nhạc

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/user/history`
- **Mô tả:** Lấy lịch sử nghe nhạc gần đây của người dùng hiện tại.
- **Response thành công (200 OK):**
  Trả về mảng lịch sử nghe nhạc, sắp xếp mới nhất lên đầu.
