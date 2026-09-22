-- AAKAM HRMS: notification recipient ownership.
-- Existing notification routes already use this relationship for direct
-- notifications; add it safely and retain broadcast rows as NULL recipients.
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON notifications(user_id);
