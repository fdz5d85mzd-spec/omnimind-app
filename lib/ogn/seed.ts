import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "./db";

// Shared by prisma/ogn-seed.ts (CLI) and app/ogn/api/seed/route.ts (admin
// button) -- upsert-based throughout, so running it again is a no-op except
// for the admin password, which rotates to a fresh random value each time.
export async function seedOgn(): Promise<{ adminEmail: string; adminPassword: string }> {
  const adminPasswordPlain = crypto.randomBytes(12).toString("base64url");
  const adminPassword = await bcrypt.hash(adminPasswordPlain, 12);
  await prisma.user.upsert({
    where: { email: "admin@ogn.app" },
    update: { password: adminPassword },
    create: { email: "admin@ogn.app", name: "OGN Admin", password: adminPassword, role: "admin" },
  });

  const categories = [
    { name: "Science & Tech", slug: "science-tech", color: "#3b82f6", icon: "🔬", description: "Breakthroughs, discoveries, and innovations shaping a better future." },
    { name: "Environment", slug: "environment", color: "#22c55e", icon: "🌍", description: "Good news for our planet — conservation wins, climate progress, nature recovery." },
    { name: "Humanity", slug: "humanity", color: "#f59e0b", icon: "🤝", description: "Stories of kindness, compassion, and people making a difference." },
    { name: "Health", slug: "health", color: "#ec4899", icon: "⚕️", description: "Medical breakthroughs, wellness, and health wins from around the world." },
    { name: "Education", slug: "education", color: "#8b5cf6", icon: "📚", description: "Learning milestones, scholarship stories, and educational innovation." },
    { name: "Sports", slug: "sports", color: "#f97316", icon: "🏆", description: "Sportsmanship, victories, and athletic achievements worth celebrating." },
    { name: "Business", slug: "business", color: "#14b8a6", icon: "💼", description: "Ethical business, social enterprise, and economic good news." },
    { name: "World", slug: "world", color: "#6366f1", icon: "🌐", description: "Positive developments from around the globe." },
  ];
  for (const cat of categories) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }

  const sources = [
    { name: "Good News Network", url: "https://www.goodnewsnetwork.org", feedUrl: "https://www.goodnewsnetwork.org/feed/", credibilityRating: 0.85, language: "en", country: "US" },
    { name: "Positive News", url: "https://www.positive.news", feedUrl: "https://www.positive.news/feed/", credibilityRating: 0.82, language: "en", country: "UK" },
    { name: "Reason to be Cheerful", url: "https://reasonstobecheerful.world", feedUrl: "https://reasonstobecheerful.world/feed/", credibilityRating: 0.78, language: "en", country: "US" },
    { name: "Upworthy", url: "https://www.upworthy.com", feedUrl: "https://www.upworthy.com/feeds/feed.rss", credibilityRating: 0.72, language: "en", country: "US" },
    { name: "The Guardian — Good News", url: "https://www.theguardian.com", feedUrl: "https://www.theguardian.com/lifeandstyle/good-news/rss", credibilityRating: 0.90, language: "en", country: "UK" },
    { name: "BBC News — World", url: "https://www.bbc.com", feedUrl: "https://feeds.bbci.co.uk/news/world/rss.xml", credibilityRating: 0.92, language: "en", country: "UK" },
    { name: "NASA Breaking News", url: "https://www.nasa.gov", feedUrl: "https://www.nasa.gov/rss/dyn/breaking_news.rss", credibilityRating: 0.95, language: "en", country: "US" },
    { name: "EurekAlert", url: "https://www.eurekalert.org", feedUrl: "https://www.eurekalert.org/rss/technology_engineering.xml", credibilityRating: 0.88, language: "en", country: "US" },
  ];
  for (const source of sources) {
    await prisma.source.upsert({ where: { name: source.name }, update: {}, create: source });
  }

  const sampleArticles = [
    {
      title: "Scientists Develop Revolutionary Solar Panel That Works at Night",
      slug: "scientists-develop-solar-panel-that-works-at-night",
      summary: "Researchers at Stanford have created a photovoltaic cell that generates electricity from radiative cooling, producing power even after sunset.",
      content: "A team of researchers at Stanford University has developed a groundbreaking solar panel technology that can generate electricity even at night. The system works by capturing infrared light radiated from the Earth's surface as it cools, using a process called radiative cooling.",
      sourceUrl: "https://www.goodnewsnetwork.org",
      sourceName: "Good News Network",
      imageUrl: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800",
      categorySlug: "science-tech",
      sentimentScore: 0.85,
      credibilityScore: 0.90,
      isFeatured: true,
    },
    {
      title: "Global Reforestation Effort Plants 100 Million Trees in Single Day",
      slug: "global-reforestation-effort-100-million-trees",
      summary: "A coordinated effort across 25 countries resulted in 100 million trees being planted in 24 hours, setting a new world record.",
      content: "In an extraordinary display of global cooperation, volunteers across 25 countries planted 100 million trees in a single 24-hour period, smashing the previous world record.",
      sourceUrl: "https://www.positive.news",
      sourceName: "Positive News",
      imageUrl: "https://images.unsplash.com/photo-1448375240586-882704db8884?w=800",
      categorySlug: "environment",
      sentimentScore: 0.92,
      credibilityScore: 0.82,
      isFeatured: false,
    },
    {
      title: "Costa Rica Achieves 99% Renewable Energy for Fifth Consecutive Year",
      slug: "costa-rica-99-percent-renewable-energy",
      summary: "Costa Rica has run on 99% renewable energy for five straight years, powered by hydroelectric, geothermal, wind, and solar.",
      content: "Costa Rica continues to lead the world in renewable energy, achieving 99% clean electricity for the fifth consecutive year.",
      sourceUrl: "https://www.bbc.com",
      sourceName: "BBC News — World",
      imageUrl: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800",
      categorySlug: "environment",
      sentimentScore: 0.90,
      credibilityScore: 0.93,
      isFeatured: false,
    },
  ];
  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { slug: article.slug },
      update: {},
      create: { ...article, isPublished: true, isVerified: true, publishedAt: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000) },
    });
  }

  await prisma.setting.upsert({ where: { key: "translation_languages" }, update: {}, create: { key: "translation_languages", value: JSON.stringify(["es", "fr", "de"]) } });
  await prisma.setting.upsert({ where: { key: "newsletter_articles" }, update: {}, create: { key: "newsletter_articles", value: "5" } });
  await prisma.setting.upsert({ where: { key: "pipeline_schedule" }, update: {}, create: { key: "pipeline_schedule", value: "0 * * * *" } });

  return { adminEmail: "admin@ogn.app", adminPassword: adminPasswordPlain };
}
