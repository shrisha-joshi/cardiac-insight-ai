/**
 * Phase 8: Performance Monitoring Utility
 * Tracks bundle size, load times, and performance metrics
 */

interface PerformanceMetrics {
  pageLoad: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  timeToInteractive: number;
  totalBlockingTime: number;
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (typeof window === "undefined" || !window.performance) {
      return;
    }

    // Wait for page load
    if (document.readyState === "complete") {
      this.captureMetrics();
    } else {
      window.addEventListener("load", () => this.captureMetrics());
    }

    // Capture Web Vitals
    this.captureWebVitals();
  }

  /**
   * Capture core performance metrics
   */
  private captureMetrics(): void {
    const perfData = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
    
    if (!perfData) return;

    this.metrics = {
      pageLoad: perfData.loadEventEnd - perfData.fetchStart,
      domContentLoaded: perfData.domContentLoadedEventEnd - perfData.fetchStart,
      timeToInteractive: perfData.domInteractive - perfData.fetchStart,
    };

    // Capture paint metrics
    const paintMetrics = performance.getEntriesByType("paint");
    paintMetrics.forEach((entry) => {
      if (entry.name === "first-paint") {
        this.metrics.firstPaint = entry.startTime;
      } else if (entry.name === "first-contentful-paint") {
        this.metrics.firstContentfulPaint = entry.startTime;
      }
    });

    if (import.meta.env.DEV) {
      this.logMetrics();
    }
  }

  /**
   * Capture Web Vitals (LCP, FID, CLS)
   */
  private captureWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.metrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
        });
        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // Observer not supported
      }
    }
  }

  /**
   * Log metrics to console (dev only)
   */
  private logMetrics(): void {
    console.group("📊 Performance Metrics (Phase 8)");
    console.log("Page Load:", this.formatTime(this.metrics.pageLoad));
    console.log("DOM Content Loaded:", this.formatTime(this.metrics.domContentLoaded));
    console.log("First Paint:", this.formatTime(this.metrics.firstPaint));
    console.log("First Contentful Paint:", this.formatTime(this.metrics.firstContentfulPaint));
    console.log("Largest Contentful Paint:", this.formatTime(this.metrics.largestContentfulPaint));
    console.log("Time to Interactive:", this.formatTime(this.metrics.timeToInteractive));
    console.groupEnd();

    // Performance scoring
    this.scorePerformance();
  }

  /**
   * Score performance based on metrics
   */
  private scorePerformance(): void {
    const fcp = this.metrics.firstContentfulPaint || 0;
    const lcp = this.metrics.largestContentfulPaint || 0;

    let score = "Unknown";
    let color = "gray";

    if (fcp < 1800 && lcp < 2500) {
      score = "Excellent ✅";
      color = "green";
    } else if (fcp < 3000 && lcp < 4000) {
      score = "Good 👍";
      color = "blue";
    } else if (fcp < 5000 && lcp < 6000) {
      score = "Needs Improvement ⚠️";
      color = "orange";
    } else {
      score = "Poor ❌";
      color = "red";
    }

    console.log(`%c Performance Score: ${score}`, `color: ${color}; font-weight: bold;`);
  }

  /**
   * Format time in ms
   */
  private formatTime(ms?: number): string {
    if (!ms) return "N/A";
    return `${ms.toFixed(2)}ms`;
  }

  /**
   * Get current metrics
   */
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  /**
   * Track custom timing
   */
  startTiming(label: string): () => void {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      if (import.meta.env.DEV) {
        console.log(`⏱️ ${label}: ${duration.toFixed(2)}ms`);
      }
      return duration;
    };
  }

  /**
   * Get bundle size estimate
   */
  async getBundleSize(): Promise<{ total: number; js: number; css: number }> {
    try {
      const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
      
      let totalSize = 0;
      let jsSize = 0;
      let cssSize = 0;

      resources.forEach((resource) => {
        const size = resource.transferSize || 0;
        totalSize += size;

        if (resource.name.endsWith(".js")) {
          jsSize += size;
        } else if (resource.name.endsWith(".css")) {
          cssSize += size;
        }
      });

      const result = {
        total: totalSize / 1024, // KB
        js: jsSize / 1024,
        css: cssSize / 1024,
      };

      if (import.meta.env.DEV) {
        console.log("📦 Bundle Size:", {
          total: `${result.total.toFixed(2)} KB`,
          js: `${result.js.toFixed(2)} KB`,
          css: `${result.css.toFixed(2)} KB`,
        });
      }

      return result;
    } catch (error) {
      console.error("Error calculating bundle size:", error);
      return { total: 0, js: 0, css: 0 };
    }
  }

  /**
   * Monitor memory usage (if available)
   */
  getMemoryUsage(): { used: number; total: number } | null {
    if ("memory" in performance && (performance as any).memory) {
      const mem = (performance as any).memory;
      return {
        used: mem.usedJSHeapSize / (1024 * 1024), // MB
        total: mem.totalJSHeapSize / (1024 * 1024), // MB
      };
    }
    return null;
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in browser
if (typeof window !== "undefined") {
  performanceMonitor.init();
}
