-- ============================================================
--  Barter App — Schema Additions (run after schema.sql)
-- ============================================================

-- ─────────────────────────────────────────────
--  NOTIFICATIONS
-- ─────────────────────────────────────────────
CREATE TYPE notification_type AS ENUM (
  'trade_received',
  'trade_accepted',
  'trade_declined',
  'trade_completed',
  'new_message',
  'review_received',
  'wishlist_traded'
);

CREATE TABLE notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    message    TEXT NOT NULL,
    link_id    UUID,                        -- related trade/listing/review ID
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id  ON notifications(user_id);
CREATE INDEX idx_notifications_is_read  ON notifications(user_id, is_read);

-- ─────────────────────────────────────────────
--  AUTO-NOTIFY on new trade
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_trade()
RETURNS TRIGGER AS $$
DECLARE
  req_title TEXT;
BEGIN
  SELECT title INTO req_title FROM listings WHERE id = NEW.requested_listing_id;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (user_id, type, message, link_id)
    VALUES (
      NEW.owner_id,
      'trade_received',
      'You have a new trade offer for "' || req_title || '"',
      NEW.id
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    IF NEW.status = 'accepted' THEN
      INSERT INTO notifications (user_id, type, message, link_id)
      VALUES (NEW.requester_id, 'trade_accepted', 'Your trade offer was accepted!', NEW.id);
    ELSIF NEW.status = 'declined' THEN
      INSERT INTO notifications (user_id, type, message, link_id)
      VALUES (NEW.requester_id, 'trade_declined', 'Your trade offer was declined.', NEW.id);
    ELSIF NEW.status = 'completed' THEN
      INSERT INTO notifications (user_id, type, message, link_id)
      VALUES (NEW.owner_id,     'trade_completed', 'Trade completed! Don''t forget to leave a review.', NEW.id);
      INSERT INTO notifications (user_id, type, message, link_id)
      VALUES (NEW.requester_id, 'trade_completed', 'Trade completed! Don''t forget to leave a review.', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_trade
    AFTER INSERT OR UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION notify_on_trade();

-- ─────────────────────────────────────────────
--  AUTO-NOTIFY on new review
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION notify_on_review()
RETURNS TRIGGER AS $$
DECLARE reviewer_name TEXT;
BEGIN
  SELECT username INTO reviewer_name FROM users WHERE id = NEW.reviewer_id;
  INSERT INTO notifications (user_id, type, message, link_id)
  VALUES (NEW.reviewee_id, 'review_received', reviewer_name || ' left you a review!', NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_notify_review
    AFTER INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION notify_on_review();
