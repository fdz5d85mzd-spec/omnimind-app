// Runs before every build.
//
// PRODUCTION (VERCEL_ENV === "production"): required env vars are
// validated up front and the build FAILS LOUDLY if any are missing or
// obviously wrong — a production deploy must never silently succeed into
// a state where sign-in/signup are broken. This replaced an earlier
// version that treated a missing DATABASE_URL as a soft no-op in every
// environment, which let broken production deploys through unnoticed.
//
// Preview/development builds (no VERCEL_ENV, or VERCEL_ENV !== "production")
// keep the original permissive behavior: DATABASE_URL/OGN_DATABASE_URL are
// optional there, so a preview build with no database attached still
// succeeds — sign-in/admin just won't work until one is configured, exactly
// as before.
//
// Once DATABASE_URL exists, this keeps the database schema in sync with
// prisma/schema.prisma automatically via `prisma db push`, so nobody has to
// run a migration command by hand after a deploy. OGN_DATABASE_URL gets the
// same treatment for prisma/ogn-schema.prisma (OGN's separate database).
const { execSync } = require("child_process");

const isProduction = process.env.VERCEL_ENV === "production";

/** Presence/shape checks only — never logs a secret's actual value. */
function validateProductionEnv() {
  const missing = [];
  const invalid = [];

  if (!process.env.DATABASE_URL) {
    missing.push("DATABASE_URL");
  } else if (!/^postgres(ql)?:\/\//.test(process.env.DATABASE_URL)) {
    invalid.push("DATABASE_URL (must be a postgres:// or postgresql:// connection string)");
  }

  if (!process.env.NEXTAUTH_SECRET) {
    missing.push("NEXTAUTH_SECRET");
  } else if (process.env.NEXTAUTH_SECRET.length < 16) {
    invalid.push("NEXTAUTH_SECRET (too short to be a real random secret — generate with `openssl rand -base64 32`)");
  }

  if (!process.env.NEXTAUTH_URL) {
    missing.push("NEXTAUTH_URL");
  } else if (!/^https:\/\//.test(process.env.NEXTAUTH_URL)) {
    invalid.push("NEXTAUTH_URL (must start with https:// in production)");
  }

  if (missing.length === 0 && invalid.length === 0) return;

  console.error("[sync-db] PRODUCTION BUILD BLOCKED — required auth environment variables are missing or invalid.");
  if (missing.length) console.error(`[sync-db]   Missing: ${missing.join(", ")}`);
  if (invalid.length) console.error(`[sync-db]   Invalid: ${invalid.join(", ")}`);
  console.error("[sync-db] Set these in the Vercel project's Production environment variables and redeploy. " +
    "Sign-in/signup cannot function without them, so this build stops here instead of shipping a broken production app.");
  process.exit(1);
}

function sync(envVar, schema) {
  if (!process.env[envVar]) {
    // In production, validateProductionEnv() already exited before we get
    // here for DATABASE_URL — this branch is only reachable for
    // OGN_DATABASE_URL (stays optional even in production; OGN is a
    // separate subsystem with its own deploy lifecycle) or for any var in
    // a non-production build.
    console.log(`[sync-db] ${envVar} not set — skipping schema sync for ${schema}.`);
    return;
  }
  if (process.env.OMNIMIND_ALLOW_DB_PUSH !== "true") {
    console.log(`[sync-db] ${envVar} present; schema mutation disabled (set OMNIMIND_ALLOW_DB_PUSH=true only in an approved migration job).`);
    return;
  }
  execSync(`npx prisma db push --skip-generate --schema=${schema}`, { stdio: "inherit" });
}

try {
  if (isProduction) validateProductionEnv();
  sync("DATABASE_URL", "prisma/schema.prisma");
  sync("OGN_DATABASE_URL", "prisma/ogn-schema.prisma");
} catch (err) {
  console.error("[sync-db] Schema sync failed:", err.message);
  process.exit(1);
}
