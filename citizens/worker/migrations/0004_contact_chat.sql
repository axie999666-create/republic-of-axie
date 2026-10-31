CREATE TABLE IF NOT EXISTS contact_conversations (
  id TEXT PRIMARY KEY,
  visitor_token_hash TEXT NOT NULL,
  visitor_name_ciphertext TEXT,
  status TEXT NOT NULL DEFAULT 'awaiting_admin'
    CHECK (status IN ('awaiting_admin', 'awaiting_visitor', 'closed')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_conversations_updated
  ON contact_conversations(updated_at DESC);

CREATE TABLE IF NOT EXISTS contact_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('visitor', 'admin')),
  body_ciphertext TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (conversation_id) REFERENCES contact_conversations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_conversation_created
  ON contact_messages(conversation_id, created_at);

CREATE TABLE IF NOT EXISTS contact_message_limits (
  ip_hash TEXT PRIMARY KEY,
  event_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
