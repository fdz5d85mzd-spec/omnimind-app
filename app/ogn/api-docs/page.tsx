import { Key, Activity, Globe, Code } from 'lucide-react';

export default function ApiDocsPage() {
  const endpoints = [
    {
      method: 'GET',
      path: '/api/v1/articles',
      description: 'List published articles with pagination, filtering, and sorting.',
      params: [
        { name: 'page', type: 'number', default: '1' },
        { name: 'limit', type: 'number', default: '20', note: 'max 50' },
        { name: 'category', type: 'string', note: 'filter by category slug' },
        { name: 'sort', type: 'string', default: '-publishedAt', note: '-publishedAt or publishedAt' },
        { name: 'language', type: 'string', default: 'en' },
      ],
      example: `curl -H "x-api-key: YOUR_KEY" \\\n  "https://your-app.vercel.app/api/v1/articles?limit=10&category=science-tech"`,
    },
    {
      method: 'GET',
      path: '/api/v1/articles/[slug]',
      description: 'Get a single article by slug, including all available translations.',
      example: `curl -H "x-api-key: YOUR_KEY" \\\n  "https://your-app.vercel.app/api/v1/articles/scientists-develop-solar-panel-that-works-at-night"`,
    },
    {
      method: 'GET',
      path: '/api/v1/categories',
      description: 'List all categories with article counts.',
      example: `curl -H "x-api-key: YOUR_KEY" \\\n  "https://your-app.vercel.app/api/v1/categories"`,
    },
    {
      method: 'GET',
      path: '/api/v1/hope-index',
      description: 'Get the current Hope Index — overall sentiment, category breakdown, and trend.',
      example: `curl -H "x-api-key: YOUR_KEY" \\\n  "https://your-app.vercel.app/api/v1/hope-index"`,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-hope mb-6">
          <Code className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-3">OGN Public API</h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">
          Access positive news data programmatically. The OGN API provides articles, categories, and the Hope Index.
        </p>
      </div>

      {/* Authentication */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Key className="h-5 w-5 text-ogn-gold" /> Authentication
        </h2>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
            All API requests require an API key passed in the <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-ogn-gold font-mono text-sm">x-api-key</code> header.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">Generate an API key from the admin dashboard:</p>
          <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-300 space-y-1 ml-2">
            <li>Log in to the <a href="/admin" className="text-ogn-teal hover:underline">admin panel</a></li>
            <li>Navigate to <strong>API Keys</strong></li>
            <li>Click <strong>Create API Key</strong></li>
            <li>Save the key — it&apos;s only shown once</li>
          </ol>
        </div>
      </section>

      {/* Rate Limiting */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-ogn-teal" /> Rate Limiting
        </h2>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Each API key has a configurable rate limit (default: 100 requests/hour). Rate limits are tracked per-key and reset hourly. The response includes these headers:
          </p>
          <ul className="mt-3 text-sm text-slate-600 dark:text-slate-300 space-y-1">
            <li><code className="font-mono text-ogn-gold">X-RateLimit-Limit</code> — your hourly limit</li>
            <li><code className="font-mono text-ogn-gold">X-RateLimit-Remaining</code> — remaining requests this hour</li>
          </ul>
        </div>
      </section>

      {/* Endpoints */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Globe className="h-5 w-5 text-ogn-gold" /> Endpoints
        </h2>
        <div className="space-y-6">
          {endpoints.map((endpoint) => (
            <div key={endpoint.path} className="glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <span className="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {endpoint.method}
                </span>
                <code className="text-sm font-mono text-slate-800 dark:text-slate-200">{endpoint.path}</code>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{endpoint.description}</p>
              {endpoint.params && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Query Parameters</p>
                  <div className="space-y-1">
                    {endpoint.params.map((param) => (
                      <div key={param.name} className="flex items-center gap-2 text-xs">
                        <code className="font-mono text-ogn-gold">{param.name}</code>
                        <span className="text-slate-400">{param.type}</span>
                        {param.default && <span className="text-slate-500">default: {param.default}</span>}
                        {param.note && <span className="text-slate-400">({param.note})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">Example</p>
                <pre className="rounded-lg bg-slate-900 p-3 text-xs text-slate-300 overflow-x-auto">
                  <code>{endpoint.example}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Response Format */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Response Format</h2>
        <div className="glass rounded-2xl p-6">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">All responses are JSON. Article list responses include pagination:</p>
          <pre className="rounded-lg bg-slate-900 p-4 text-xs text-slate-300 overflow-x-auto">
            <code>{`{
  "articles": [
    {
      "id": "abc123",
      "title": "Scientists Develop Revolutionary Solar Panel",
      "slug": "scientists-develop-solar-panel",
      "summary": "Researchers at Stanford...",
      "imageUrl": "https://...",
      "categorySlug": "science-tech",
      "sourceName": "Good News Network",
      "sentimentScore": 0.85,
      "publishedAt": "2026-08-08T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "hasMore": true
  }
}`}</code>
          </pre>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center text-sm text-slate-400 pt-8">
        <p>OGN API v1 · Only Good News</p>
        <p className="mt-1">Need help? <a href="/admin" className="text-ogn-teal hover:underline">Contact admin</a></p>
      </div>
    </div>
  );
}
