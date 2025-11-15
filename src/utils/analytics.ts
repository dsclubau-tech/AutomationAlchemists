// Analytics utility
// Add GOOGLE_ANALYTICS_ID to implement Google Analytics

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
}

class Analytics {
  private events: AnalyticsEvent[] = [];
  private isEnabled = false;

  constructor() {
    // Check if analytics is enabled (e.g., Google Analytics script loaded)
    this.isEnabled = typeof window !== 'undefined' && !!(window as any).gtag;
  }

  trackPageView(path: string) {
    if (this.isEnabled && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: path,
      });
    }
    
    this.logEvent('page_view', { path });
  }

  trackEvent(name: string, properties?: Record<string, any>) {
    if (this.isEnabled && (window as any).gtag) {
      (window as any).gtag('event', name, properties);
    }
    
    this.logEvent(name, properties);
  }

  private logEvent(name: string, properties?: Record<string, any>) {
    const event: AnalyticsEvent = { name, properties };
    this.events.push(event);
    
    if (import.meta.env.DEV) {
      console.log('Analytics event:', event);
    }
  }

  getEvents(): AnalyticsEvent[] {
    return this.events;
  }
}

export const analytics = new Analytics();
