-- Add ban and verification flags to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for quick banned-user lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = TRUE;

-- Add optional product fields (description, external link)
ALTER TABLE products ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
