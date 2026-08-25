-- Create Schemas
CREATE SCHEMA IF NOT EXISTS mc_music_users_schema;
CREATE SCHEMA IF NOT EXISTS mc_music_artists_schema;
CREATE SCHEMA IF NOT EXISTS mc_music_admin_schema;
CREATE SCHEMA IF NOT EXISTS mc_music_catalog_schema;

-- ==========================================
-- 1. mc_music_users_schema
-- ==========================================
SET search_path TO mc_music_users_schema;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS playlist_songs (
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    cover_image VARCHAR(500),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id)
);

CREATE TABLE IF NOT EXISTS favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    cover_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, song_id)
);

CREATE TABLE IF NOT EXISTS follows (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, artist_id)
);

CREATE TABLE IF NOT EXISTS play_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    song_id UUID NOT NULL,
    song_title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    duration_listened INT DEFAULT 0
);

-- ==========================================
-- 2. mc_music_artists_schema
-- ==========================================
SET search_path TO mc_music_artists_schema;

CREATE TABLE IF NOT EXISTS artists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    stage_name VARCHAR(255) NOT NULL,
    biography TEXT,
    avatar_url VARCHAR(500),
    cover_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. mc_music_admin_schema
-- ==========================================
SET search_path TO mc_music_admin_schema;

CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. mc_music_catalog_schema
-- ==========================================
SET search_path TO mc_music_catalog_schema;

CREATE TABLE IF NOT EXISTS genres (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    cover_image VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    album_type VARCHAR(20) DEFAULT 'ALBUM',
    total_tracks INT DEFAULT 0,
    description TEXT,
    cover_image VARCHAR(500),
    release_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'TAKEDOWN')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL,
    album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    track_number INT,
    duration_seconds INT NOT NULL,
    audio_url VARCHAR(1000) NOT NULL,
    audio_public_id VARCHAR(255),
    cover_image VARCHAR(500),
    explicit BOOLEAN DEFAULT FALSE,
    play_count INT DEFAULT 0,
    like_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'TAKEDOWN')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS song_artists (
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    artist_id UUID NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    PRIMARY KEY (song_id, artist_id)
);

CREATE TABLE IF NOT EXISTS song_genres (
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    genre_id UUID NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (song_id, genre_id)
);

CREATE TABLE IF NOT EXISTS lyrics (
    song_id UUID PRIMARY KEY REFERENCES songs(id) ON DELETE CASCADE,
    content TEXT,
    synced_content TEXT,
    language VARCHAR(10)
);

CREATE TABLE IF NOT EXISTS system_playlists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover_image VARCHAR(500),
    created_by_admin_id UUID NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS system_playlist_songs (
    playlist_id UUID NOT NULL REFERENCES system_playlists(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
    position_order INT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (playlist_id, song_id)
);

-- ==========================================
-- 5. Seed Data
-- ==========================================
SET search_path TO mc_music_catalog_schema;

INSERT INTO genres (name, cover_image) VALUES
    ('Pop', 'https://res.cloudinary.com/demo/image/upload/v1/genres/pop.jpg'),
    ('Ballad', 'https://res.cloudinary.com/demo/image/upload/v1/genres/ballad.jpg'),
    ('R&B', 'https://res.cloudinary.com/demo/image/upload/v1/genres/rb.jpg'),
    ('Hip-Hop', 'https://res.cloudinary.com/demo/image/upload/v1/genres/hiphop.jpg'),
    ('Rap', 'https://res.cloudinary.com/demo/image/upload/v1/genres/rap.jpg'),
    ('EDM', 'https://res.cloudinary.com/demo/image/upload/v1/genres/edm.jpg'),
    ('Lofi', 'https://res.cloudinary.com/demo/image/upload/v1/genres/lofi.jpg'),
    ('Jazz', 'https://res.cloudinary.com/demo/image/upload/v1/genres/jazz.jpg'),
    ('Indie', 'https://res.cloudinary.com/demo/image/upload/v1/genres/indie.jpg'),
    ('Acoustic', 'https://res.cloudinary.com/demo/image/upload/v1/genres/acoustic.jpg'),
    ('K-Pop', 'https://res.cloudinary.com/demo/image/upload/v1/genres/kpop.jpg'),
    ('US-UK', 'https://res.cloudinary.com/demo/image/upload/v1/genres/usuk.jpg')
ON CONFLICT (name) DO NOTHING;

-- Reset search_path to default
SET search_path TO public;

-- ==========================================
-- 6. Seed Data for Admin
-- ==========================================
SET search_path TO mc_music_admin_schema;

INSERT INTO admins (email, password_hash, full_name, role) 
VALUES ('admin@mcmusic.com', '<THAY_THE_BANG_CHUOI_BCRYPT_SINH_RA_TU_GenerateHashTest>', 'System Admin', 'SUPER_ADMIN')
ON CONFLICT DO NOTHING;

-- Reset search_path to default
SET search_path TO public;
