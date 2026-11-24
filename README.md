# Kiến Trúc Thư Mục Hệ Thống — Nền Tảng Âm Nhạc Trực Tuyến (MC Music Platform)

Tài liệu này cung cấp sơ đồ tổng quan và chi tiết về cấu trúc thư mục, vai trò của từng thành phần, công nghệ sử dụng, cổng kết nối và luồng giao tiếp giữa các dịch vụ trong toàn bộ dự án.

---

## 1. Sơ Đồ Tổng Quan Cấu Trúc Dự Án (High-Level Architecture)

```text
software-engineering-Music_website/
├── README.md                          # Tài liệu tổng quan dự án & hướng dẫn chạy Docker/Dev
├── docker-compose.yml                 # Điều phối 10 container trên mạng mc_music_network
├── .env.example                       # Mẫu biến môi trường gốc cho Docker Compose
├── database/
│   ├── init-docker.sql                # Script khởi tạo 4 schemas, 20 bảng & seed 12 thể loại
│   └── insert_mock_catalog_data.sql   # Tập dữ liệu bài hát/album mẫu phục vụ kiểm thử
├── docs/                              # Báo cáo phân tích API, kiến trúc và thiết kế CSDL Catalog
├── backend/
│   ├── quy-chuan-api.md               # Quy chuẩn RESTful API & chuẩn JSON ApiResponse
│   ├── shared-auth-lib/               # Module dùng chung JwtTokenProvider + JwtTokenProviderTest
│   ├── api-gateway/                   # Cổng định tuyến (Port 8686) + CorsConfigTest
│   ├── catalog-service/               # Quản lý nhạc/album/tìm kiếm/Cloudinary + 3 lớp test
│   ├── users-service/                 # Auth User, Playlist, Favorites, History + 3 lớp test
│   ├── artists-service/               # Auth Artist, Profile, Dashboard, Kafka + 2 lớp test
│   └── admin-service/                 # Auth Admin, Quản trị User/Artist + 2 lớp test
└── frontend/
    ├── ui_ux_guidelines.md            # Hệ thống thiết kế Dark Mode Spotify Red (#fa2d48)
    ├── users/                         # Ứng dụng User Web App (React 19, Vite, Tailwind 4)
    ├── artists/                       # Ứng dụng Artist Studio (React 19, Vite, Tailwind 4)
    └── admin/                         # Ứng dụng Admin Portal (React 19, Vite, Tailwind 4)
```

---

## 2. Chi Tiết Kiến Trúc Từng Phân Hệ (Detailed Architecture Breakdown)

### 2.1. Cấu Trúc Cơ Sở Dữ Liệu (`database/`)

Quản lý toàn bộ script khởi tạo lược đồ dữ liệu, cấp quyền, cấu hình schema và dữ liệu mẫu (mock data) cho cơ sở dữ liệu PostgreSQL 15.

```text
database/
├── init-docker.sql                    # Khởi tạo 4 schemas độc lập, 20 bảng quan hệ & seed 12 thể loại nhạc
├── insert_mock_catalog_data.sql       # Dữ liệu bài hát, album, nghệ sĩ, lời bài hát synced mẫu để kiểm thử
├── console.sql                        # Script thao tác và truy vấn nhanh CSDL cho lập trình viên
└── db/                                # Cấu hình Datasource & Workspace kết nối CSDL (DataGrip / IntelliJ)
```

* **4 Schemas độc lập tuyệt đối**:
  1. `mc_music_users_schema`: Quản lý người dùng, refresh tokens, playlists, bài hát trong playlist, bài hát yêu thích, album yêu thích, theo dõi nghệ sĩ, lịch sử nghe nhạc (8 bảng).
  2. `mc_music_artists_schema`: Quản lý nghệ sĩ, hồ sơ, bio, ảnh đại diện, cover và refresh tokens (2 bảng).
  3. `mc_music_admin_schema`: Quản lý tài khoản quản trị viên và refresh tokens (2 bảng).
  4. `mc_music_catalog_schema`: Quản lý kho âm nhạc: Thể loại (genres), Albums, Bài hát (songs), Nghệ sĩ hợp tác (song_artists), Thể loại bài hát (song_genres), Lời bài hát karaoke (lyrics), System Playlists (8 bảng).

---

### 2.2. Tài Liệu Thiết Kế & Nghiệp Vụ (`docs/`)

Lưu trữ các báo cáo phân tích kỹ thuật, quy chuẩn kiến trúc và kế hoạch thực thi của dự án.

```text
docs/
├── bao-cao-kien-truc-du-an_2.md       # Báo cáo tổng quan kiến trúc hệ thống, mô hình phân tán & Kafka
├── api_analysis_report.md             # Danh mục toàn bộ RESTful API theo 3 nhóm người dùng (User, Artist, Admin)
├── catalog_db_analysis.md             # Phân tích chuyên sâu kiến trúc CSDL Catalog, quy trình kiểm duyệt & lyrics
└── ke-hoach-trien-khai.md             # Kế hoạch chi tiết 5 giai đoạn triển khai theo chiến lược Backend-First
```

---

### 2.3. Tầng Xử Lý Nghiệp Vụ Backend (`backend/`)

Xây dựng trên nền tảng **Java 17, Spring Boot 4.1.1, Spring Cloud 2025.1.2, Gradle 9.x**, áp dụng kiến trúc Microservices phân tán với giao tiếp nội bộ qua REST (OpenFeign) và Message Broker (Apache Kafka 3.7.0).

```text
backend/
├── quy-chuan-api.md                   # Tiêu chuẩn thiết kế URI, chuẩn hóa HTTP Status Code & JSON ApiResponse
├── shared-auth-lib/                   # Module thư viện chung: Xử lý JWT Token (Ký & Verify đa issuer)
│   ├── src/main/java/                 # JwtTokenProvider (Tạo & thẩm định access/refresh token)
│   └── src/test/java/                 # JwtTokenProviderTest (Unit test kiểm thử toàn diện module xác thực)
│
├── api-gateway/                       # Cổng định tuyến API Gateway (Port 8686) - Spring Cloud Gateway Server WebMvc
│   ├── src/main/java/                 # GatewayRoutesConfig (Định tuyến /api/user, /api/artist, /api/admin, /api/catalog)
│   │                                  # CorsConfig (Cấu hình CORS tập trung cho 3 frontend 5171, 5172, 5173)
│   └── src/test/java/                 # 2 lớp test: CorsConfigTest + ApiGatewayApplicationTests
│
├── catalog-service/                   # Dịch vụ quản lý kho bài hát, album & media (Port 8081)
│   ├── src/main/java/                 # MultiIssuerJwtFilter: Tự xác thực đa nguồn từ cả 3 domain (User/Artist/Admin)
│   │                                  # CloudinaryService: Upload & tối ưu trực tiếp file audio (.mp3) và cover (.jpg/png)
│   │                                  # SongService / AlbumService / UnifiedSearchService: Nghiệp vụ quản lý & tìm kiếm
│   │                                  # ArtistEventListener: Lắng nghe Kafka artist-events-topic để cập nhật thông tin nghệ sĩ
│   │                                  # Quy trình kiểm duyệt: PENDING -> APPROVED / REJECTED / TAKEDOWN kèm rejection_reason
│   └── src/test/java/                 # 3 lớp test: SongServiceTest + RelevanceScorerTest + CatalogServiceApplicationTests
│
├── users-service/                     # Dịch vụ người dùng & thư viện cá nhân (Port 8082)
│   ├── src/main/java/                 # Auth User (Register, Login, Token Refresh, Logout với secret riêng biệt)
│   │                                  # PlaylistService / FavoriteService / PlayHistoryService / FollowArtistService
│   │                                  # Data Denormalization: Lưu trữ bản sao song_title, artist_name, cover_image
│   │                                  # Internal API: Gửi HTTP nội bộ sang Catalog tăng like_count & play_count
│   │                                  # ArtistEventListener: Lắng nghe Kafka artist-events-topic đồng bộ tên/avatar nghệ sĩ
│   └── src/test/java/                 # 3 lớp test: AuthServiceTest + PlaylistServiceTest + UsersServiceApplicationTests
│
├── artists-service/                   # Dịch vụ nghệ sĩ sáng tạo & hồ sơ Studio (Port 8083)
│   ├── src/main/java/                 # Auth Artist (Register, Login, Token Refresh với secret riêng biệt)
│   │                                  # ArtistProfileService: Cập nhật Stage Name, Bio, Avatar, Banner lên Cloudinary
│   │                                  # ArtistDashboardService: Tổng hợp lượt nghe và người theo dõi từ Catalog
│   │                                  # Kafka Producer: Bắn sự kiện ArtistProfileUpdatedEvent lên artist-events-topic
│   └── src/test/java/                 # 2 lớp test: AuthServiceTest + ArtistsServiceApplicationTests
│
└── admin-service/                     # Dịch vụ quản trị hệ thống & kiểm soát tài khoản (Port 8084)
    ├── src/main/java/                 # Auth Admin (Login, Refresh Token với secret riêng biệt)
    │                                  # Quản lý User/Artist: Khóa / Mở khóa tài khoản (isActive = false/true)
    │                                  # OpenFeign Clients: Giao tiếp bảo mật với users-service & artists-service qua X-Internal-Secret
    └── src/test/java/                 # 2 lớp test: AuthServiceTest + AdminServiceApplicationTests
```

---

### 2.4. Tầng Giao Diện Người Dùng Frontend (`frontend/`)

Gồm **3 ứng dụng Single Page Application (SPA) độc lập** được xây dựng bằng **React 19, Vite, Tailwind CSS v4, Zustand, TanStack Query (React Query), Lucide React và Sonner**. Mỗi ứng dụng chạy trên một cổng và origin riêng biệt nhằm cô lập token theo cơ chế Same-Origin Policy (SOP).

```text
frontend/
├── ui_ux_guidelines.md                # Hệ thống thiết kế Dark Mode Spotify Red (#fa2d48), Glassmorphism & UI Rules
│
├── users/                             # Ứng dụng Web dành cho Người nghe nhạc (Port 5173 -> Docker Nginx Port 80)
│   ├── src/pages/                     # HomePage, SearchPage, SongPage, AlbumPage, ArtistPage, PlaylistPage, LikedSongsPage
│   ├── src/components/player/         # Bottom Player phát nhạc cố định, Karaoke Lyrics đồng bộ theo thời gian thực (LRC)
│   ├── src/components/playlist/       # Quản lý danh sách phát, thêm/xóa bài hát, dialog tạo playlist
│   ├── src/store/                     # Zustand Stores: useAuthStore (Auth & Token), usePlayerStore (State & Queue phát nhạc)
│   └── src/hooks/                     # Custom React Hooks: usePlaylists, useFavorites, useFollowArtists
│
├── artists/                           # Ứng dụng Studio dành cho Nghệ sĩ sáng tạo (Port 5172 -> Docker Nginx Port 80)
│   ├── src/pages/                     # DashboardPage (Thống kê), SongsPage (Quản lý bài hát), AlbumsPage (Tạo album), ProfilePage
│   ├── src/components/songs/          # Form Upload bài hát trực tiếp lên Cloudinary, nhập lời bài hát, gắn nghệ sĩ feat
│   │                                  # Tích hợp AbortController chống lỗi timeout mạng khi upload file dung lượng lớn
│   │                                  # Đọc lý do vi phạm (rejection_reason) nếu bài hát/album bị Admin từ chối duyệt
│   └── src/store/                     # Zustand Store: useAuthStore (Lưu token & thông tin hồ sơ nghệ sĩ)
│
└── admin/                             # Ứng dụng Portal dành cho Quản trị viên (Port 5171 -> Docker Nginx Port 80)
    ├── src/pages/                     # DashboardPage, PendingSongsPage, PendingAlbumsPage, UsersPage, ArtistsPage
    ├── src/components/moderation/     # Kiểm duyệt bài hát với Audio Preview Player tích hợp & Modal Bộ quy tắc vi phạm chuẩn hóa
    │                                  # Thẩm định album, duyệt (APPROVED) hoặc từ chối (REJECTED/TAKEDOWN) kèm lý do chi tiết
    │                                  # Khóa / Mở khóa tài khoản User và Artist cập nhật trạng thái thời gian thực
    └── src/store/                     # Zustand Store: useAuthStore (Phiên làm việc quản trị viên)
```

---

## 3. Ma Trận Dịch Vụ, Cổng & Môi Trường (Container Matrix)

Hệ thống được đóng gói hoàn chỉnh bằng Docker Compose với **10 container** cùng hoạt động trên mạng nội bộ `mc_music_network`:

| STT | Container Name | Service / App | Host Port | Container Port | Công nghệ chính |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **1** | `postgres-db` | Hạ tầng CSDL | `5432` | `5432` | PostgreSQL 15 Alpine (4 Schemas, 20 Tables) |
| **2** | `kafka` | Message Broker | `9092` | `9092` / `29092` | Apache Kafka 3.7.0 (Topic: `artist-events-topic`) |
| **3** | `catalog-service` | Backend Service | `8081` | `8081` | Spring Boot 4, Cloudinary SDK, Multi-Issuer JWT |
| **4** | `users-service` | Backend Service | `8082` | `8082` | Spring Boot 4, JPA, Kafka Listener, Denormalization |
| **5** | `artists-service` | Backend Service | `8083` | `8083` | Spring Boot 4, JPA, Kafka Producer, Cloudinary |
| **6** | `admin-service` | Backend Service | `8084` | `8084` | Spring Boot 4, OpenFeign Client, BCrypt |
| **7** | `api-gateway` | Cổng API Gateway | `8686` | `8686` | Spring Cloud Gateway WebMvc, CORS Configuration |
| **8** | `admin-frontend` | Giao diện Quản trị | `5171` | `80` | React 19, Vite, Tailwind 4, Nginx Alpine |
| **9** | `artists-frontend` | Giao diện Nghệ sĩ | `5172` | `80` | React 19, Vite, Tailwind 4, Nginx Alpine |
| **10**| `users-frontend` | Giao diện Người nghe | `5173` | `80` | React 19, Vite, Tailwind 4, Nginx Alpine |

---

## 4. Các Nguyên Tắc Kiến Trúc Cốt Lõi (Architecture Highlights)

1. **Ba Miền Tài Khoản Độc Lập Tuyệt Đối (Domain Separation)**:
   - User, Artist, Admin sử dụng bảng dữ liệu, luồng xác thực và secret key JWT hoàn toàn tách biệt.
   - Thư viện `shared-auth-lib` đóng vai trò module tiện ích ký và kiểm tra token, không lưu trữ secret key bên trong.
2. **API Gateway Định Tuyến Thuần Túy (Stateless Routing)**:
   - Gateway chỉ định tuyến theo tiền tố đường dẫn (`/api/user/**`, `/api/artist/**`, `/api/admin/**`, `/api/catalog/**`) và xử lý CORS. Gateway không giải mã hoặc xác thực JWT để đảm bảo hiệu năng cao và phân tách trách nhiệm rõ ràng.
3. **Xác Thực Đa Nguồn Tại Catalog Service (Multi-Issuer JWT)**:
   - Catalog Service kiểm tra trực tiếp claim `iss` (Issuer) để chọn secret key tương ứng xác thực chữ ký token từ User, Artist hoặc Admin, từ đó phân quyền chặt chẽ các tác vụ stream nhạc, upload bài hát hoặc phê duyệt vi phạm.
4. **Phi Chuẩn Hóa Dữ Liệu & Đồng Bộ Qua Apache Kafka (Eventual Consistency)**:
   - `users-service` nhân bản dữ liệu bài hát (`song_title`, `artist_name`, `cover_image`) vào bảng playlist và lịch sử để tối ưu tốc độ đọc.
   - Khi nghệ sĩ cập nhật hồ sơ, `artists-service` phát sự kiện qua Kafka `artist-events-topic` để `catalog-service` và `users-service` tự động đồng bộ lại dữ liệu.
5. **Giao Tiếp Nội Bộ Được Bảo Vệ (Internal Security)**:
   - Các API nội bộ giữa các microservices (như cộng lượt nghe `play_count`, lượt thích `like_count`, hoặc khóa tài khoản) được bảo vệ bằng header bí mật `X-Internal-Secret`.
6. **Kiểm Thử Toàn Diện (CI Automation)**:
   - Pipeline GitHub Actions (`.github/workflows/ci.yml`) tự động chạy ma trận unit tests cho 6 dịch vụ backend (Gradle) và lint/build cho 3 ứng dụng frontend (Vite/Node 20).

---

## 5. Hướng Dẫn Khởi Chạy Dự Án (Getting Started)

### Cách 1: Khởi chạy toàn bộ hệ thống bằng Docker Compose (Khuyên dùng)

1. Sao chép file cấu hình môi trường:
   ```bash
   cp .env.example .env
   ```
2. Khởi động 10 container:
   ```bash
   docker compose up -d --build
   ```
3. Truy cập các ứng dụng:
   - **User Web App**: [http://localhost:5173](http://localhost:5173)
   - **Artist Studio App**: [http://localhost:5172](http://localhost:5172)
   - **Admin Portal App**: [http://localhost:5171](http://localhost:5171)
   - **API Gateway Endpoint**: [http://localhost:8686](http://localhost:8686)

### Cách 2: Khởi chạy môi trường phát triển cục bộ (Local Development)

1. **Khởi chạy CSDL & Kafka**:
   ```bash
   docker compose up -d postgres-db kafka
   ```
2. **Build thư viện chung vào Maven Local**:
   ```bash
   cd backend/shared-auth-lib
   ./gradlew publishToMavenLocal
   ```
3. **Khởi chạy từng Microservice Backend**:
   - `catalog-service`: `./gradlew bootRun` (Port 8081)
   - `users-service`: `./gradlew bootRun` (Port 8082)
   - `artists-service`: `./gradlew bootRun` (Port 8083)
   - `admin-service`: `./gradlew bootRun` (Port 8084)
   - `api-gateway`: `./gradlew bootRun` (Port 8686)
4. **Khởi chạy 3 ứng dụng Frontend**:
   ```bash
   cd frontend/users && npm install && npm run dev     # Port 5173
   cd frontend/artists && npm install && npm run dev   # Port 5172
   cd frontend/admin && npm install && npm run dev     # Port 5171
   ```

