import { Suspense } from 'react';
import { AccountView } from '@/features/account/components/AccountView';

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[var(--bg-page,#F5EEDC)]" />}>
      <AccountView />
    </Suspense>
  );
}
