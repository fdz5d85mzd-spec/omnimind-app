'use client';

import { useState } from 'react';
import { Copy, Check, Share2, ExternalLink } from 'lucide-react';

interface ReferralLinkProps {
  referralCode: string;
  baseUrl?: string;
}

export default function ReferralLink({ referralCode, baseUrl }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : (baseUrl || 'https://ogn-platform.vercel.app');
  const fullLink = `${origin}?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 md:p-6 backdrop-blur-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-amber-400" />
          <h3 className="text-base font-semibold text-white">Your Personal Referral Link</h3>
        </div>
        <span className="text-xs font-mono bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2.5 py-1 rounded-full">
          Code: {referralCode}
        </span>
      </div>

      <p className="text-xs text-slate-400 mb-4">
        Share this unique link with your audience or friends. You earn 10% commission on all purchases and subscriptions initiated through your link!
      </p>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            readOnly
            value={fullLink}
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-lg px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-400/50 pr-10 truncate"
          />
          <a
            href={fullLink}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-amber-400 transition-colors"
            title="Open referral link in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <button
          onClick={handleCopy}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
            copied
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold shadow-md hover:shadow-amber-500/20'
          }`}
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              <span>Copy Link</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
