-- ============================================================
--  포교사찰 홈페이지 · PostgreSQL 스키마 (1차)
--  실행: psql "$DATABASE_URL" -f db/schema.sql
--  주: visibility 컬럼을 미리 두어 2차(회원 전용) 전환에 대비
-- ============================================================

-- 공개 범위 타입 (1차는 'public'만 사용, 2차에서 'member' 활용)
DO $$ BEGIN
  CREATE TYPE visibility AS ENUM ('public', 'member');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 운영자 계정 (1차: 소수 관리자만. 회원 시스템은 2차)
CREATE TABLE IF NOT EXISTS admin_users (
  id            BIGSERIAL PRIMARY KEY,
  login_id      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'operator',  -- operator | superadmin
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 공지 / 사찰 소식
CREATE TABLE IF NOT EXISTS notices (
  id          BIGSERIAL PRIMARY KEY,
  category    TEXT NOT NULL DEFAULT 'news',        -- notice | news
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  cover_url   TEXT,                                -- 대표 이미지(S3/로컬)
  is_pinned   BOOLEAN NOT NULL DEFAULT false,
  visibility  visibility NOT NULL DEFAULT 'public',
  published   BOOLEAN NOT NULL DEFAULT true,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notices_pub ON notices (published, published_at DESC);

-- 법회 / 행사 (캘린더)
CREATE TABLE IF NOT EXISTS events (
  id          BIGSERIAL PRIMARY KEY,
  kind        TEXT NOT NULL DEFAULT 'regular',     -- regular(정기법회) | event(행사)
  title       TEXT NOT NULL,
  when_text   TEXT,                                -- "일요일 10:00" / "음력 7.15" 등 표시용
  starts_at   TIMESTAMPTZ,                         -- 실제 일시(있을 때)
  recurrence  TEXT,                                -- 반복 규칙(선택)
  description TEXT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 가람 중창기 (연대기)
CREATE TABLE IF NOT EXISTS jungchang (
  id          BIGSERIAL PRIMARY KEY,
  period      TEXT NOT NULL,                        -- "1925 · 창건"
  title       TEXT NOT NULL,
  body        TEXT,
  photos      JSONB NOT NULL DEFAULT '[]',          -- [{url, caption, era}]
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 갤러리
CREATE TABLE IF NOT EXISTS gallery_albums (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  visibility  visibility NOT NULL DEFAULT 'public',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS gallery_photos (
  id          BIGSERIAL PRIMARY KEY,
  album_id    BIGINT REFERENCES gallery_albums(id) ON DELETE CASCADE,
  image_url   TEXT NOT NULL,
  caption     TEXT,
  sort_order  INT NOT NULL DEFAULT 0
);

-- 법문 (1차 경량 · 선택)
CREATE TABLE IF NOT EXISTS dharma_talks (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT,
  video_url   TEXT,                                -- YouTube 등 임베드
  visibility  visibility NOT NULL DEFAULT 'public',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 행사 첨부파일 (안내문·신청서 등)
CREATE TABLE IF NOT EXISTS event_attachments (
  id          BIGSERIAL PRIMARY KEY,
  event_id    BIGINT REFERENCES events(id) ON DELETE CASCADE,
  file_url    TEXT NOT NULL,
  filename    TEXT NOT NULL,
  mime        TEXT,
  size        INT,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_event_attach ON event_attachments (event_id);

-- ============================================================
--  회원·커뮤니티 (신도 회원·게시판·Q&A)
-- ============================================================

-- 신도 회원 (종무소 승인제)
CREATE TABLE IF NOT EXISTS members (
  id             BIGSERIAL PRIMARY KEY,
  login_id       TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  name           TEXT NOT NULL,               -- 성명(실명, 비공개)
  nickname       TEXT,                        -- 닉네임(게시판 공개 표시명)
  birth_date     DATE,
  gender         TEXT,                               -- male | female | other
  phone          TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  status         TEXT NOT NULL DEFAULT 'pending',    -- pending | approved | rejected | suspended
  agreed_terms   BOOLEAN NOT NULL DEFAULT false,
  agreed_privacy BOOLEAN NOT NULL DEFAULT false,
  agreed_at      TIMESTAMPTZ,
  approved_at    TIMESTAMPTZ,
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 게시판 (자유/신행수기) — 회원 전용 글쓰기
CREATE TABLE IF NOT EXISTS posts (
  id               BIGSERIAL PRIMARY KEY,
  board            TEXT NOT NULL DEFAULT 'free',     -- free | story
  title            TEXT NOT NULL,
  body             TEXT NOT NULL,
  author_member_id BIGINT REFERENCES members(id) ON DELETE SET NULL,
  author_name      TEXT NOT NULL,
  published        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_posts_board ON posts (board, created_at DESC);

-- 묻고답하기(Q&A) — 비회원도 휴대폰 인증 후 작성, 비밀글, 관리자 답변
CREATE TABLE IF NOT EXISTS questions (
  id          BIGSERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  author_name TEXT NOT NULL,
  phone       TEXT,
  is_secret   BOOLEAN NOT NULL DEFAULT false,
  secret_hash TEXT,                                  -- 비밀글 열람 코드(해시)
  answer      TEXT,                                  -- 관리자 답변
  answered_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions (created_at DESC);
