import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseEurekAlertHtml} from '../lib/ogn/agents/collection';
import {callLLM} from '../lib/ogn/agents/llm';

test('Anthropic requests omit deprecated temperature while OpenAI retains it',()=>{
  const source=fs.readFileSync('lib/ogn/agents/llm.ts','utf8');
  const anthropic=source.slice(source.indexOf('async function callAnthropic'));
  assert.equal(/temperature\s*:/.test(anthropic),false);
  assert.match(source.slice(source.indexOf('async function callOpenAI'),source.indexOf('async function callAnthropic')),/temperature\s*:/);
});

test('Anthropic verification and translation requests work without temperature', async () => {
  const originalFetch = global.fetch;
  const originalAnthropicKey = process.env.ANTHROPIC_API_KEY;
  const originalOpenAIKey = process.env.OPENAI_API_KEY;
  const bodies: Array<Record<string, unknown>> = [];
  process.env.ANTHROPIC_API_KEY = `sk-ant-${'a'.repeat(48)}`;
  delete process.env.OPENAI_API_KEY;
  global.fetch = (async (_input, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return new Response(JSON.stringify({
      content: [{type: 'text', text: '{"ok":true}'}],
      usage: {input_tokens: 4, output_tokens: 2},
    }), {status: 200, headers: {'content-type': 'application/json'}});
  }) as typeof fetch;

  try {
    const verification = await callLLM([{role: 'user', content: 'Verify this source'}], {temperature: 0.1, json: true});
    const translation = await callLLM([{role: 'user', content: 'Translate this article'}], {temperature: 0.2, json: true});
    assert.deepEqual(JSON.parse(verification.content), {ok: true});
    assert.deepEqual(JSON.parse(translation.content), {ok: true});
    assert.equal(bodies.length, 2);
    assert.equal(bodies.some((body) => 'temperature' in body), false);
  } finally {
    global.fetch = originalFetch;
    if (originalAnthropicKey === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = originalAnthropicKey;
    if (originalOpenAIKey === undefined) delete process.env.OPENAI_API_KEY;
    else process.env.OPENAI_API_KEY = originalOpenAIKey;
  }
});

test('EurekAlert HTML feed extracts releases without silently dropping coverage',()=>{
  const items=parseEurekAlertHtml(`<article class="post"><a href="/news-releases/123"><header><div class="reltime">1-Sep-2026</div><h2 class="post_title">A &amp; B discovery</h2></header><div class="intro">Useful <em>science</em>.</div></a></article>`);
  assert.deepEqual(items,[{title:'A & B discovery',link:'https://www.eurekalert.org/news-releases/123',contentSnippet:'Useful science .',pubDate:'1-Sep-2026'}]);
});

test('build database synchronization is explicit opt-in',()=>{
  const source=fs.readFileSync('scripts/sync-db.js','utf8');
  assert.match(source,/OMNIMIND_ALLOW_DB_PUSH !== "true"/);
});

test('new Orpheus transfers are not hard-coded to Vercel Blob',()=>{
  const source=fs.readFileSync('pages/api/orpheus/transfers.js','utf8');
  assert.match(source,/storageProvider\(\)/);
  assert.doesNotMatch(source,/VALUES \([^\n]+, 'blob'\)/);
});

test('runtime no longer imports or requires Vercel Blob credentials', () => {
  const runtimeFiles = [
    'pages/api/orpheus/upload.js',
    'pages/api/orpheus/download.js',
    'pages/api/orpheus/cleanup.js',
  ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(runtimeFiles, /@vercel\/blob|BLOB_READ_WRITE_TOKEN|VERCEL_OIDC_TOKEN|BLOB_STORE_ID/);
});

test('Higgsfield routes are optional and fail closed without credentials', () => {
  const routes = [
    'app/aria-go/api/generate/route.ts',
    'app/voxstudio/api/generate-image/route.ts',
    'app/voxstudio/api/generate-video/route.ts',
  ];
  for (const route of routes) {
    const source = fs.readFileSync(route, 'utf8');
    assert.match(source, /if \(!isHiggsfieldConfigured\(\)\)/);
    assert.match(source, /temporarily_unavailable/);
    assert.match(source, /status: 503/);
  }
});
