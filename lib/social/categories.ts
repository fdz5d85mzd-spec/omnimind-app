// Client-safe: category labels + the SocialPost shape, with no Anthropic
// SDK or env var reads (see scriptWriter.ts for the server-only generation
// logic) -- keeps admin client components from pulling ANTHROPIC_API_KEY-
// reading code into the browser bundle.
export type PostCategory = "positive_news" | "general_knowledge" | "health_beauty" | "gossip" | "jokes";

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  positive_news: "Positive news",
  general_knowledge: "General knowledge",
  health_beauty: "Health & beauty",
  gossip: "Gossip",
  jokes: "Jokes",
};

export interface SocialPost {
  category: PostCategory;
  hook: string;
  script: string;
  caption: string;
  hashtags: string[];
}
