# Quy Chuẩn Thiết Kế API Backend (MC Music)

Tài liệu này quy định các tiêu chuẩn bắt buộc khi phát triển RESTful API cho toàn bộ các microservices trong hệ thống MC Music nhằm đảm bảo tính nhất quán, dễ bảo trì và dễ tích hợp với Frontend.

## 1. Quy chuẩn đặt tên URI (Endpoint Design)

- **Dùng danh từ số nhiều, không dùng động từ:**
  - ✅ **Chuẩn:** `GET /api/v1/courses`, `POST /api/v1/courses`
  - ❌ **Tránh:** `GET /api/v1/getAllCourses`, `POST /api/v1/createCourse`

- **Phản ánh quan hệ phân cấp (Nested Resources):**
  - Ví dụ: `GET /api/v1/courses/{courseId}/students` (Lấy danh sách sinh viên thuộc khóa học cụ thể).

- **Quy tắc định dạng:**
  - Dùng chữ thường (lowercase) và dấu gạch nối (kebab-case) cho URI.
    - Ví dụ: `/api/v1/student-enrollments`
  - Không dùng đuôi file trong URI (ví dụ: `.json`, `.xml`).

## 2. Sử dụng đúng HTTP Methods

Mỗi endpoint phải sử dụng đúng HTTP method theo chuẩn REST:
- **`GET`**: Đọc dữ liệu (Idempotent & Safe — không thay đổi trạng thái server).
- **`POST`**: Tạo mới tài nguyên.
- **`PUT`**: Thay thế/cập nhật toàn bộ tài nguyên.
- **`PATCH`**: Cập nhật một phần thuộc tính tài nguyên.
- **`DELETE`**: Xóa tài nguyên (Idempotent).

## 3. Chuẩn hóa HTTP Status Code

Các API phải trả về mã trạng thái HTTP chuẩn xác theo từng tình huống:

### Nhóm 2xx (Success)
- **`200 OK`**: Lấy hoặc cập nhật dữ liệu thành công.
- **`201 Created`**: Tạo mới thành công (thường kèm header `Location`).
- **`204 No Content`**: Xóa thành công hoặc request thành công nhưng không cần trả về body.

### Nhóm 4xx (Client Error)
- **`400 Bad Request`**: Dữ liệu đầu vào sai định dạng (Validation failed).
- **`401 Unauthorized`**: Chưa xác thực (chưa login hoặc thiếu/sai JWT Token).
- **`403 Forbidden`**: Đã xác thực nhưng không đủ quyền truy cập (sai Role).
- **`404 Not Found`**: Không tìm thấy tài nguyên yêu cầu.
- **`409 Conflict`**: Xung đột dữ liệu (ví dụ: trùng email, trùng tên đăng nhập).

### Nhóm 5xx (Server Error)
- **`500 Internal Server Error`**: Lỗi logic backend hoặc sập cơ sở dữ liệu.

## 4. Cấu trúc Response đồng nhất

Tất cả các API (thành công hoặc thất bại) đều phải bọc dữ liệu trả về theo một cấu trúc JSON duy nhất:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thông báo thân thiện với người dùng (VD: Lấy dữ liệu thành công)",
  "data": {
    "id": 12,
    "fullName": "Nguyen Van A",
    "email": "vana@example.com"
  },
  "timestamp": "2026-08-23T15:35:52Z"
}
```

- **`success`** (boolean): `true` nếu request thành công, `false` nếu có lỗi (kể cả lỗi validation).
- **`statusCode`** (number): Mã HTTP status code tương ứng (200, 400, 404, 500...).
- **`message`** (string): Thông báo lỗi chi tiết hoặc lời nhắn thành công.
- **`data`** (object/array/null): Payload dữ liệu chính. Có thể là mảng nếu trả về danh sách, là object nếu trả về chi tiết, hoặc `null` nếu bị lỗi.
- **`timestamp`** (string/ISO-8601): Thời gian server trả về response.
