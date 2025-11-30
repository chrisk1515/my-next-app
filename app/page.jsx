'use client';

import dynamic from 'next/dynamic';

const Solar3D = dynamic(() => import('../components/Solar3D'), { ssr: false });

export default function Page() {
  return <Solar3D />;
}
