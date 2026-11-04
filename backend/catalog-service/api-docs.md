# Hướng dẫn Kiểm thử và Sử dụng API - Catalog Service

Tài liệu này tổng hợp toàn bộ các API thuộc **Catalog Service**.
**LƯU Ý QUAN TRỌNG:** Tất cả các endpoint dưới đây đều phải được gọi thông qua **API Gateway (Port 8686)** để đảm bảo tính nhất quán, phân quyền và xử lý CORS tự động. Không gọi trực tiếp vào port của Catalog Service.

Base URL cho Catalog Service thông qua Gateway là: `http://localhost:8686/api/catalog`

> Mọi phản hồi (Response) thành công hay thất bại đều tuân theo chuẩn định dạng JSON:
>
> ```json
> {
>   "success": true/false,
>   "statusCode": 200/400/...,
>   "message": "...",
>   "data": { ... },
>   "timestamp": "..."
> }
> ```

---

## Bảng Tra Cứu Nhanh Tất Cả API (Catalog Service)

### 1. Dành cho Nghệ sĩ (Artist) - Yêu cầu Token `Role: ARTIST`
| STT | HTTP Method | Endpoint qua Gateway | Tên API & Mục đích |
| :---: | :--- | :--- | :--- |
| **A** | **QUẢN LÝ BÀI HÁT (SONGS)** | | |
| 1.1 | `POST` | `/api/catalog/artist/songs` | Đăng tải bài hát mới (`multipart/form-data`, status `PENDING`) |
| 1.2 | `GET` | `/api/catalog/artist/songs` hoặc `/song` | Lấy danh sách bài hát của tôi (hỗ trợ lọc `status`, `isDeleted`) |
| 1.3 | `PUT` | `/api/catalog/artist/songs/{id}` | Chỉnh sửa bài hát (tên, cover, genre, đổi/gỡ album; status -> `PENDING`) |
| 1.4 | `DELETE` | `/api/catalog/artist/songs/{id}` | Xóa mềm bài hát (`is_deleted=true`, không xóa Cloudinary, giảm track album) |
| 1.5 | `PUT` | `/api/catalog/artist/songs/{id}/restore` | Khôi phục bài hát từ thùng rác (`is_deleted=false`, giữ nguyên status) |
| 1.6 | `POST` | `/api/catalog/artist/songs/{songId}/lyrics` | Cập nhật / tạo mới lời bài hát |
| 1.7 | `POST` | `/api/catalog/artist/songs/{songId}/artists` | Thêm nghệ sĩ hợp tác (Featured / Producer) |
| 1.8 | `DELETE` | `/api/catalog/artist/songs/{songId}/artists/{artistId}` | Xóa nghệ sĩ phụ / feat khỏi bài hát |
| **B** | **QUẢN LÝ ALBUM (ALBUMS)** | | |
| 1.9 | `POST` | `/api/catalog/artist/albums` | Tạo album mới (`multipart/form-data`, status `PENDING`) |
| 1.10 | `GET` | `/api/catalog/artist/albums` | Lấy danh sách album của tôi (hỗ trợ `isDeleted=false/true`) |
| 1.11 | `PUT` | `/api/catalog/artist/albums/{id}` | Chỉnh sửa thông tin album (tên, cover, loại, ngày phát hành; status -> `PENDING`) |
| 1.12 | `DELETE` | `/api/catalog/artist/albums/{id}` | Xóa mềm album (cascade xóa mềm toàn bộ bài hát trong album) |
| 1.13 | `PUT` | `/api/catalog/artist/albums/{id}/restore` | Khôi phục album (cascade khôi phục toàn bộ bài hát trong album) |
| 1.14 | `POST` | `/api/catalog/artist/albums/{albumId}/songs` | Thêm bài hát đã tải lên vào album |
| 1.15 | `DELETE` | `/api/catalog/artist/albums/{albumId}/songs/{songId}` | Gỡ bài hát khỏi album (chuyển thành bài lẻ Single) |
| 1.16 | `PUT` | `/api/catalog/artist/albums/{albumId}/songs/reorder` | Cập nhật lại số thứ tự (trackNumber) các bài trong album |

### 2. Dành cho Quản trị viên (Admin) - Yêu cầu Token `Role: ADMIN`
| STT | HTTP Method | Endpoint qua Gateway | Tên API & Mục đích |
| :---: | :--- | :--- | :--- |
| 2.1 | `GET` | `/api/catalog/admin/songs/pending` | Lấy danh sách bài hát chờ duyệt (loại trừ bài đã xóa mềm) |
| 2.2 | `PATCH` | `/api/catalog/admin/songs/{songId}/status` | Duyệt / Từ chối bài hát (`APPROVED`, `REJECTED`, `TAKEDOWN`) |
| 2.3 | `GET` | `/api/catalog/admin/albums/pending` | Lấy danh sách album chờ duyệt (loại trừ album đã xóa mềm) |
| 2.4 | `PATCH` | `/api/catalog/admin/albums/{albumId}/status` | Duyệt / Từ chối album (cascade cập nhật status toàn bộ bài hát) |

### 3. Công khai (Public) - Không yêu cầu Token
| STT | HTTP Method | Endpoint qua Gateway | Tên API & Mục đích |
| :---: | :--- | :--- | :--- |
| 3.1 | `GET` | `/api/catalog/public/songs` | Lấy danh sách bài hát công khai (đã duyệt & chưa bị xóa mềm) |
| 3.2 | `GET` | `/api/catalog/public/genres` | Lấy danh sách tất cả thể loại âm nhạc |
| 3.3 | `GET` | `/api/catalog/public/albums` | Lấy danh sách album công khai (đã duyệt & chưa bị xóa mềm) |
| 3.4 | `GET` | `/api/catalog/public/artists/{artistId}/songs` | Lấy danh sách bài hát công khai của 1 nghệ sĩ |
| 3.5 | `GET` | `/api/catalog/public/artists/{artistId}/albums` | Lấy danh sách album công khai của 1 nghệ sĩ |
| 3.6 | `GET` | `/api/catalog/public/albums/{albumId}/songs` | Lấy danh sách bài hát trong album |
| 3.7 | `GET` | `/api/catalog/public/songs/{id}` | Lấy chi tiết bài hát để phát nhạc |
| 3.8 | `GET` | `/api/catalog/public/albums/{id}` | Lấy chi tiết thông tin album |
| 3.9 | `GET` | `/api/catalog/public/songs/{id}/lyrics` | Lấy lời bài hát |
| 3.10 | `GET` | `/api/catalog/public/search` | Tìm kiếm thống nhất (Unified Search: Songs, Albums, Artists) |

---

## 1. Dành cho Nghệ sĩ (Artist)

**Yêu cầu:** Gửi kèm Header `Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>`.

---

### A. QUẢN LÝ BÀI HÁT (SONGS)

### 1.1. Đăng tải Bài hát (Upload Song)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs`
- **Mô tả:** Đăng tải một bài hát mới lên hệ thống. Trạng thái mặc định ban đầu là `PENDING`. Nếu bài hát thuộc một album mà không điền `trackNumber`, hệ thống sẽ tự động gán `trackNumber` theo thứ tự tiếp theo của album.
- **Content-Type:** `multipart/form-data`
- **Body (Form Data):**
  - `title` (Text, Bắt buộc): Tên bài hát.
  - `audioFile` (File, Bắt buộc): File nhạc định dạng mp3/wav/flac.
  - `coverImage` (File, Tùy chọn): File ảnh bìa bài hát.
  - `albumId` (UUID, Tùy chọn): UUID của Album nếu bài hát thuộc Album.
  - `trackNumber` (Int, Tùy chọn): Số thứ tự bài hát trong Album. Để trống sẽ tự sinh số kế tiếp.
  - `genreIds` (List<UUID>, Bắt buộc): Danh sách ID Thể loại (truyền nhiều key `genreIds` hoặc chuỗi phân tách bởi dấu phẩy).
  - `explicit` (Boolean, Tùy chọn): Cờ đánh dấu nội dung nhạy cảm 18+, mặc định `false`.
- **Ví dụ Request cURL:**
  ```bash
  curl -X POST "http://localhost:8686/api/catalog/artist/songs" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Bài Hát Mới" \
    -F "audioFile=@C:/music/song.mp3" \
    -F "coverImage=@C:/music/cover.jpg" \
    -F "genreIds=8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c" \
    -F "explicit=false"
  ```
- **Response JSON mẫu (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Upload nhạc thành công",
    "data": {
      "id": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Bài Hát Mới",
      "durationSeconds": 210,
      "audioUrl": "https://res.cloudinary.com/demo/video/upload/song.mp3",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/cover.jpg",
      "explicit": false,
      "playCount": 0,
      "likeCount": 0,
      "status": "PENDING",
      "isDeleted": false,
      "createdAt": "2026-11-04T15:00:00",
      "artists": [
        {
          "artistId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "artistName": "Sơn Tùng M-TP",
          "role": "MAIN"
        }
      ],
      "genres": [
        {
          "id": "8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          "name": "Pop"
        }
      ]
    },
    "timestamp": "2026-11-04T15:00:00"
  }
  ```

---

### 1.2. Lấy danh sách Bài hát của tôi (My Songs)

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs` *(hoặc `http://localhost:8686/api/catalog/artist/song`)*
- **Mô tả:** Lấy danh sách toàn bộ bài hát mà nghệ sĩ đăng nhập đã đăng tải. Hỗ trợ phân trang, lọc theo trạng thái kiểm duyệt (`status`) và lọc theo bài hát đang hoạt động hoặc trong thùng rác (`isDeleted`).
- **Query Parameters:**
  - `status` (String, Tùy chọn): Lọc bài hát theo trạng thái kiểm duyệt (không phân biệt hoa/thường):
    - `PENDING`: Bài hát đang chờ Admin duyệt (bao gồm bài mới tải lên hoặc vừa chỉnh sửa).
    - `APPROVED`: Bài hát đã được duyệt thành công và đang phát hành công khai.
    - `REJECTED`: Bài hát đã bị Admin từ chối duyệt.
    - `TAKEDOWN`: Bài hát bị Admin gỡ bỏ / tạm khóa do vi phạm.
  - `isDeleted` (Boolean, Tùy chọn):
    - `false` (hoặc để trống): Lấy các bài hát đang hoạt động.
    - `true`: Lấy danh sách các bài hát trong thùng rác đã bị xóa mềm.
  - `page` (Int, Tùy chọn): Số trang (Bắt đầu từ 0, mặc định: 0).
  - `size` (Int, Tùy chọn): Số bản ghi mỗi trang (Mặc định: 10).
- **Ví dụ Request cURL:**
  ```bash
  # 1. Lấy toàn bộ bài hát đang hoạt động:
  curl -X GET "http://localhost:8686/api/catalog/artist/songs?page=0&size=10" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"

  # 2. Lọc danh sách bài hát đang chờ Admin duyệt:
  curl -X GET "http://localhost:8686/api/catalog/artist/songs?status=PENDING" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"

  # 3. Lọc danh sách bài hát đã duyệt công khai:
  curl -X GET "http://localhost:8686/api/catalog/artist/songs?status=APPROVED" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"

  # 4. Lọc bài hát trong thùng rác:
  curl -X GET "http://localhost:8686/api/catalog/artist/songs?isDeleted=true" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"

  # 5. Kết hợp lọc theo trạng thái và trong thùng rác:
  curl -X GET "http://localhost:8686/api/catalog/artist/songs?status=APPROVED&isDeleted=true" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy danh sách bài hát thành công",
    "data": {
      "content": [
        {
          "id": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101",
          "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "ownerName": "Sơn Tùng M-TP",
          "title": "Cơn Mưa Ngang Qua",
          "durationSeconds": 234,
          "audioUrl": "https://res.cloudinary.com/demo/video/upload/song1.mp3",
          "coverImage": "https://res.cloudinary.com/demo/image/upload/cover1.jpg",
          "explicit": false,
          "playCount": 1250,
          "likeCount": 350,
          "status": "APPROVED",
          "isDeleted": false,
          "createdAt": "2026-08-01T10:00:00",
          "artists": [
            {
              "artistId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
              "artistName": "Sơn Tùng M-TP",
              "role": "MAIN"
            }
          ],
          "genres": [
            {
              "id": "8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
              "name": "Pop"
            }
          ]
        }
      ],
      "pageable": {
        "pageNumber": 0,
        "pageSize": 10
      },
      "totalElements": 1,
      "totalPages": 1,
      "last": true
    },
    "timestamp": "2026-11-04T15:30:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Tham số `status` không hợp lệ (không thuộc một trong: `PENDING`, `APPROVED`, `REJECTED`, `TAKEDOWN`). |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token của nghệ sĩ. |
  | `403 FORBIDDEN` | Tài khoản không có vai trò `ARTIST`. |

---

### 1.3. Chỉnh sửa Bài hát (Update Song)

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{id}`
- **Mô tả:** Chỉnh sửa thông tin bài hát.
  - **Quy tắc nghiệp vụ:** Khi chỉnh sửa bài hát, trạng thái của bài sẽ **tự động chuyển về `PENDING`** để Admin duyệt lại.
  - Hỗ trợ đổi ảnh bìa (upload file mới lên Cloudinary), cập nhật thể loại, cờ nhạy cảm `explicit`.
  - Hỗ trợ chuyển bài sang Album khác thuộc cùng nghệ sĩ (tự động cập nhật `total_tracks` của cả 2 album) hoặc gỡ bài hát khỏi album thành bài lẻ Single (`clearAlbum = true`).
- **Content-Type:** `multipart/form-data`
- **Path Parameter:**
  - `id` (UUID): ID của bài hát cần sửa.
- **Body (Form Data):**
  - `title` (Text, Bắt buộc): Tên bài hát mới.
  - `coverImage` (File, Tùy chọn): File ảnh bìa mới.
  - `genreIds` (List<UUID>, Tùy chọn): Danh sách ID Thể loại mới.
  - `albumId` (UUID, Tùy chọn): ID Album mới nếu muốn chuyển bài sang album khác.
  - `clearAlbum` (Boolean, Tùy chọn): Truyền `true` nếu muốn gỡ bài hát khỏi album hiện tại để thành Single độc lập.
  - `trackNumber` (Int, Tùy chọn): Số thứ tự trong album mới.
  - `explicit` (Boolean, Tùy chọn): Cờ nội dung nhạy cảm.
- **Ví dụ Request cURL:**
  ```bash
  # 1. Cập nhật tên, thể loại và ảnh bìa:
  curl -X PUT "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Cơn Mưa Ngang Qua (Remix 2026)" \
    -F "genreIds=8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c" \
    -F "coverImage=@C:/images/new_cover.jpg" \
    -F "explicit=false"

  # 2. Tách bài hát thành Single độc lập (gỡ khỏi album):
  curl -X PUT "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Cơn Mưa Ngang Qua (Single Edition)" \
    -F "clearAlbum=true"

  # 3. Chuyển bài hát sang Album khác:
  curl -X PUT "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Cơn Mưa Ngang Qua" \
    -F "albumId=c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cập nhật bài hát thành công, trạng thái chuyển về chờ duyệt",
    "data": {
      "id": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Cơn Mưa Ngang Qua (Remix 2026)",
      "durationSeconds": 234,
      "audioUrl": "https://res.cloudinary.com/demo/video/upload/song1.mp3",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/new_cover.jpg",
      "explicit": false,
      "playCount": 1250,
      "likeCount": 350,
      "status": "PENDING",
      "isDeleted": false,
      "createdAt": "2026-08-01T10:00:00",
      "artists": [
        {
          "artistId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "artistName": "Sơn Tùng M-TP",
          "role": "MAIN"
        }
      ],
      "genres": [
        {
          "id": "8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          "name": "Pop"
        }
      ]
    },
    "timestamp": "2026-11-04T15:31:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Thiếu trường `title`, hoặc định dạng UUID không đúng. |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Bài hát hoặc Album chỉ định không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy bài hát hoặc album chuyển tới không tồn tại. |

---

### 1.4. Xóa mềm Bài hát (Soft Delete Song)

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{id}`
- **Mô tả:** Xóa mềm bài hát (`is_deleted = true`).
  - **Quy tắc nghiệp vụ:**
    - Tuyệt đối **không xóa file âm thanh và file ảnh trên Cloudinary**.
    - Dù bài hát có thuộc album hay là single độc lập thì **chỉ xóa duy nhất bài hát đó**.
    - Nếu bài hát thuộc album, hệ thống sẽ tự động giảm `total_tracks` của album đó đi 1.
    - Bài hát sau khi xóa sẽ được đưa vào thùng rác (truy vấn bằng `GET /songs?isDeleted=true`) và ẩn hoàn toàn khỏi Public Catalog & Unified Search.
- **Path Parameter:**
  - `id` (UUID): ID của bài hát cần xóa.
- **Ví dụ Request cURL:**
  ```bash
  curl -X DELETE "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Xóa bài hát thành công",
    "data": null,
    "timestamp": "2026-11-04T15:32:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Bài hát không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy bài hát với `id` truyền vào. |

---

### 1.5. Khôi phục Bài hát (Restore Song)

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{id}/restore`
- **Mô tả:** Khôi phục bài hát từ thùng rác (`is_deleted = false`).
  - **Quy tắc nghiệp vụ:** Giữ nguyên trạng thái `status` trước khi xóa (bài hát đã được duyệt `APPROVED` trước đó thì khi khôi phục lại vẫn là `APPROVED`, không cần chờ Admin duyệt lại).
  - Nếu bài hát thuộc album, hệ thống tự động tăng lại `total_tracks` cho album tương ứng.
- **Path Parameter:**
  - `id` (UUID): ID của bài hát cần khôi phục.
- **Ví dụ Request cURL:**
  ```bash
  curl -X PUT "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101/restore" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Khôi phục bài hát thành công",
    "data": {
      "id": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Cơn Mưa Ngang Qua",
      "durationSeconds": 234,
      "audioUrl": "https://res.cloudinary.com/demo/video/upload/song1.mp3",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/cover1.jpg",
      "explicit": false,
      "playCount": 1250,
      "likeCount": 350,
      "status": "APPROVED",
      "isDeleted": false,
      "createdAt": "2026-08-01T10:00:00",
      "artists": [
        {
          "artistId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "artistName": "Sơn Tùng M-TP",
          "role": "MAIN"
        }
      ],
      "genres": [
        {
          "id": "8f1a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
          "name": "Pop"
        }
      ]
    },
    "timestamp": "2026-11-04T15:33:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Bài hát hiện chưa bị xóa mềm (không nằm trong thùng rác). |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Bài hát không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy bài hát với `id` truyền vào. |

---

### 1.6. Cập nhật Lời bài hát (Lyrics)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{songId}/lyrics`
- **Mô tả:** Thêm mới hoặc cập nhật lời bài hát. Chỉ chủ sở hữu bài hát mới có quyền.
- **Path Parameter:**
  - `songId` (UUID): ID của bài hát.
- **Body (JSON):**
  ```json
  {
    "content": "Lời bài hát ở đây...\nCâu hát thứ hai...",
    "language": "vi"
  }
  ```
- **Ví dụ Request cURL:**
  ```bash
  curl -X POST "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101/lyrics" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -H "Content-Type: application/json" \
    -d '{"content": "Cơn mưa ngang qua mang em đi xa...", "language": "vi"}'
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cập nhật lời bài hát thành công",
    "data": null,
    "timestamp": "2026-11-04T15:33:30"
  }
  ```

---

### 1.7. Thêm Nghệ sĩ phụ (Feat / Producer)

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{songId}/artists`
- **Mô tả:** Thêm nghệ sĩ tham gia sản xuất hoặc góp giọng vào bài hát. Chỉ chủ sở hữu bài hát mới có quyền.
- **Path Parameter:**
  - `songId` (UUID): ID của bài hát.
- **Body (JSON):**
  ```json
  {
    "artistId": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f",
    "role": "FEATURED"
  }
  ```
  *(Các giá trị `role` hợp lệ: `FEATURED`, `PRODUCER`)*
- **Ví dụ Request cURL:**
  ```bash
  curl -X POST "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101/artists" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -H "Content-Type: application/json" \
    -d '{"artistId": "7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f", "role": "FEATURED"}'
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Thêm nghệ sĩ phụ thành công",
    "data": null,
    "timestamp": "2026-11-04T15:33:50"
  }
  ```

---

### 1.8. Xóa Nghệ sĩ phụ khỏi Bài hát (Remove Song Artist)

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{songId}/artists/{artistId}`
- **Mô tả:** Gỡ nghệ sĩ feat / producer ra khỏi bài hát. Chỉ chủ sở hữu bài hát mới có quyền.
- **Path Parameters:**
  - `songId` (UUID): ID của bài hát.
  - `artistId` (UUID): ID của nghệ sĩ phụ cần gỡ khỏi bài hát.
- **Ví dụ Request cURL:**
  ```bash
  curl -X DELETE "http://localhost:8686/api/catalog/artist/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101/artists/7c8d9e0f-1a2b-3c4d-5e6f-7a8b9c0d1e2f" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Xóa nghệ sĩ phụ thành công",
    "data": null,
    "timestamp": "2026-11-04T15:34:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Bài hát không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy bài hát hoặc nghệ sĩ phụ tương ứng trong bài hát. |

---

### B. QUẢN LÝ ALBUM (ALBUMS)

### 1.9. Tạo Album mới

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums`
- **Mô tả:** Tạo một Album, EP hoặc Single mới. Trạng thái mặc định ban đầu là `PENDING`.
- **Content-Type:** `multipart/form-data`
- **Body (Form Data):**
  - `title` (Text, Bắt buộc): Tên Album.
  - `description` (Text, Tùy chọn): Mô tả ngắn về album.
  - `albumType` (Text, Tùy chọn): Phân loại `ALBUM`, `SINGLE`, `EP` (Mặc định: `ALBUM`).
  - `releaseDate` (Date, Tùy chọn): Ngày phát hành định dạng `YYYY-MM-DD`.
  - `coverImage` (File, Tùy chọn): File ảnh bìa Album.
- **Ví dụ Request cURL:**
  ```bash
  curl -X POST "http://localhost:8686/api/catalog/artist/albums" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Album Mới 2026" \
    -F "description=Album phòng thu thứ 2" \
    -F "albumType=ALBUM" \
    -F "releaseDate=2026-12-01" \
    -F "coverImage=@C:/images/album_cover.jpg"
  ```
- **Response JSON mẫu (201 Created):**
  ```json
  {
    "success": true,
    "statusCode": 201,
    "message": "Tạo album thành công",
    "data": {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Album Mới 2026",
      "albumType": "ALBUM",
      "totalTracks": 0,
      "description": "Album phòng thu thứ 2",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/album_cover.jpg",
      "releaseDate": "2026-12-01",
      "status": "PENDING",
      "likeCount": 0,
      "isDeleted": false,
      "createdAt": "2026-11-04T15:35:00"
    },
    "timestamp": "2026-11-04T15:35:00"
  }
  ```

---

### 1.10. Lấy danh sách Album của tôi (My Albums)

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums`
- **Mô tả:** Lấy danh sách toàn bộ Album thuộc nghệ sĩ đăng nhập. Hỗ trợ lọc theo album hoạt động hoặc trong thùng rác.
- **Query Parameters:**
  - `isDeleted` (Boolean, Tùy chọn):
    - `false` (hoặc để trống): Lấy danh sách album đang hoạt động.
    - `true`: Lấy danh sách các album trong thùng rác đã bị xóa mềm.
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số bản ghi mỗi trang (Mặc định: 10).
- **Ví dụ Request cURL:**
  ```bash
  # 1. Lấy album đang hoạt động:
  curl -X GET "http://localhost:8686/api/catalog/artist/albums?page=0&size=10" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"

  # 2. Lấy album trong thùng rác:
  curl -X GET "http://localhost:8686/api/catalog/artist/albums?isDeleted=true" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Lấy danh sách album thành công",
    "data": {
      "content": [
        {
          "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
          "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
          "ownerName": "Sơn Tùng M-TP",
          "title": "Chúng Ta",
          "albumType": "ALBUM",
          "totalTracks": 3,
          "description": "Dự án album Chúng Ta",
          "coverImage": "https://res.cloudinary.com/demo/image/upload/chungta.jpg",
          "releaseDate": "2026-05-01",
          "status": "APPROVED",
          "likeCount": 5400,
          "isDeleted": false,
          "createdAt": "2026-05-01T08:00:00"
        }
      ],
      "pageable": {
        "pageNumber": 0,
        "pageSize": 10
      },
      "totalElements": 1,
      "totalPages": 1,
      "last": true
    },
    "timestamp": "2026-11-04T15:36:00"
  }
  ```

---

### 1.11. Chỉnh sửa Album (Update Album)

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{id}`
- **Mô tả:** Chỉnh sửa thông tin Album.
  - **Quy tắc nghiệp vụ:** Khi chỉnh sửa album, toàn bộ album sẽ **tự động chuyển trạng thái về `PENDING`** để Admin duyệt lại.
  - Hỗ trợ đổi ảnh bìa (upload file mới lên Cloudinary), đổi tên, mô tả, phân loại, ngày phát hành.
- **Content-Type:** `multipart/form-data`
- **Path Parameter:**
  - `id` (UUID): ID của album cần sửa.
- **Body (Form Data):**
  - `title` (Text, Bắt buộc): Tên Album mới.
  - `description` (Text, Tùy chọn): Mô tả mới.
  - `albumType` (Text, Tùy chọn): `ALBUM`, `SINGLE`, `EP`.
  - `releaseDate` (Date, Tùy chọn): Ngày phát hành `YYYY-MM-DD`.
  - `coverImage` (File, Tùy chọn): File ảnh bìa mới.
- **Ví dụ Request cURL:**
  ```bash
  curl -X PUT "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -F "title=Chúng Ta (Special Edition)" \
    -F "description=Phiên bản đặc biệt kỷ niệm" \
    -F "albumType=ALBUM" \
    -F "releaseDate=2026-12-25" \
    -F "coverImage=@C:/images/special_album.jpg"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cập nhật album thành công, trạng thái chuyển về chờ duyệt",
    "data": {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Chúng Ta (Special Edition)",
      "albumType": "ALBUM",
      "totalTracks": 3,
      "description": "Phiên bản đặc biệt kỷ niệm",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/special_album.jpg",
      "releaseDate": "2026-12-25",
      "status": "PENDING",
      "likeCount": 5400,
      "isDeleted": false,
      "createdAt": "2026-05-01T08:00:00"
    },
    "timestamp": "2026-11-04T15:37:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Thiếu trường `title` hoặc ngày phát hành không đúng định dạng `YYYY-MM-DD`. |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Album không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy album với `id` truyền vào. |

---

### 1.12. Xóa mềm Album (Soft Delete Album)

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{id}`
- **Mô tả:** Xóa mềm Album (`is_deleted = true`).
  - **Quy tắc nghiệp vụ:**
    - Tuyệt đối **không xóa file ảnh và file nhạc trên Cloudinary**.
    - **Cascade xóa mềm:** Tự động **xóa mềm toàn bộ các bài hát thuộc album đó** (`is_deleted = true`).
    - Album và toàn bộ bài hát bên trong sẽ được đưa vào thùng rác và lập tức ẩn khỏi Public Catalog & Unified Search.
- **Path Parameter:**
  - `id` (UUID): ID của album cần xóa.
- **Ví dụ Request cURL:**
  ```bash
  curl -X DELETE "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Xóa album và các bài hát trong album thành công",
    "data": null,
    "timestamp": "2026-11-04T15:38:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Album không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy album với `id` truyền vào. |

---

### 1.13. Khôi phục Album (Restore Album)

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{id}/restore`
- **Mô tả:** Khôi phục Album từ thùng rác (`is_deleted = false`).
  - **Quy tắc nghiệp vụ:**
    - Giữ nguyên trạng thái `status` của album trước khi xóa.
    - **Cascade khôi phục:** Tự động **khôi phục toàn bộ các bài hát thuộc album đó** (`is_deleted = false`), giữ nguyên trạng thái status tương ứng.
- **Path Parameter:**
  - `id` (UUID): ID của album cần khôi phục.
- **Ví dụ Request cURL:**
  ```bash
  curl -X PUT "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f/restore" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Khôi phục album và các bài hát thành công",
    "data": {
      "id": "c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f",
      "ownerId": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      "ownerName": "Sơn Tùng M-TP",
      "title": "Chúng Ta",
      "albumType": "ALBUM",
      "totalTracks": 3,
      "description": "Dự án album Chúng Ta",
      "coverImage": "https://res.cloudinary.com/demo/image/upload/chungta.jpg",
      "releaseDate": "2026-05-01",
      "status": "APPROVED",
      "likeCount": 5400,
      "isDeleted": false,
      "createdAt": "2026-05-01T08:00:00"
    },
    "timestamp": "2026-11-04T15:39:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Album hiện chưa bị xóa mềm (không nằm trong thùng rác). |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Album không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy album với `id` truyền vào. |

---

### 1.14. Thêm Bài hát vào Album

- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{albumId}/songs`
- **Mô tả:** Đưa một bài hát đã đăng tải vào một Album. Nếu không truyền `trackNumber`, hệ thống sẽ tự sinh số thứ tự nằm ở cuối album.
- **Path Parameter:**
  - `albumId` (UUID): ID của album.
- **Body (JSON):**
  ```json
  {
    "songId": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101",
    "trackNumber": 1
  }
  ```
- **Ví dụ Request cURL:**
  ```bash
  curl -X POST "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f/songs" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -H "Content-Type: application/json" \
    -d '{"songId": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101", "trackNumber": 1}'
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Thêm bài hát vào album thành công",
    "data": null,
    "timestamp": "2026-11-04T15:40:00"
  }
  ```

---

### 1.15. Gỡ Bài hát khỏi Album (Remove Song From Album)

- **Method:** `DELETE`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{albumId}/songs/{songId}`
- **Mô tả:** Gỡ một bài hát ra khỏi Album (chuyển bài hát thành Single độc lập). Tự động giảm `total_tracks` của album đi 1.
- **Path Parameters:**
  - `albumId` (UUID): ID của album.
  - `songId` (UUID): ID của bài hát cần gỡ.
- **Ví dụ Request cURL:**
  ```bash
  curl -X DELETE "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Gỡ bài hát khỏi album thành công",
    "data": null,
    "timestamp": "2026-11-04T15:41:00"
  }
  ```
- **Mã lỗi thường gặp:**
  | Mã lỗi | Nguyên nhân |
  |---|---|
  | `400 BAD REQUEST` | Bài hát này hiện không thuộc album chỉ định. |
  | `401 UNAUTHORIZED` | Thiếu hoặc sai Access Token. |
  | `403 FORBIDDEN` | Album hoặc bài hát không thuộc sở hữu của nghệ sĩ đang đăng nhập. |
  | `404 NOT FOUND` | Không tìm thấy album hoặc bài hát. |

---

### 1.16. Thay đổi Thứ tự Bài hát trong Album

- **Method:** `PUT`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums/{albumId}/songs/reorder`
- **Mô tả:** Cập nhật lại số thứ tự (trackNumber) của nhiều bài hát cùng lúc. Dùng cho tính năng kéo thả trên Frontend.
- **Path Parameter:**
  - `albumId` (UUID): ID của album.
- **Body (JSON):**
  ```json
  {
    "songOrders": [
      { "songId": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101", "trackNumber": 1 },
      { "songId": "f5a6b7c8-9d0e-1f2a-3b4c-5d6e7f8a9b0c", "trackNumber": 2 }
    ]
  }
  ```
- **Ví dụ Request cURL:**
  ```bash
  curl -X PUT "http://localhost:8686/api/catalog/artist/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f/songs/reorder" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>" \
    -H "Content-Type: application/json" \
    -d '{"songOrders": [{"songId": "e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101", "trackNumber": 1}]}'
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Cập nhật thứ tự bài hát thành công",
    "data": null,
    "timestamp": "2026-11-04T15:42:00"
  }
  ```

---

## 2. Dành cho Quản trị viên (Admin)

**Yêu cầu:** Gửi kèm Header `Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>`.

---

### 2.1. Lấy danh sách Bài hát chờ duyệt

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/songs/pending`
- **Mô tả:** Lấy danh sách tất cả bài hát trên toàn hệ thống đang ở trạng thái `PENDING`.
  - **Lưu ý nghiệp vụ:** Hệ thống chỉ trả về các bài hát đang chờ duyệt và **không nằm trong thùng rác** (`isDeleted = false`).
- **Query Parameters:**
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả. Định dạng: `field,direction`. Mặc định: `createdAt,desc`.
- **Ví dụ Request cURL:**
  ```bash
  curl -X GET "http://localhost:8686/api/catalog/admin/songs/pending?page=0&size=10" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>"
  ```

---

### 2.2. Cập nhật Trạng thái Bài hát (Duyệt / Từ chối)

- **Method:** `PATCH`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/songs/{songId}/status`
- **Mô tả:** Đổi trạng thái bài hát.
  - **Quy tắc nghiệp vụ:** Nếu duyệt (`APPROVED`) một bài hát thuộc Album và đó là bài hát cuối cùng còn `PENDING` trong Album đó, hệ thống sẽ tự động chuyển trạng thái của Album thành `APPROVED` luôn.
- **Path Parameter:**
  - `songId` (UUID): ID của bài hát cần duyệt.
- **Body (JSON):**
  ```json
  {
    "status": "APPROVED"
  }
  ```
  *(Các giá trị hợp lệ: `APPROVED`, `REJECTED`, `TAKEDOWN`)*
- **Ví dụ Request cURL:**
  ```bash
  curl -X PATCH "http://localhost:8686/api/catalog/admin/songs/e4f5a8a1-3b7c-4e89-9a1d-7201c13d3101/status" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"status": "APPROVED"}'
  ```

---

### 2.3. Lấy danh sách Album chờ duyệt

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/albums/pending`
- **Mô tả:** Lấy danh sách tất cả Album trên toàn hệ thống đang ở trạng thái `PENDING`.
  - **Lưu ý nghiệp vụ:** Hệ thống chỉ trả về các album đang chờ duyệt và **không nằm trong thùng rác** (`isDeleted = false`).
- **Query Parameters:**
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả. Định dạng: `field,direction`. Mặc định: `createdAt,desc`.
- **Ví dụ Request cURL:**
  ```bash
  curl -X GET "http://localhost:8686/api/catalog/admin/albums/pending?page=0&size=10" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>"
  ```

---

### 2.4. Cập nhật Trạng thái Album (Duyệt / Từ chối)

- **Method:** `PATCH`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/albums/{albumId}/status`
- **Mô tả:** Đổi trạng thái album.
  - **Quy tắc nghiệp vụ (Cascade):** Khi Admin cập nhật trạng thái Album, toàn bộ bài hát trong Album đó sẽ tự động được cập nhật theo trạng thái tương tự:
    - Duyệt (`APPROVED`) Album → Toàn bộ bài hát cũng được chuyển thành `APPROVED`.
    - Từ chối (`REJECTED`) Album → Toàn bộ bài hát cũng chuyển thành `REJECTED`.
    - Gỡ xuống (`TAKEDOWN`) Album → Toàn bộ bài hát cũng chuyển thành `TAKEDOWN`.
- **Path Parameter:**
  - `albumId` (UUID): ID của album cần duyệt.
- **Body (JSON):**
  ```json
  {
    "status": "APPROVED"
  }
  ```
  *(Các giá trị hợp lệ: `APPROVED`, `REJECTED`, `TAKEDOWN`)*
- **Ví dụ Request cURL:**
  ```bash
  curl -X PATCH "http://localhost:8686/api/catalog/admin/albums/c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f/status" \
    -H "Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>" \
    -H "Content-Type: application/json" \
    -d '{"status": "APPROVED"}'
  ```

---

## 3. Công khai (Public)

**Yêu cầu:** Không cần Token. Mọi client kể cả khách chưa đăng nhập đều có thể gọi.

> **Lưu ý về tham số `sort`:**
> Tham số `sort` nhận giá trị theo định dạng `field,direction` (VD: `playCount,desc`).
> Nếu field không hợp lệ, hệ thống sẽ tự động fallback về sort mặc định `createdAt,desc` để đảm bảo an toàn.

---

### 3.1. Lấy danh sách Bài hát Công khai

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/songs`
- **Mô tả:** Lấy danh sách bài hát đã được Admin duyệt (`APPROVED`) và chưa bị xóa mềm (`isDeleted = false`).
- **Query Parameters:**
  - `keyword` (String, Tùy chọn): Tìm kiếm theo Tiêu đề bài hát (`title`), Tên nghệ sĩ chính (`ownerName`), hoặc Tên nghệ sĩ góp giọng/feat (`artistName`). Không phân biệt hoa/thường.
  - `genreId` (UUID, Tùy chọn): Lọc bài hát theo Thể loại.
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả. Mặc định: `createdAt,desc`. Các field hợp lệ: `playCount`, `likeCount`, `createdAt`, `title`.

---

### 3.2. Lấy danh sách Thể loại

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/genres`
- **Mô tả:** Lấy danh sách toàn bộ các Thể loại âm nhạc (Genres) trên hệ thống.

---

### 3.3. Lấy danh sách Album Công khai

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/albums`
- **Mô tả:** Lấy danh sách các Album đã được Admin duyệt (`APPROVED`) và chưa bị xóa mềm (`isDeleted = false`).
- **Query Parameters:**
  - `keyword` (String, Tùy chọn): Tìm kiếm theo Tên Album (`title`) hoặc Tên nghệ sĩ (`ownerName`). Không phân biệt hoa/thường.
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả. Mặc định: `createdAt,desc`. Các field hợp lệ: `likeCount`, `createdAt`, `title`, `releaseDate`, `totalTracks`.

---

### 3.4. Lấy danh sách Bài hát của một Nghệ sĩ

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/artists/{artistId}/songs`
- **Mô tả:** Lấy danh sách các Bài hát công khai (`APPROVED`, `isDeleted = false`) do một nghệ sĩ đăng tải.
- **Query Parameters:**
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả (`playCount`, `likeCount`, `createdAt`, `title`). Mặc định: `createdAt,desc`.

---

### 3.5. Lấy danh sách Album của một Nghệ sĩ

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/artists/{artistId}/albums`
- **Mô tả:** Lấy danh sách các Album công khai (`APPROVED`, `isDeleted = false`) do một nghệ sĩ đăng tải.
- **Query Parameters:**
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả (`likeCount`, `createdAt`, `title`, `releaseDate`, `totalTracks`). Mặc định: `createdAt,desc`.

---

### 3.6. Lấy danh sách Bài hát trong một Album

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/albums/{albumId}/songs`
- **Mô tả:** Lấy danh sách các Bài hát công khai (`APPROVED`, `isDeleted = false`) nằm trong một album cụ thể. Báo lỗi 404 nếu album không tồn tại, chưa duyệt hoặc đã bị xóa mềm.
- **Query Parameters:**
  - `page` (Int, Tùy chọn): Số trang (Mặc định: 0).
  - `size` (Int, Tùy chọn): Số lượng hiển thị mỗi trang (Mặc định: 10).
  - `sort` (String, Tùy chọn): Sắp xếp kết quả. Mặc định: `createdAt,desc`.

---

### 3.7. Lấy chi tiết một Bài hát

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/songs/{id}`
- **Mô tả:** Lấy thông tin chi tiết của một bài hát (bao gồm thông tin audio, artist, genres) để phát nhạc. Bài hát phải ở trạng thái `APPROVED` và chưa bị xóa mềm (`isDeleted = false`). Báo lỗi 404 nếu bài hát bị xóa mềm hoặc chưa duyệt.
- **Path Variable:**
  - `id` (UUID): ID của bài hát.

---

### 3.8. Lấy chi tiết một Album

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/albums/{id}`
- **Mô tả:** Lấy thông tin metadata chi tiết của một Album. Album phải ở trạng thái `APPROVED` và chưa bị xóa mềm (`isDeleted = false`). Báo lỗi 404 nếu album bị xóa mềm hoặc chưa duyệt.
- **Path Variable:**
  - `id` (UUID): ID của album.

---

### 3.9. Lấy Lời bài hát (Lyrics)

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/songs/{id}/lyrics`
- **Mô tả:** Lấy lời bài hát của một bài hát. Chỉ trả về nếu bài hát tồn tại và chưa bị xóa mềm. Nếu bài hát chưa có lời, trả về lỗi 404.
- **Path Variable:**
  - `id` (UUID): ID của bài hát.
- **Response `data`:**
  ```json
  {
    "id": "uuid",
    "content": "Lời bài hát ở đây...",
    "language": "vi"
  }
  ```

---

### 3.10. Tìm kiếm Thống nhất (Unified Search)

- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/search`
- **Mô tả:** API tìm kiếm tổng hợp — trả về **kết quả hàng đầu nổi bật nhất** (`topResult`) cùng danh sách bài hát, album, và nghệ sĩ liên quan đến từ khóa. Được thiết kế cho thanh tìm kiếm chính của ứng dụng (tương tự Spotify / Apple Music).
  - **Lưu ý nghiệp vụ:** Các bài hát và album đã bị xóa mềm (`isDeleted = true`) sẽ tự động bị loại bỏ khỏi kết quả tìm kiếm.
  - **Cơ chế hoạt động:**
    1. Đồng thời tìm bài hát và album trong Catalog DB (`APPROVED` và `isDeleted = false`).
    2. Gọi nội bộ sang Artists Service để lấy danh sách nghệ sĩ khớp từ khóa.
    3. Áp dụng **Relevance Scoring** để sắp xếp từng danh sách và bầu chọn `topResult` tốt nhất:
       - Khớp 100% tên chính: 100 điểm \| Prefix: 75 \| Substring: 50 \| Trường phụ: 30
       - Hệ số nhân: Artist ×1.3 \| Song ×1.1 \| Album ×1.0
       - Điểm thưởng phổ biến: dựa trên log10 của lượt nghe/theo dõi (tối đa +20)
    4. Nếu Artists Service gặp sự cố, API vẫn trả về kết quả songs + albums bình thường (fail-soft).
- **Query Parameters:**
  - `keyword` (String, **Bắt buộc**): Từ khóa tìm kiếm. Hệ thống tự động trim khoảng trắng.
  - `limit` (Int, Tùy chọn): Số lượng kết quả tối đa mỗi danh mục (songs / albums / artists). Mặc định: `5`. Giới hạn: `[1, 20]`.
- **Ví dụ Request cURL:**
  ```bash
  curl -X GET "http://localhost:8686/api/catalog/public/search?keyword=Sơn%20Tùng&limit=5"
  ```
- **Response JSON mẫu (200 OK):**
  ```json
  {
    "success": true,
    "statusCode": 200,
    "message": "Tìm kiếm thành công",
    "data": {
      "topResult": {
        "type": "ARTIST",
        "item": {
          "id": "uuid-son-tung",
          "stageName": "Sơn Tùng M-TP",
          "avatarUrl": "https://res.cloudinary.com/.../avatar.jpg",
          "followerCount": 5000000
        },
        "score": 163.49
      },
      "songs": [
        {
          "id": "uuid-song",
          "ownerId": "uuid-son-tung",
          "ownerName": "Sơn Tùng M-TP",
          "title": "Lạc Trôi",
          "durationSeconds": 245,
          "audioUrl": "https://...",
          "coverImage": "https://...",
          "explicit": false,
          "playCount": 8000000,
          "likeCount": 300000,
          "status": "APPROVED",
          "isDeleted": false,
          "createdAt": "2026-01-01T00:00:00",
          "artists": [{ "artistId": "uuid", "artistName": "Sơn Tùng M-TP", "role": "MAIN" }],
          "genres": [{ "id": "uuid", "name": "V-Pop" }]
        }
      ],
      "albums": [
        {
          "id": "uuid-album",
          "ownerId": "uuid-son-tung",
          "ownerName": "Sơn Tùng M-TP",
          "title": "m-tp M-TP",
          "albumType": "ALBUM",
          "totalTracks": 10,
          "description": "...",
          "coverImage": "https://...",
          "releaseDate": "2026-06-01",
          "status": "APPROVED",
          "likeCount": 120000,
          "isDeleted": false,
          "createdAt": "2026-06-01T00:00:00"
        }
      ],
      "artists": [
        {
          "id": "uuid-son-tung",
          "stageName": "Sơn Tùng M-TP",
          "avatarUrl": "https://...",
          "followerCount": 5000000
        }
      ]
    },
    "timestamp": "2026-11-04T15:45:00"
  }
  ```

---

## 4. Dành cho Người nghe nhạc (User)

*(Sắp triển khai: Các API như lưu playlist cá nhân, lịch sử nghe nhạc, thả tim bài hát,... liên quan đến Catalog sẽ được cập nhật tại đây khi hoàn thành).*
