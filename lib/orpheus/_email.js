const escapeHtml = (value) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

export async function sendTransferEmail({ to, fromEmail, message, shareUrl, expiresAt, fileCount }) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !configuredFrom || !to) {
    console.warn('orpheus transfer email skipped: email service is not configured');
    return false;
  }
  const from = configuredFrom.includes('<') ? configuredFrom : `Atlas by OmniMind <${configuredFrom}>`;

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#171714;background:#fbfaf6">
      <p style="font:600 11px monospace;letter-spacing:.18em;text-transform:uppercase;color:#22a8ca">ATLAS · OMNIMIND</p>
      <h1 style="font:500 42px Georgia,serif;line-height:1.05;margin:22px 0">Files were sent to you.</h1>
      <p style="line-height:1.7;color:#68675f"><strong>${escapeHtml(fromEmail)}</strong> shared ${fileCount} ${fileCount === 1 ? 'file' : 'files'} with you.</p>
      ${message ? `<blockquote style="margin:24px 0;padding:16px 18px;border-left:3px solid #d7f36a;background:#f1eee6;color:#4e4c46">${escapeHtml(message)}</blockquote>` : ''}
      <p style="margin:30px 0"><a href="${escapeHtml(shareUrl)}" style="display:inline-block;background:#171714;color:#fff;padding:14px 22px;text-decoration:none;font-weight:700;border-radius:10px">Open your private Atlas transfer</a></p>
      <p style="font-size:12px;color:#858279">Available until ${escapeHtml(new Date(expiresAt).toLocaleString('en-GB', { timeZone: 'UTC' }))} UTC. If you were not expecting this transfer, do not open it.</p>
      <p style="font-size:11px;color:#aaa69d;margin-top:28px">The files open securely on www.omnimindai.app. Your email address is not shown publicly.</p>
    </div>`;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ from, to, reply_to: fromEmail || undefined, subject: `${fromEmail || 'Someone'} sent you files via Atlas`, html }),
    });
    if (!response.ok) {
      console.error('orpheus transfer email failed', { status: response.status });
      return false;
    }
    return true;
  } catch (error) {
    console.error('orpheus transfer email error', error);
    return false;
  }
}
