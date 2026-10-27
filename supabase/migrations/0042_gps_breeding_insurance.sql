-- ──────────────────────────────────────────
-- 0042: GPS Tracker + Breeding + Insurance
-- ──────────────────────────────────────────

-- GPS / PetGuardian
CREATE TABLE IF NOT EXISTS pet_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_meters INT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'mobile' CHECK (source IN ('mobile', 'tracker', 'manual'))
);

CREATE TABLE IF NOT EXISTS lost_pet_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES pets(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  last_seen_location TEXT,
  last_seen_lat DOUBLE PRECISION,
  last_seen_lng DOUBLE PRECISION,
  last_seen_at TIMESTAMPTZ,
  contact_phone TEXT,
  reward_info TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'found', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS GPS
ALTER TABLE pet_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lost_pet_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pet owners view their locations" ON pet_locations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM pets WHERE id = pet_locations.pet_id AND owner_id = auth.uid())
  );
CREATE POLICY "Pet owners insert locations" ON pet_locations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM pets WHERE id = pet_locations.pet_id AND owner_id = auth.uid())
  );

CREATE POLICY "Lost pet alerts viewable by all" ON lost_pet_alerts FOR SELECT USING (true);
CREATE POLICY "Owners manage their alerts" ON lost_pet_alerts
  FOR ALL USING (owner_id = auth.uid());


-- BREEDING
CREATE TABLE IF NOT EXISTS breeding_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  species TEXT NOT NULL DEFAULT 'caine',
  breed TEXT,
  gender TEXT CHECK (gender IN ('mascul', 'femela')),
  age_years INT,
  pedigree_info TEXT,
  health_tests TEXT[],
  price_info TEXT,
  city TEXT,
  photo_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Breeding
ALTER TABLE breeding_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Breeding listings viewable by all" ON breeding_listings
  FOR SELECT USING (status = 'active');
CREATE POLICY "Owners manage their listings" ON breeding_listings
  FOR ALL USING (owner_id = auth.uid());


-- INSURANCE
CREATE TABLE IF NOT EXISTS insurance_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_id UUID REFERENCES pets(id) ON DELETE SET NULL,
  provider_name TEXT NOT NULL,
  policy_number TEXT,
  plan_name TEXT,
  coverage_type TEXT NOT NULL DEFAULT 'basic' CHECK (coverage_type IN ('basic', 'comprehensive', 'premium')),
  annual_premium_cents INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'RON',
  deductible_cents INT NOT NULL DEFAULT 0,
  coverage_limit_cents INT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  documents_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES insurance_policies(id) ON DELETE CASCADE,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'processing', 'approved', 'rejected', 'paid')),
  incident_date DATE,
  documents_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Insurance
ALTER TABLE insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE insurance_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners view their policies" ON insurance_policies FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners manage their policies" ON insurance_policies FOR ALL USING (owner_id = auth.uid());

CREATE POLICY "Owners view their claims" ON insurance_claims FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Owners manage their claims" ON insurance_claims FOR ALL USING (owner_id = auth.uid());

-- Seed breeding demo
INSERT INTO breeding_listings (owner_id, title, description, species, breed, gender, age_years, health_tests, price_info, city, status)
SELECT
  (SELECT id FROM auth.users LIMIT 1),
  'Golden Retriever mascul de reproductie',
  'Mascul Golden Retriever cu pedigree FCI, testat genetic. Stăpân responsabil, consultații disponibile.',
  'caine', 'Golden Retriever', 'mascul', 3,
  ARRAY['ED', 'HD', 'PRCD-PRA'],
  'La vedere, contact pentru detalii',
  'Cluj-Napoca', 'active'
WHERE EXISTS (SELECT 1 FROM auth.users LIMIT 1)
ON CONFLICT DO NOTHING;
