// ─── AI Agent Types ───────────────────────────────────────────

export type AgentName =
  | 'collection'
  | 'verification'
  | 'summary'
  | 'dedup'
  | 'seo'
  | 'translation'
  | 'pipeline';

export type AgentStatus = 'running' | 'completed' | 'failed';

export interface CollectedArticle {
  title: string;
  url: string;
  sourceName: string;
  content: string;
  publishedAt?: string;
  imageUrl?: string;
  categorySlug?: string;
}

export type RawArticle = CollectedArticle;

export interface VerificationResult {
  isPositive: boolean;
  sentimentScore: number;   // 0-1
  credibilityScore: number; // 0-1
  reason: string;
  category: string;
}

export interface SummaryResult {
  title: string;
  summary: string;
  keyPoints: string[];
  category: string;
  tags: string[];
}

export interface ArticleSummary {
  title: string;
  summary: string;
  category: string;
}

export interface ProcessedArticle {
  title: string;
  slug: string;
  summary: string;
  content: string;
  sourceUrl: string;
  sourceName: string;
  imageUrl: string | null;
  categorySlug: string;
  sentimentScore: number;
  credibilityScore: number;
  isPositive: boolean;
}
