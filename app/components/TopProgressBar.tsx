'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import NProgress from 'nprogress';

NProgress.configure({ showSpinner: false });

export default function TopProgressBar() {
    const pathname = usePathname();
    const prevPathRef = useRef(pathname);

    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            NProgress.start();
            // Simulate route loading duration
            const timer = setTimeout(() => {
                NProgress.done();
            }, 300); // or adjust based on UX preference

            prevPathRef.current = pathname;

            return () => clearTimeout(timer);
        }
    }, [pathname]);

    return null;
}
