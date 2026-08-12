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

// A schema-sync failure (most commonly: prisma refusing a push that would
// drop a table/column with live data it doesn't recognize) must not take
// the whole deploy down -- the code being deployed rarely depends on that
// particular sync succeeding, and the DB tables in question keep their
// data untouched either way. Failures are logged loudly so they're never
// silently missed, but the build proceeds.
function sync(envVar, schema) {
  if (!process.env[envVar]) {
    console.log(`[sync-db] ${envVar} not set — skipping schema sync for ${schema}.`);
    return;
  }
  try {
    execSync(`npx prisma db push --skip-generate --schema=${schema}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`[sync-db] Schema sync failed for ${schema} -- continuing build without it. Fix by hand: npx prisma db push --schema=${schema}`);
  }
}

sync("DATABASE_URL", "prisma/schema.prisma");
sync("OGN_DATABASE_URL", "prisma/ogn-schema.prisma");
