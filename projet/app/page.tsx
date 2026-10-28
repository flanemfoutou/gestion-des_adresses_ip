'use client';

import { useState } from 'react';
import { Dashboard } from '@/components/dashboard';
import { ManagementWorkspace } from '@/components/management-workspace';

export type WorkspacePage = 'overview' | 'bases' | 'networks' | 'clients' | 'ips';

export default function HomePage() {
  const [page, setPage] = useState<WorkspacePage>('overview');

  if (page === 'overview') return <Dashboard onNavigate={setPage} />;
  return <ManagementWorkspace initialPage={page} onNavigate={setPage} />;
}
