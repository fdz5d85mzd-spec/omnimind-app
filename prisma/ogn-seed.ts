import { seedOgn } from "../lib/ogn/seed";

seedOgn()
  .then(({ adminEmail, adminPassword }) => {
    console.log("✅ Seed complete!");
    console.log(`   Admin: ${adminEmail} / ${adminPassword}`);
    console.log("   (save this now -- it is not stored or shown again)");
    console.log("   Reading experience: /ogn");
    console.log("   Trigger the content pipeline: POST /ogn/api/pipeline (needs CRON_SECRET header)");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
