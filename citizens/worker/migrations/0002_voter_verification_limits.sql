CREATE TABLE IF NOT EXISTS voter_verification_limits (
  ip_hash TEXT PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  window_started_at INTEGER NOT NULL
);
