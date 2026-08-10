// Runs before every build. If DATABASE_URL isn't set yet (fresh deploy,
// nobody's provisioned a database), this is a no-op and the build
// proceeds exactly as it always has — sign-in/admin just won't work
// until it's configured. Once DATABASE_URL exists, this keeps the
// database schema in sync with prisma/schema.prisma automatically, so
// nobody has to run a migration command by hand after a deploy.
const { execSync } = require("child_process");

if (!process.env.DATABASE_URL) {
  console.log("[sync-db] DATABASE_URL not set — skipping schema sync.");
  process.exit(0);
}

try {
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
} catch (err) {
  console.error("[sync-db] Schema sync failed:", err.message);
  process.exit(1);
}
