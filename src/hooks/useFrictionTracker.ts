import { useEffect } from 'react';

/**
 * Priority 3: Real Usage Observation Layer.
 * Tracks friction points (confusion, abandonment, rage-clicks).
 */
export const useFrictionTracker = (context: string) => {
    useEffect(() => {
        let clickCount = 0;
        let lastClickTime = Date.now();

        const handleClick = (e: MouseEvent) => {
            const now = Date.now();
            if (now - lastClickTime < 300) {
                clickCount++;
            } else {
                clickCount = 1;
            }
            lastClickTime = now;

            if (clickCount >= 3) {
                console.warn(`[FRICTION_DETECTED] Rage-click in ${context} on element:`, e.target);
                // Log to backend observability in production
                clickCount = 0;
            }
        };

        const handleVisibility = () => {
            if (document.visibilityState === 'hidden') {
                console.info(`[FRICTION_DETECTED] Tab backgrounded in ${context}`);
            }
        };

        window.addEventListener('click', handleClick);
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('click', handleClick);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [context]);
};
