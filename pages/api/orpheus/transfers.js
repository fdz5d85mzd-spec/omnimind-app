import crypto from 'node:crypto';
import { ensureSchema, sql } from '../../../lib/orpheus/_db.js';
import { hash, json, randomCode, randomKey, safeName, validEmail } from '../../../lib/orpheus/_security.js';
import { getEntitlement, reserveUsage } from '../../../lib/orpheus/_entitlement.js';
import { sendTransferEmail } from '../../../lib/orpheus/_email.js';

const MAX_FILES = 50;

export default async function handler(req, res) {
  try {
    await ensureSchema();
    if (req.method === 'POST') return createTransfer(req, res);
    if (req.method === 'GET') return readTransfer(req, res);
    if (req.method === 'PATCH') return finalizeTransfer(req, res);
    return json(res, 405, { error: 'Method not allowed.' });
  } catch (error) {
    console.error('transfer_error', error);
    return json(res, 500, { error: 'The transfer service is temporarily unavailable.' });
  }
}

async function createTransfer(req, res) {
  const { mode, recipientEmail, senderEmail, message, files } = req.body || {};
  const entitlement = await getEntitlement(req);
  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  const fingerprint = hash(`${ip}:${String(req.headers['user-agent'] || '').slice(0, 180)}:${process.env.CRON_SECRET || 'orpheus'}`);
  if (!['email', 'link'].includes(mode) || !Array.isArray(files) || !files.length || files.length > MAX_FILES) {
    return json(res, 400, { error: 'Invalid transfer.' });
  }
  if (!validEmail(recipientEmail) || !validEmail(senderEmail)) return json(res, 400, { error: 'Invalid email address.' });
  const total = files.reduce((sum, file) => sum + Number(file.size || 0), 0);
  if (total <= 0 || files.some((file) => !file.name || Number(file.size) <= 0)) {
    return json(res, 400, { error: 'Transfer files are invalid.' });
  }
  if (total > entitlement.maxTransfer) {
    return json(res, 402, { error: `Your current allowance supports up to ${(entitlement.maxTransfer / 1024 ** 3).toFixed(2)} GB per transfer. Choose a paid plan or one-time transfer.` });
  }
  if (entitlement.kind === 'free') {
    const active = await sql`SELECT 1 FROM transfers WHERE creator_fingerprint = ${fingerprint} AND status IN ('uploading', 'ready') AND expires_at > NOW() LIMIT 1`;
    if (active.length) return json(res, 429, { error: 'The Hobby plan allows one active transfer at a time.' });
  }

  const id = crypto.randomUUID();
  const code = randomCode();
  const uploadKey = randomKey();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const records = files.map((file) => {
    const fileId = crypto.randomUUID();
    return {
      id: fileId,
      name: String(file.name).slice(0, 255),
      size: Number(file.size),
      type: String(file.type || 'application/octet-stream').slice(0, 150),
      pathname: `transfers/${id}/${fileId}-${safeName(String(file.name))}`,
    };
  });

  await sql.begin(async (tx) => {
    await reserveUsage(tx, entitlement, total);
    await tx`INSERT INTO transfers (id, code, upload_key_hash, mode, recipient_email, sender_email, message, expires_at, creator_fingerprint)
      VALUES (${id}, ${code}, ${hash(uploadKey)}, ${mode}, ${recipientEmail || null}, ${senderEmail || null}, ${String(message || '').slice(0, 2000)}, ${expiresAt}, ${fingerprint})`;
    for (const file of records) {
      await tx`INSERT INTO transfer_files (id, transfer_id, name, size, content_type, pathname, storage_provider)
        VALUES (${file.id}, ${id}, ${file.name}, ${file.size}, ${file.type}, ${file.pathname}, 'r2')`;
    }
  });

  return json(res, 201, { id, code, uploadKey, expiresAt, files: records.map(({ id: fileId, pathname }) => ({ id: fileId, pathname })) });
}

async function readTransfer(req, res) {
  const code = String(req.query.code || '');
  const rows = await sql`SELECT id, message, expires_at, status FROM transfers WHERE code = ${code} LIMIT 1`;
  const transfer = rows[0];
  if (!transfer || transfer.status !== 'ready' || new Date(transfer.expires_at) <= new Date()) {
    return json(res, 404, { error: 'This transfer has expired or does not exist.' });
  }
  const files = await sql`SELECT id, name, size, content_type FROM transfer_files WHERE transfer_id = ${transfer.id} AND uploaded_at IS NOT NULL ORDER BY created_at`;
  return json(res, 200, { message: transfer.message, expiresAt: transfer.expires_at, files: files.map((file) => ({ ...file, size: Number(file.size) })) });
}

async function finalizeTransfer(req, res) {
  const { id, uploadKey, files } = req.body || {};
  if (!id || !uploadKey || !Array.isArray(files)) return json(res, 400, { error: 'Invalid request.' });
  const transfers = await sql`SELECT upload_key_hash, code, mode, recipient_email, sender_email, message, expires_at FROM transfers WHERE id = ${id} AND expires_at > NOW() LIMIT 1`;
  if (!transfers[0] || hash(uploadKey) !== transfers[0].upload_key_hash) return json(res, 403, { error: 'Upload authorization failed.' });
  const expected = await sql`SELECT id, pathname FROM transfer_files WHERE transfer_id = ${id}`;
  if (files.length !== expected.length) return json(res, 409, { error: 'Not all files were uploaded.' });
  for (const record of expected) {
    const completed = files.find((file) => file.id === record.id);
    if (!completed || completed.pathname !== record.pathname || typeof completed.url !== 'string' || (!completed.url.includes('.private.blob.vercel-storage.com/') && completed.url !== `r2://${record.pathname}`)) {
      return json(res, 409, { error: 'Uploaded file verification failed.' });
    }
    await sql`UPDATE transfer_files SET blob_url = ${completed.url}, uploaded_at = COALESCE(uploaded_at, NOW()) WHERE id = ${record.id} AND transfer_id = ${id}`;
  }
  const counts = await sql`SELECT COUNT(*)::int AS total, COUNT(uploaded_at)::int AS uploaded FROM transfer_files WHERE transfer_id = ${id}`;
  if (!counts[0] || counts[0].total !== counts[0].uploaded) return json(res, 409, { error: 'Some files are still uploading.' });
  await sql`UPDATE transfers SET status = 'ready' WHERE id = ${id}`;
  let emailSent = null;
  if (transfers[0].mode === 'email' && transfers[0].recipient_email) {
    const protocol = String(req.headers['x-forwarded-proto'] || 'https').split(',')[0];
    const origin = `${protocol}://${req.headers.host}`;
    emailSent = await sendTransferEmail({
      to: transfers[0].recipient_email,
      fromEmail: transfers[0].sender_email,
      message: transfers[0].message,
      shareUrl: `${origin}/orpheus?t=${encodeURIComponent(transfers[0].code)}`,
      expiresAt: transfers[0].expires_at,
      fileCount: expected.length,
    });
  }
  return json(res, 200, { ready: true, emailSent });
}
