import crypto from 'node:crypto';

export const hash = (value) => crypto.createHash('sha256').update(value).digest('hex');
export const randomKey = () => crypto.randomBytes(32).toString('base64url');
export const randomCode = () => crypto.randomBytes(9).toString('base64url');
export const safeName = (name) => name.normalize('NFKC').replace(/[^a-zA-Z0-9._ -]/g, '_').replace(/\s+/g, '-').slice(-160) || 'file';
export const validEmail = (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(body));
}
