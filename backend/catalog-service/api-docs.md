# Hướng dẫn Kiểm thử và Sử dụng API - Catalog Service

Tài liệu này tổng hợp toàn bộ các API thuộc **Catalog Service**. 
**LƯU Ý QUAN TRỌNG:** Tất cả các endpoint dưới đây đều phải được gọi thông qua **API Gateway (Port 8686)** để đảm bảo tính nhất quán, phân quyền và xử lý CORS tự động. Không gọi trực tiếp vào port của Catalog Service.

Base URL cho Catalog Service thông qua Gateway là: `http://localhost:8686/api/catalog`

> Mọi phản hồi (Response) thành công hay thất bại đều tuân theo chuẩn định dạng JSON:
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

## 1. Dành cho Nghệ sĩ (Artist)
**Yêu cầu:** Gửi kèm Header `Authorization: Bearer <ACCESS_TOKEN_CỦA_ARTIST>`.

### 1.1. Đăng tải Bài hát (Upload Song)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs`
- **Mô tả:** Đăng tải một bài hát mới. Trạng thái mặc định sẽ là `PENDING`.
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `title` (Text): Tên bài hát (Bắt buộc)
  - `audioFile` (File): File nhạc mp3/wav (Bắt buộc)
  - `coverImage` (File): File ảnh bìa (Không bắt buộc)
  - `albumId` (Text): UUID của Album nếu có (Không bắt buộc)

### 1.2. Lấy danh sách Bài hát của tôi (My Songs)
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs`
- **Mô tả:** Lấy danh sách toàn bộ bài hát mà nghệ sĩ này đã đăng tải.

### 1.3. Tạo Album mới
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums`
- **Mô tả:** Tạo một Album/EP/Single mới. Trạng thái mặc định là `PENDING`.
- **Content-Type:** `multipart/form-data`
- **Body:**
  - `title` (Text): Tên Album (Bắt buộc)
  - `description` (Text): Mô tả (Không bắt buộc)
  - `coverImage` (File): File ảnh bìa Album (Không bắt buộc)

### 1.4. Lấy danh sách Album của tôi (My Albums)
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/albums`
- **Mô tả:** Lấy danh sách toàn bộ Album của nghệ sĩ.

### 1.5. Cập nhật Lời bài hát (Lyrics)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{songId}/lyrics`
- **Mô tả:** Thêm mới hoặc cập nhật lời bài hát. (Chỉ chủ sở hữu bài hát mới có quyền).
- **Body (JSON):**
  ```json
  {
      "content": "Lời bài hát ở đây...",
      "language": "vi"
  }
  ```

### 1.6. Thêm Nghệ sĩ phụ (Feat/Producer)
- **Method:** `POST`
- **Endpoint:** `http://localhost:8686/api/catalog/artist/songs/{songId}/artists`
- **Mô tả:** Thêm nghệ sĩ tham gia sản xuất bài hát. (Chỉ chủ sở hữu bài hát mới có quyền).
- **Body (JSON):**
  ```json
  {
      "artistId": "uuid-cua-nghe-si",
      "role": "FEATURED"
  }
  ```
  *(Các giá trị role hợp lệ: `FEATURED`, `PRODUCER`)*

---

## 2. Dành cho Quản trị viên (Admin)
**Yêu cầu:** Gửi kèm Header `Authorization: Bearer <ACCESS_TOKEN_CỦA_ADMIN>`.

### 2.1. Lấy danh sách Bài hát chờ duyệt
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/songs/pending`
- **Mô tả:** Lấy tất cả bài hát trên toàn hệ thống đang ở trạng thái `PENDING`.

### 2.2. Cập nhật Trạng thái Bài hát (Duyệt/Từ chối)
- **Method:** `PATCH`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/songs/{songId}/status`
- **Mô tả:** Đổi trạng thái bài hát.
- **Body (JSON):**
  ```json
  {
      "status": "APPROVED" 
  }
  ```
  *(Các giá trị hợp lệ: `APPROVED`, `REJECTED`, `TAKEDOWN`)*

### 2.3. Lấy danh sách Album chờ duyệt
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/albums/pending`
- **Mô tả:** Lấy tất cả Album trên toàn hệ thống đang ở trạng thái `PENDING`.

### 2.4. Cập nhật Trạng thái Album (Duyệt/Từ chối)
- **Method:** `PATCH`
- **Endpoint:** `http://localhost:8686/api/catalog/admin/albums/{albumId}/status`
- **Mô tả:** Đổi trạng thái album.
- **Body (JSON):**
  ```json
  {
      "status": "APPROVED" 
  }
  ```
  *(Các giá trị hợp lệ: `APPROVED`, `REJECTED`, `TAKEDOWN`)*

---

## 3. Công khai (Public)
**Yêu cầu:** Không cần Token. Mọi user kể cả chưa đăng nhập đều có thể gọi.

### 3.1. Lấy danh sách Bài hát Công khai
- **Method:** `GET`
- **Endpoint:** `http://localhost:8686/api/catalog/public/songs`
- **Mô tả:** Lấy toàn bộ bài hát đã được Admin duyệt (`APPROVED`) để hiển thị lên trang chủ cho người nghe.

---

## 4. Dành cho Người nghe nhạc (User)
*(Sắp triển khai: Các API như lưu playlist cá nhân, lịch sử nghe nhạc, thả tim bài hát,... liên quan đến Catalog sẽ được cập nhật tại đây khi hoàn thành).*
