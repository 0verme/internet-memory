-- Internet Memory Phase 0 schema. Public content is not a verdict about truth.
-- D1 enforces foreign keys by default; no PRAGMA toggle is needed here.

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE persons (
  id TEXT PRIMARY KEY NOT NULL,
  platform TEXT NOT NULL CHECK (platform = 'x'),
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  profile_url TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (platform, handle)
);

CREATE TABLE records (
  id TEXT PRIMARY KEY NOT NULL,
  person_id TEXT NOT NULL REFERENCES persons (id) ON DELETE RESTRICT,
  submitter_id TEXT NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
  content TEXT NOT NULL CHECK (length(trim(content)) BETWEEN 1 AND 500),
  source_url TEXT,
  occurred_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden'))
);

CREATE TABLE attachments (
  id TEXT PRIMARY KEY NOT NULL,
  record_id TEXT NOT NULL REFERENCES records (id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size INTEGER NOT NULL CHECK (size > 0 AND size <= 10485760),
  sha256 TEXT NOT NULL CHECK (length(sha256) = 64 AND sha256 NOT GLOB '*[^0-9a-f]*'),
  width INTEGER NOT NULL CHECK (width > 0),
  height INTEGER NOT NULL CHECK (height > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_records_person_status_time
  ON records (person_id, status, occurred_at DESC, created_at DESC);
CREATE INDEX idx_attachments_record_created ON attachments (record_id, created_at);
