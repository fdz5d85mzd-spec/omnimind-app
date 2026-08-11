function escapeXml(unsafe: string | null | undefined): string {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDuration(seconds?: number | null): string {
  if (!seconds || seconds <= 0) return '00:05:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Generates an RSS 2.0 XML string for published articles.
 */
export function generateArticleRSS(articles: any[], siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');

  const itemsXml = articles
    .map((article) => {
      const pubDate = new Date(article.publishedAt || article.createdAt).toUTCString();
      const articleUrl = `${cleanSiteUrl}/article/${article.slug}`;
      const category = article.categorySlug || article.category?.slug || article.category?.name || 'General';

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(article.summary || article.content || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <category>${escapeXml(category)}</category>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OGN — Only Good News</title>
    <link>${escapeXml(cleanSiteUrl)}</link>
    <description>Positive, solutions-oriented, and inspiring news from around the world.</description>
    <language>en</language>
    <atom:link href="${escapeXml(cleanSiteUrl)}/api/rss" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates an iTunes-compatible podcast RSS XML feed for completed episodes.
 */
export function generatePodcastRSS(episodes: any[], siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');

  const itemsXml = episodes
    .map((episode) => {
      const pubDate = new Date(episode.publishedAt || episode.createdAt).toUTCString();
      const episodeUrl = `${cleanSiteUrl}/podcast/${episode.id}`;
      const audioUrl = episode.audioUrl || `${cleanSiteUrl}/audio/podcasts/episode-${episode.id}.mp3`;
      const durationStr = formatDuration(episode.duration);
      const estimatedByteSize = (episode.duration || 300) * 16000;

      return `    <item>
      <title>${escapeXml(episode.title)}</title>
      <description>${escapeXml(episode.description || episode.script || '')}</description>
      <link>${escapeXml(episodeUrl)}</link>
      <guid isPermaLink="false">ogn-podcast-${escapeXml(episode.id)}</guid>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(audioUrl)}" length="${estimatedByteSize}" type="audio/mpeg" />
      <itunes:duration>${durationStr}</itunes:duration>
      <itunes:explicit>no</itunes:explicit>
      <itunes:episode>${episode.episodeNumber || 1}</itunes:episode>
      <itunes:summary>${escapeXml(episode.description || '')}</itunes:summary>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OGN Radio — Only Good News Podcast</title>
    <link>${escapeXml(cleanSiteUrl)}</link>
    <description>Daily inspiring stories, scientific breakthroughs, and uplifting news from OGN Radio.</description>
    <language>en</language>
    <itunes:summary>Daily inspiring stories, scientific breakthroughs, and uplifting news from OGN Radio.</itunes:summary>
    <itunes:author>Only Good News</itunes:author>
    <itunes:owner>
      <itunes:name>Only Good News</itunes:name>
      <itunes:email>podcast@onlygoodnews.com</itunes:email>
    </itunes:owner>
    <itunes:explicit>no</itunes:explicit>
    <itunes:category text="News">
      <itunes:category text="Daily News"/>
    </itunes:category>
    <itunes:image href="${escapeXml(cleanSiteUrl)}/podcast-cover.jpg"/>
    <atom:link href="${escapeXml(cleanSiteUrl)}/api/podcast/rss" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}

/**
 * Generates an RSS 2.0 XML string scoped to a single category.
 */
export function generateCategoryRSS(articles: any[], category: string, siteUrl: string): string {
  const cleanSiteUrl = siteUrl.replace(/\/+$/, '');
  const formattedCategory = category
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const itemsXml = articles
    .map((article) => {
      const pubDate = new Date(article.publishedAt || article.createdAt).toUTCString();
      const articleUrl = `${cleanSiteUrl}/article/${article.slug}`;

      return `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(articleUrl)}</link>
      <description>${escapeXml(article.summary || article.content || '')}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="true">${escapeXml(articleUrl)}</guid>
      <category>${escapeXml(category)}</category>
    </item>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>OGN — ${escapeXml(formattedCategory)} Good News</title>
    <link>${escapeXml(cleanSiteUrl)}/category/${escapeXml(category)}</link>
    <description>Positive and uplifting news in ${escapeXml(formattedCategory)} from Only Good News.</description>
    <language>en</language>
    <atom:link href="${escapeXml(cleanSiteUrl)}/api/rss/${escapeXml(category)}" rel="self" type="application/rss+xml" />
${itemsXml}
  </channel>
</rss>`;
}
