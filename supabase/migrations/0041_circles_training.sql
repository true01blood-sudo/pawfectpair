-- ──────────────────────────────────────────
-- 0041: Circles + Training Marketplace
-- ──────────────────────────────────────────

-- CIRCLES
CREATE TABLE IF NOT EXISTS circles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'club' CHECK (type IN ('club', 'rescue', 'events')),
  species TEXT NOT NULL DEFAULT 'general' CHECK (species IN ('general', 'caine', 'pisica', 'altele')),
  city TEXT,
  photo_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (circle_id, user_id)
);

CREATE TABLE IF NOT EXISTS circle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id UUID REFERENCES circles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMPTZ NOT NULL,
  location TEXT,
  max_attendees INT,
  attendee_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Circles
ALTER TABLE circles ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public circles are viewable by all" ON circles;
CREATE POLICY "Public circles are viewable by all" ON circles
  FOR SELECT USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can create circles" ON circles;
CREATE POLICY "Authenticated users can create circles" ON circles
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Circle admin can update their circle" ON circles;
CREATE POLICY "Circle admin can update their circle" ON circles
  FOR UPDATE USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Circle members viewable by all" ON circle_members;
CREATE POLICY "Circle members viewable by all" ON circle_members
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join circles" ON circle_members;
CREATE POLICY "Users can join circles" ON circle_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can leave circles" ON circle_members;
CREATE POLICY "Users can leave circles" ON circle_members
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Circle events viewable by all" ON circle_events;
CREATE POLICY "Circle events viewable by all" ON circle_events
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Circle admins can add events" ON circle_events;
CREATE POLICY "Circle admins can add events" ON circle_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = circle_events.circle_id
        AND user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- TRAINING
CREATE TABLE IF NOT EXISTS trainers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  display_name TEXT NOT NULL,
  bio TEXT,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  city TEXT,
  photo_url TEXT,
  price_per_session_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  rating NUMERIC(3,2) NOT NULL DEFAULT 5.00,
  session_count INT NOT NULL DEFAULT 0,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID REFERENCES trainers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  level TEXT NOT NULL DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  species TEXT NOT NULL DEFAULT 'general',
  duration_weeks INT NOT NULL DEFAULT 4,
  sessions_per_week INT NOT NULL DEFAULT 2,
  price_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  includes TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS training_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID REFERENCES training_plans(id) ON DELETE SET NULL,
  trainer_id UUID REFERENCES trainers(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  notes TEXT,
  behavior_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Training
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Trainers viewable by all" ON trainers;
CREATE POLICY "Trainers viewable by all" ON trainers FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage trainers" ON trainers;
CREATE POLICY "Admins can manage trainers" ON trainers FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

DROP POLICY IF EXISTS "Training plans viewable by all" ON training_plans;
CREATE POLICY "Training plans viewable by all" ON training_plans FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Trainers manage their plans" ON training_plans;
CREATE POLICY "Trainers manage their plans" ON training_plans FOR ALL USING (
  EXISTS (SELECT 1 FROM trainers WHERE id = training_plans.trainer_id AND profile_id = auth.uid())
);

DROP POLICY IF EXISTS "Buyers view own bookings" ON training_bookings;
CREATE POLICY "Buyers view own bookings" ON training_bookings FOR SELECT USING (buyer_id = auth.uid());
DROP POLICY IF EXISTS "Authenticated users can book" ON training_bookings;
CREATE POLICY "Authenticated users can book" ON training_bookings FOR INSERT WITH CHECK (auth.uid() = buyer_id);
DROP POLICY IF EXISTS "Buyers can cancel" ON training_bookings;
CREATE POLICY "Buyers can cancel" ON training_bookings FOR UPDATE USING (buyer_id = auth.uid());

-- Seed demo circles
INSERT INTO circles (name, description, type, species, city, member_count) VALUES
  ('Clubul Labrador România', 'Comunitatea iubitorilor de Labrador Retriever din România.', 'club', 'caine', 'București', 284),
  ('Rescue Câini București', 'Voluntari dedicați salvării și adopției câinilor fără stăpân.', 'rescue', 'caine', 'București', 156),
  ('Pisici Persane Fan Club', 'Pasionații de pisici persane și exotice din România.', 'club', 'pisica', 'Cluj-Napoca', 97),
  ('Dog Agility Romania', 'Antrenamente și competiții de agility pentru câini și stăpânii lor.', 'events', 'caine', 'Timișoara', 203),
  ('Adopții Pisici Cluj', 'Rețea de voluntari pentru adopția pisicilor abandonate.', 'rescue', 'pisica', 'Cluj-Napoca', 88),
  ('PetFest Romania', 'Organizatori ai evenimentelor PetFest din toată țara.', 'events', 'general', 'București', 412)
ON CONFLICT DO NOTHING;

-- Seed demo trainers
INSERT INTO trainers (display_name, bio, specializations, city, price_per_session_cents, currency, rating, session_count, is_verified) VALUES
  ('Andrei Dumitrescu', 'Antrenor certificat cu 8 ani experiență în dresaj și comportament canin.', ARRAY['dresaj', 'comportament', 'agility'], 'București', 25000, 'RON', 4.95, 312, true),
  ('Maria Constantin', 'Specialist în socializare cățeluși și terapie comportamentală felină.', ARRAY['socializare', 'comportament', 'pisici'], 'Cluj-Napoca', 20000, 'RON', 4.87, 198, true),
  ('Radu Ionescu', 'Antrenor competitional, campion național agility 2022.', ARRAY['agility', 'obedience', 'dresaj avansat'], 'Timișoara', 30000, 'RON', 4.92, 445, true)
ON CONFLICT DO NOTHING;
