// app/components/TopProgressBarClientWrapper.tsx
'use client';

import dynamic from 'next/dynamic';

// Dynamically import TopProgressBar client-side only
const TopProgressBar = dynamic(() => import('./TopProgressBar'), {
    ssr: false,
});

export default function TopProgressBarClientWrapper() {
    return <TopProgressBar />;
}
