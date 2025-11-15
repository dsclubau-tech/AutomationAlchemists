// Real-time monitoring utilities for production

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];

  trackMetric(name: string, value: number) {
    this.metrics.push({
      name,
      value,
      timestamp: new Date(),
    });

    // Keep only last 100 metrics
    if (this.metrics.length > 100) {
      this.metrics.shift();
    }

    // Log slow operations
    if (value > 1000) {
      console.warn(`Slow operation detected: ${name} took ${value}ms`);
    }
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getAverageMetric(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    const sum = filtered.reduce((acc, m) => acc + m.value, 0);
    return sum / filtered.length;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Helper to measure async function execution time
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const duration = performance.now() - start;
    performanceMonitor.trackMetric(name, duration);
  }
}
