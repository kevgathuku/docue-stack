CREATE TABLE documents(
  id SERIAL PRIMARY KEY,
  title TEXT UNIQUE NOT NULL,
  content_md TEXT NOT NULL DEFAULT '',
  content_html TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'published',
  owner_id INTEGER NOT NULL REFERENCES users(id),
  share_token TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
