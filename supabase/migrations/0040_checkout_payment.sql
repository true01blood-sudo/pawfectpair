-- ============================================================
-- 0040_checkout_payment.sql
-- Checkout complet: adresă livrare, câmpuri plată, payment config
-- ============================================================

-- 1) Câmpuri noi pe orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_name    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_phone   TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city    TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_county  TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method   TEXT NOT NULL DEFAULT 'cod'
  CHECK (payment_method IN ('cod', 'card', 'bank_transfer'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_status   TEXT NOT NULL DEFAULT 'pending'
  CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_ref      TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at       TIMESTAMPTZ;

-- 2) order_items: cantitate per item trebuie să fie >= 1 (poate exista deja)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_qty_positive'
  ) THEN
    ALTER TABLE order_items
      ADD CONSTRAINT order_items_qty_positive CHECK (quantity >= 1);
  END IF;
END $$;

-- 3) Tabel configurare procesator de plăți (admin)
CREATE TABLE IF NOT EXISTS payment_config (
  id           TEXT PRIMARY KEY DEFAULT 'default',
  provider     TEXT NOT NULL DEFAULT 'none'
    CHECK (provider IN ('none', 'stripe', 'payu', 'netopia', 'revolut')),
  public_key   TEXT,
  test_mode    BOOLEAN NOT NULL DEFAULT TRUE,
  cod_enabled  BOOLEAN NOT NULL DEFAULT TRUE,
  bank_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  bank_iban    TEXT,
  bank_name    TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE payment_config ENABLE ROW LEVEL SECURITY;

-- Doar adminul vede și modifică configurarea
DROP POLICY IF EXISTS "Admin manages payment config" ON payment_config;
CREATE POLICY "Admin manages payment config"
  ON payment_config FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Inserează rând default dacă nu există
INSERT INTO payment_config (id) VALUES ('default') ON CONFLICT DO NOTHING;

-- 4) Index orders
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
