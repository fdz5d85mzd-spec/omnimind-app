'use client';

import { useState } from 'react';
import { Users, DollarSign, CheckCircle2, XCircle, AlertCircle, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AffiliateItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  referralCode: string;
  commissionRate: any;
  totalEarnings: any;
  pendingEarnings: any;
  paidOut: any;
  status: string;
  createdAt: string;
}

interface PayoutItem {
  id: string;
  affiliateId: string;
  affiliateUserEmail: string;
  affiliateUserName: string;
  referralCode: string;
  amount: any;
  status: string;
  requestedAt: string;
  processedAt?: string | null;
}

interface AdminAffiliateManagerProps {
  affiliates: AffiliateItem[];
  payouts: PayoutItem[];
}

export default function AdminAffiliateManager({ affiliates: initialAffiliates, payouts: initialPayouts }: AdminAffiliateManagerProps) {
  const router = useRouter();
  const [affiliates, setAffiliates] = useState<AffiliateItem[]>(initialAffiliates);
  const [payouts, setPayouts] = useState<PayoutItem[]>(initialPayouts);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingRateId, setEditingRateId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState<string>('0.10');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateAffiliate = async (affiliateId: string, data: { commissionRate?: number; status?: string }) => {
    setLoadingId(affiliateId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/affiliates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateId, ...data }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update affiliate');

      setAffiliates((prev) =>
        prev.map((a) => (a.id === affiliateId ? { ...a, ...resData.affiliate } : a))
      );
      setMessage({ text: 'Affiliate updated successfully!', type: 'success' });
      setEditingRateId(null);
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error updating affiliate', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleProcessPayout = async (payoutId: string, status: 'completed' | 'rejected' | 'processing') => {
    setLoadingId(payoutId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/payouts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payoutId, status }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to process payout');

      setPayouts((prev) =>
        prev.map((p) => (p.id === payoutId ? { ...p, status: resData.payout.status, processedAt: resData.payout.processedAt } : p))
      );
      setMessage({ text: `Payout request marked as ${status}!`, type: 'success' });
      router.refresh();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error processing payout', type: 'error' });
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800/80'
              : 'bg-rose-950/60 text-rose-300 border-rose-800/80'
          }`}
        >
          {message.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <AlertCircle className="h-5 w-5 text-rose-400" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Payout Requests Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-amber-400" />
            Payout Requests ({payouts.filter((p) => p.status === 'requested').length} Pending)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Affiliate</th>
                <th className="py-3 px-4">Referral Code</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Requested Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No payout requests submitted yet.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{payout.affiliateUserEmail}</div>
                      <div className="text-xs text-slate-500">{payout.affiliateUserName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-amber-400">
                      {payout.referralCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      ${Number(payout.amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-400">
                      {new Date(payout.requestedAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize border ${
                          payout.status === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : payout.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                            : payout.status === 'processing'
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        }`}
                      >
                        {payout.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {payout.status === 'requested' || payout.status === 'processing' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleProcessPayout(payout.id, 'completed')}
                            disabled={loadingId === payout.id}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Complete</span>
                          </button>
                          <button
                            onClick={() => handleProcessPayout(payout.id, 'rejected')}
                            disabled={loadingId === payout.id}
                            className="bg-rose-600/80 hover:bg-rose-500 text-white text-xs px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 font-medium disabled:opacity-50"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affiliates List Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          Affiliate Accounts ({affiliates.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs uppercase bg-slate-800/50 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Commission</th>
                <th className="py-3 px-4">Total Earned</th>
                <th className="py-3 px-4">Pending</th>
                <th className="py-3 px-4">Paid Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {affiliates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No registered affiliates yet.
                  </td>
                </tr>
              ) : (
                affiliates.map((aff) => (
                  <tr key={aff.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div>{aff.userEmail}</div>
                      <div className="text-xs text-slate-500">{aff.userName}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-amber-400 font-semibold">
                      {aff.referralCode}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {editingRateId === aff.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white"
                          />
                          <button
                            onClick={() => handleUpdateAffiliate(aff.id, { commissionRate: parseFloat(newRate) })}
                            className="text-xs bg-amber-500 text-slate-950 font-bold px-2 py-0.5 rounded"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>{(Number(aff.commissionRate) * 100).toFixed(0)}%</span>
                          <button
                            onClick={() => {
                              setEditingRateId(aff.id);
                              setNewRate(String(Number(aff.commissionRate)));
                            }}
                            className="text-slate-500 hover:text-amber-400"
                            title="Edit commission rate"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-emerald-400">
                      ${Number(aff.totalEarnings).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-amber-400">
                      ${Number(aff.pendingEarnings).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      ${Number(aff.paidOut).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
                          aff.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        }`}
                      >
                        {aff.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() =>
                          handleUpdateAffiliate(aff.id, {
                            status: aff.status === 'active' ? 'suspended' : 'active',
                          })
                        }
                        disabled={loadingId === aff.id}
                        className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${
                          aff.status === 'active'
                            ? 'bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80'
                            : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/80'
                        }`}
                      >
                        {aff.status === 'active' ? 'Suspend' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
