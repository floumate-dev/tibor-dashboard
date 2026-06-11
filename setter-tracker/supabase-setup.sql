-- ═══════════════════════════════════════
-- SETTER TRACKER - Supabase Setup
-- Paste this into Supabase SQL Editor
-- ═══════════════════════════════════════

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'setter' CHECK (role IN ('setter', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Daily entries table
CREATE TABLE IF NOT EXISTS daily_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_name TEXT NOT NULL,
    date DATE NOT NULL,
    outbound_new INT DEFAULT 0,
    outbound_votes INT DEFAULT 0,
    follow_ups INT DEFAULT 0,
    quiz_leads INT DEFAULT 0,
    conversations INT DEFAULT 0,
    booked_calls INT DEFAULT 0,
    conversion_rate INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_name, date)
);

-- 3. Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_entries_user_date ON daily_entries (user_name, date);

-- 4. Insert default users (PIN codes - change these!)
INSERT INTO users (name, pin, role) VALUES
    ('Lazar', '1111', 'setter'),
    ('Ana', '2222', 'setter'),
    ('Nikola', '0000', 'admin')
ON CONFLICT (name) DO NOTHING;

-- 5. Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
CREATE POLICY "Anyone can read users" ON users FOR SELECT USING (true);
CREATE POLICY "Anyone can read entries" ON daily_entries FOR SELECT USING (true);
CREATE POLICY "Anyone can insert entries" ON daily_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update entries" ON daily_entries FOR UPDATE USING (true);

-- ✅ Done! Verify:
SELECT name, role FROM users ORDER BY name;
