-- ============================================================
--  Barter App - PostgreSQL Database Schema
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────────
CREATE TABLE users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    avatar_url    TEXT,
    bio           TEXT,
    location      VARCHAR(100),
    rating        NUMERIC(3, 2) DEFAULT 0.00,
    total_reviews INT          DEFAULT 0,
    is_active     BOOLEAN      DEFAULT TRUE,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  CATEGORIES
-- ─────────────────────────────────────────────
CREATE TABLE categories (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(100) NOT NULL UNIQUE,
    slug       VARCHAR(100) NOT NULL UNIQUE,
    icon       VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default categories
INSERT INTO categories (name, slug, icon) VALUES
    ('Electronics',      'electronics',      '💻'),
    ('Clothing',         'clothing',         '👕'),
    ('Books & Media',    'books-media',      '📚'),
    ('Furniture',        'furniture',        '🪑'),
    ('Sports & Fitness', 'sports-fitness',   '🏋️'),
    ('Tools',            'tools',            '🔧'),
    ('Services',         'services',         '🛠️'),
    ('Food & Produce',   'food-produce',     '🥦'),
    ('Art & Crafts',     'art-crafts',       '🎨'),
    ('Other',            'other',            '📦');

-- ─────────────────────────────────────────────
--  LISTINGS
-- ─────────────────────────────────────────────
CREATE TYPE listing_status AS ENUM ('active', 'pending', 'traded', 'archived');
CREATE TYPE listing_condition AS ENUM ('new', 'like_new', 'good', 'fair', 'poor');

CREATE TABLE listings (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id   INT          REFERENCES categories(id) ON DELETE SET NULL,
    title         VARCHAR(150) NOT NULL,
    description   TEXT         NOT NULL,
    condition     listing_condition NOT NULL DEFAULT 'good',
    estimated_value NUMERIC(10, 2),          -- optional, in local currency
    looking_for   TEXT,                      -- what the owner wants in return
    location      VARCHAR(100),
    status        listing_status DEFAULT 'active',
    views         INT          DEFAULT 0,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  LISTING IMAGES
-- ─────────────────────────────────────────────
CREATE TABLE listing_images (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    url        TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INT     DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  TRADES
-- ─────────────────────────────────────────────
CREATE TYPE trade_status AS ENUM ('pending', 'accepted', 'declined', 'completed', 'cancelled');

CREATE TABLE trades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The listing being requested
    requested_listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    -- The listing offered in return
    offered_listing_id   UUID REFERENCES listings(id) ON DELETE SET NULL,
    -- Parties
    requester_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    owner_id            UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Optional cash top-up to balance the trade
    cash_adjustment     NUMERIC(10, 2) DEFAULT 0.00,
    message             TEXT,
    status              trade_status DEFAULT 'pending',
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  MESSAGES
-- ─────────────────────────────────────────────
CREATE TABLE messages (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    sender_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content    TEXT NOT NULL,
    is_read    BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
--  REVIEWS
-- ─────────────────────────────────────────────
CREATE TABLE reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (trade_id, reviewer_id)            -- one review per user per trade
);

-- ─────────────────────────────────────────────
--  WISHLISTS  (users save listings they like)
-- ─────────────────────────────────────────────
CREATE TABLE wishlists (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, listing_id)
);

-- ─────────────────────────────────────────────
--  INDEXES  (for performance)
-- ─────────────────────────────────────────────
CREATE INDEX idx_listings_user_id      ON listings(user_id);
CREATE INDEX idx_listings_category_id  ON listings(category_id);
CREATE INDEX idx_listings_status       ON listings(status);
CREATE INDEX idx_listings_created_at   ON listings(created_at DESC);
CREATE INDEX idx_trades_requester_id   ON trades(requester_id);
CREATE INDEX idx_trades_owner_id       ON trades(owner_id);
CREATE INDEX idx_trades_status         ON trades(status);
CREATE INDEX idx_messages_trade_id     ON messages(trade_id);
CREATE INDEX idx_messages_sender_id    ON messages(sender_id);
CREATE INDEX idx_reviews_reviewee_id   ON reviews(reviewee_id);

-- ─────────────────────────────────────────────
--  TRIGGERS  (auto-update updated_at)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trades_updated_at
    BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
--  TRIGGER: keep user rating up-to-date
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET
        rating        = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
        total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
    WHERE id = NEW.reviewee_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_user_rating
    AFTER INSERT OR UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_user_rating();
