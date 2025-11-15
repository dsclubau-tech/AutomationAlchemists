import { useEffect } from 'react';
import { analytics } from '@/utils/analytics';

export const usePerformance = (pageName: string) => {
  useEffect(() => {
    // Track page load performance
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;

      // Log performance metrics
      analytics.trackEvent('page_performance', {
        page: pageName,
        pageLoadTime,
        connectTime,
        renderTime,
      });

      // Warn if page load is slow
      if (pageLoadTime > 3000) {
        console.warn(`Slow page load detected for ${pageName}: ${pageLoadTime}ms`);
      }
    }
  }, [pageName]);
};
