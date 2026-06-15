// app/admin/dashboard.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { VoucherPlan } from '@/lib/voucher';

interface GeneratedVoucher {
  username: string;
  password: string;
  planLabel: string;
  durationLabel: string;
  profile: string;
}

export default function AdminDashboard({ plans }: { plans: VoucherPlan[] }) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [vouchers, setVouchers] = useState<GeneratedVoucher[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  function setQty(planId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [planId]: qty }));
  }

  const selectedItems = plans
    .map((p) => ({ planId: p.id, quantity: quantities[p.id] || 0 }))
    .filter((i) => i.quantity > 0);

  const totalCount = selectedItems.reduce((sum, i) => sum + i.quantity, 0);

  async function handleGenerate() {
    if (selectedItems.length === 0) return;
    setLoading(true);
    setErrors([]);
    try {
      const res = await fetch('/api/voucher/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate vouchers');
      }
      setVouchers((prev) => [...data.vouchers, ...prev]);
      if (data.errors?.length) setErrors(data.errors);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Unknown error']);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  function handlePrint() {
    window.print();
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs tracking-widest uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Router Console
            </div>
            <h1 className="text-2xl font-bold text-white">Voucher Generator</h1>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-slate-300 hover:text-white border border-slate-600 rounded-lg px-3 py-1.5 transition"
          >
            Sign out
          </button>
        </header>

        {/* Plan selection */}
        <section className="card p-6 mb-6 print:hidden">
          <h2 className="font-semibold text-slate-900 mb-1">Choose packages</h2>
          <p className="text-sm text-slate-500 mb-4">
            Pick a quantity for each package. You can mix multiple packages in one batch.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="flex items-center justify-between border border-slate-200 rounded-lg px-4 py-3"
              >
                <div>
                  <p className="font-medium text-slate-900">{plan.label}</p>
                  <p className="text-xs text-slate-500">Profile: {plan.profile}</p>
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={quantities[plan.id] || ''}
                  onChange={(e) => setQty(plan.id, Math.max(0, Number(e.target.value) || 0))}
                  placeholder="0"
                  className="w-16 text-center rounded-md border border-slate-200 px-2 py-1.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || totalCount === 0}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2.5 transition"
            >
              {loading ? 'Generating…' : `Generate ${totalCount || ''} voucher${totalCount === 1 ? '' : 's'}`}
            </button>
            {vouchers.length > 0 && (
              <button
                onClick={handlePrint}
                className="text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg px-4 py-2.5 transition font-medium"
              >
                Print tickets
              </button>
            )}
          </div>

          {errors.length > 0 && (
            <div className="mt-4 text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 space-y-1">
              {errors.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-400 mt-4">
            Vouchers are created directly on your MikroTik router via the RouterOS REST API.
            Make sure router credentials are configured (ROUTER_HOST, ROUTER_USER, ROUTER_PASS)
            and that each package&apos;s profile name matches a Hotspot User Profile on your router.
          </p>
        </section>

        {/* Generated vouchers as ticket stubs */}
        {vouchers.length > 0 && (
          <section>
            <h2 className="font-semibold text-white mb-3 print:hidden">
              Generated vouchers ({vouchers.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:grid-cols-2 print:gap-2">
              {vouchers.map((v, i) => (
                <VoucherTicket key={i} voucher={v} />
              ))}
            </div>
          </section>
        )}

        {vouchers.length === 0 && (
          <p className="text-center text-slate-400 text-sm print:hidden">
            No vouchers generated yet. Choose packages above and click Generate.
          </p>
        )}
      </div>
    </main>
  );
}

function VoucherTicket({ voucher }: { voucher: GeneratedVoucher }) {
  return (
    <div className="relative bg-white rounded-lg shadow-md overflow-hidden border border-slate-200 print:break-inside-avoid">
      <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-widest text-amber-400">WiFi Voucher</span>
        <span className="text-xs text-slate-300">{voucher.durationLabel}</span>
      </div>
      <div className="px-4 py-3 space-y-2">
        <Row label="Username" value={voucher.username} />
        <Row label="Password" value={voucher.password} />
        <Row label="Plan" value={voucher.planLabel} />
      </div>
      {/* perforation effect */}
      <div className="absolute left-0 right-0 top-[2.6rem] border-t border-dashed border-slate-200" />
      <div className="absolute -left-2 top-[2.6rem] w-4 h-4 rounded-full bg-[#0f172a]" />
      <div className="absolute -right-2 top-[2.6rem] w-4 h-4 rounded-full bg-[#0f172a]" />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-mono font-semibold text-slate-900 tracking-wider">{value}</span>
    </div>
  );
}
