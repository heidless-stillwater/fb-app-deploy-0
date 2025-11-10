"use client";

import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { FileManagerPage } from '@/components/file-manager-page';

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-16 w-16 animate-spin" />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<Loading />}>
      <FileManagerPage />
    </Suspense>
  );
}
