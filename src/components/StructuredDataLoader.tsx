'use client';

import dynamic from 'next/dynamic';

const StructuredData = dynamic(() => import('@/components/StructuredData'), {
  ssr: false,
});

export function StructuredDataLoader() {
  return <StructuredData />;
}

