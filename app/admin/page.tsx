// app/admin/page.tsx
import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { VOUCHER_PLANS } from '@/lib/voucher';
import AdminDashboard from './dashboard';

export default function AdminPage() {
  if (!isAuthenticated()) {
    redirect('/login');
  }

  return <AdminDashboard plans={VOUCHER_PLANS} />;
}
