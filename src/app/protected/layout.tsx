'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import Header from '../../components/Header';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <Skeleton height={32} width={150} />
            <div className="flex items-center gap-4">
              <Skeleton height={32} width={100} />
              <Skeleton height={32} width={100} />
              <Skeleton circle width={40} height={40} />
            </div>
          </div>
        </div>
        
        {/* Main Content Skeleton */}
        <div className="p-8">
          <div className="max-w-7xl mx-auto">
            <Skeleton height={40} width={300} className="mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow p-6">
                  <Skeleton height={24} width={150} className="mb-2" />
                  <Skeleton height={36} width={100} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © 2026 <span className="font-semibold text-gray-700">Workpax</span>. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
