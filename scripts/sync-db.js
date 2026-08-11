// Runs before every build. If DATABASE_URL isn't set yet (fresh deploy,
// nobody's provisioned a database), this is a no-op and the build
// proceeds exactly as it always has — sign-in/admin just won't work
// until it's configured. Once DATABASE_URL exists, this keeps the
// database schema in sync with prisma/schema.prisma automatically, so
// nobody has to run a migration command by hand after a deploy.
//
// OGN_DATABASE_URL gets the same treatment for prisma/ogn-schema.prisma
// (OGN's separate database) -- same "skip until configured" no-op.
const { execSync } = require("child_process");

function sync(envVar, schema) {
  if (!process.env[envVar]) {
    console.log(`[sync-db] ${envVar} not set — skipping schema sync for ${schema}.`);
    return;
  }
  execSync(`npx prisma db push --skip-generate --schema=${schema}`, { stdio: "inherit" });
}

try {
  sync("DATABASE_URL", "prisma/schema.prisma");
  sync("OGN_DATABASE_URL", "prisma/ogn-schema.prisma");
} catch (err) {
  console.error("[sync-db] Schema sync failed:", err.message);
  process.exit(1);
}
