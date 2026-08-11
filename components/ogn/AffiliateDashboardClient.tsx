'use client';

import { useState } from 'react';
import ReferralLink from '@/components/ogn/ReferralLink';
import { DollarSign, Award, CheckCircle2, Sparkles, TrendingUp, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface AffiliateDashboardClientProps {
  user: { email: string; name?: string } | null;
  affiliateData: {
    id: string;
    referralCode: string;
    commissionRate: number;
    totalEarnings: number;
    pendingEarnings: number;
    paidOut: number;
    status: string;
    referrals: Array<{ id: string; commission: number; status: string; createdAt: string }>;
    payouts: Array<{ id: string; amount: number; status: string; requestedAt: string }>;
  } | null;
}

export default function AffiliateDashboardClient({ user, affiliateData: initialAffiliate }: AffiliateDashboardClientProps) {
  const router = useRouter();
  const [affiliate] = useState(initialAffiliate);
  const [registering, setRegistering] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleRegister = async () => {
    setRegistering(true);
    setMessage(null);
    try {
      const res = await fetch('/api/affiliate/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to join affiliate program');

      setMessage({ text: 'Welcome to the OGN Affiliate Program!', type: 'success' });
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error joining program', type: 'error' });
    } finally {
      setRegistering(false);
    }
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setMessage({ text: 'Please enter a valid payout amount', type: 'error' });
      return;
    }

    setRequestingPayout(true);
    setMessage(null);
    try {
      const res = await fetch('/api/affiliate/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountNum }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit payout request');

      setMessage({ text: 'Payout request submitted successfully!', type: 'success' });
      setPayoutAmount('');
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error submitting payout request', type: 'error' });
    } finally {
      setRequestingPayout(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12 text-slate-100">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="h-4 w-4" /> Earn With Positive News
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            OGN Affiliate Partner Program
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Spread good news and earn generous rewards. Share OGN with your audience, friends, and community.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-center shadow-lg shadow-amber-500/20 transition-all"
            >
              Sign In to Join Program
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-amber-400/10 flex items-center justify-center text-amber-400">
              <DollarSign className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">10% Recurring Commission</h3>
            <p className="text-sm text-slate-400">
              Earn a generous 10% commission on every subscriber and customer you refer to OGN platform.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Real-Time Analytics</h3>
            <p className="text-sm text-slate-400">
              Track clicks, referrals, and earnings transparently in your personal affiliate dashboard.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-400/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Fast & Easy Payouts</h3>
            <p className="text-sm text-slate-400">
              Request payouts directly from your dashboard whenever you reach pending balance threshold.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8 text-slate-100">
        {message && (
          <div
            className={`p-4 rounded-xl text-sm font-medium border ${
              message.type === 'success'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
                : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl space-y-6 text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-400/10 text-amber-400 mx-auto">
            <Award className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">
              Become an OGN Affiliate Partner
            </h1>
            <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
              Welcome, <span className="text-amber-400 font-semibold">{user.name || user.email}</span>! Join our affiliate network today and earn 10% commission on every referral.
            </p>
          </div>

          <button
            onClick={handleRegister}
            disabled={registering}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
          >
            {registering ? 'Creating your referral link...' : 'Join Affiliate Program Now'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8 text-slate-100">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
            <Award className="h-7 w-7 text-amber-400" />
            Affiliate Partner Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Welcome back, <span className="text-white font-medium">{user.name || user.email}</span>
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 capitalize">
          Account Status: {affiliate.status}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
          }`}
        >
          {message.text}
        </div>
      )}

      <ReferralLink referralCode={affiliate.referralCode} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <span className="text-xs text-slate-400">Total Earnings</span>
          <p className="text-2xl font-bold text-emerald-400 mt-2">${affiliate.totalEarnings.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-1 block">Lifetime referrals income</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <span className="text-xs text-slate-400">Pending Earnings</span>
          <p className="text-2xl font-bold text-amber-400 mt-2">${affiliate.pendingEarnings.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-1 block">Available for payout</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <span className="text-xs text-slate-400">Paid Out</span>
          <p className="text-2xl font-bold text-white mt-2">${affiliate.paidOut.toFixed(2)}</p>
          <span className="text-xs text-slate-500 mt-1 block">Total withdrawn</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md">
          <span className="text-xs text-slate-400">Commission Rate</span>
          <p className="text-2xl font-bold text-blue-400 mt-2">{(affiliate.commissionRate * 100).toFixed(0)}%</p>
          <span className="text-xs text-slate-500 mt-1 block">Your reward rate</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-400" />
          Request a Payout
        </h2>
        <p className="text-xs text-slate-400">
          Available pending earnings: <span className="font-bold text-amber-400">${affiliate.pendingEarnings.toFixed(2)}</span>
        </p>

        <form onSubmit={handleRequestPayout} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="1"
              max={affiliate.pendingEarnings}
              placeholder="0.00"
              value={payoutAmount}
              onChange={(e) => setPayoutAmount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-7 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-400"
            />
          </div>
          <button
            type="submit"
            disabled={requestingPayout || affiliate.pendingEarnings <= 0}
            className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold rounded-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
          >
            <Send className="h-4 w-4" />
            <span>{requestingPayout ? 'Submitting...' : 'Submit Request'}</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
          <h2 className="text-base font-semibold text-white mb-4">Recent Referrals</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Commission</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {affiliate.referrals.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      No referrals logged yet. Share your link to start earning!
                    </td>
                  </tr>
                ) : (
                  affiliate.referrals.map((ref) => (
                    <tr key={ref.id}>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(ref.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-emerald-400">
                        ${ref.commission.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 capitalize text-slate-400">
                        {ref.status}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
          <h2 className="text-base font-semibold text-white mb-4">Payout History</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800/50 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {affiliate.payouts.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">
                      No payout requests submitted yet.
                    </td>
                  </tr>
                ) : (
                  affiliate.payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="py-2.5 px-3 text-slate-400">
                        {new Date(p.requestedAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">
                        ${p.amount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`capitalize font-medium ${
                            p.status === 'completed'
                              ? 'text-emerald-400'
                              : p.status === 'rejected'
                              ? 'text-rose-400'
                              : 'text-amber-400'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
