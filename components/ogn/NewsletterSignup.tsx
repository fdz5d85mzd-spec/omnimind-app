'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

export default function NewsletterSignup({ variant = 'full' }: { variant?: 'compact' | 'full' }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Subscription failed');
      setSuccess(true);
      setEmail('');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={`flex items-center gap-3 ${variant === 'compact' ? 'text-sm' : ''} text-emerald-600 dark:text-emerald-400`}>
        <CheckCircle className="h-5 w-5" />
        <span>You&apos;re subscribed! Good news incoming. 🌟</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pl-8 pr-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ogn-gold/30"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg gradient-hope px-3 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Subscribe'}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 max-w-md mx-auto">
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 pl-10 pr-4 py-3 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ogn-gold/30"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="flex items-center space-x-1.5 rounded-xl gradient-hope px-5 py-3 font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <span>Subscribe</span>
        )}
      </button>
      {error && <p className="text-sm text-red-500 absolute -bottom-6 left-0">{error}</p>}
    </form>
  );
}
