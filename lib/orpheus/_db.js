import postgres from 'postgres';

// Orpheus keeps its transfer records in its existing Neon database so that
// moving the module into OmniMind does not orphan live links, files, or paid
// entitlements. It can intentionally fall back to the main app database for
// fresh/self-hosted installs.
const sql = postgres(process.env.ORPHEUS_DATABASE_URL || process.env.DATABASE_URL, {
  ssl: 'require',
  max: 3,
  idle_timeout: 20,
  connect_timeout: 15,
});

let schemaPromise;

export function ensureSchema() {
  if (!schemaPromise) {
    schemaPromise = sql.begin(async (tx) => {
      await tx`CREATE TABLE IF NOT EXISTS transfers (
        id UUID PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        upload_key_hash TEXT NOT NULL,
        mode TEXT NOT NULL CHECK (mode IN ('email', 'link')),
        recipient_email TEXT,
        sender_email TEXT,
        message TEXT,
        status TEXT NOT NULL DEFAULT 'uploading',
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await tx`CREATE TABLE IF NOT EXISTS transfer_files (
        id UUID PRIMARY KEY,
        transfer_id UUID NOT NULL REFERENCES transfers(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        size BIGINT NOT NULL,
        content_type TEXT,
        pathname TEXT UNIQUE NOT NULL,
        blob_url TEXT,
        uploaded_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await tx`CREATE INDEX IF NOT EXISTS transfers_code_idx ON transfers(code)`;
      await tx`CREATE INDEX IF NOT EXISTS transfers_expiry_idx ON transfers(expires_at)`;
      await tx`ALTER TABLE transfers ADD COLUMN IF NOT EXISTS creator_fingerprint TEXT`;
      await tx`CREATE INDEX IF NOT EXISTS transfers_fingerprint_idx ON transfers(creator_fingerprint)`;
      await tx`CREATE INDEX IF NOT EXISTS transfer_files_transfer_idx ON transfer_files(transfer_id)`;
      await tx`ALTER TABLE transfer_files ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0`;
      await tx`ALTER TABLE transfer_files ADD COLUMN IF NOT EXISTS storage_provider TEXT NOT NULL DEFAULT 'blob'`;
      await tx`ALTER TABLE transfer_files ADD COLUMN IF NOT EXISTS r2_upload_id TEXT`;
      await tx`CREATE TABLE IF NOT EXISTS entitlements (
        id UUID PRIMARY KEY,
        access_token_hash TEXT UNIQUE,
        kind TEXT NOT NULL CHECK (kind IN ('subscription', 'one_time')),
        plan TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        max_transfer_bytes BIGINT NOT NULL,
        monthly_quota_bytes BIGINT NOT NULL,
        used_bytes BIGINT NOT NULL DEFAULT 0,
        current_period_end TIMESTAMPTZ,
        consumed_at TIMESTAMPTZ,
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT UNIQUE,
        stripe_checkout_session_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`;
      await tx`CREATE INDEX IF NOT EXISTS entitlements_token_idx ON entitlements(access_token_hash)`;
    });
  }
  return schemaPromise;
}

export { sql };
