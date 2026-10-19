CREATE TABLE IF NOT EXISTS citizen_photos (
  citizen_id TEXT PRIMARY KEY NOT NULL,
  photo_ciphertext TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (citizen_id) REFERENCES citizens(id) ON DELETE CASCADE
);
