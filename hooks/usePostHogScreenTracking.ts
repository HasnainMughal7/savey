import { posthog } from '@/lib/posthog';
import { usePathname } from 'expo-router';
import { useEffect, useRef } from 'react';

export function usePostHogScreenTracking() {
    const pathname = usePathname();
    const previousPathname = useRef<string | undefined>(undefined);

    useEffect(() => {
        if (!posthog || !pathname) return;

        // Same screen ko unnecessarily dobara capture na karo
        if (previousPathname.current === pathname) return;

        posthog.screen(pathname, {
            previous_screen: previousPathname.current ?? null,
        });

        previousPathname.current = pathname;
    }, [pathname]);
}