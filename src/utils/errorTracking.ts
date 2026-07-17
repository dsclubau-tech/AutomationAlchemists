// Error tracking and logging utility
// Integrate with Sentry or similar service by adding SENTRY_DSN to secrets
import * as Sentry from "@sentry/react";

interface ErrorLog {
  message: string;
  stack?: string;
  context?: any;
  timestamp: Date;
  userId?: string;
}

class ErrorTracker {
  private errors: ErrorLog[] = [];
  private maxErrors = 100;

  constructor() {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      this.logError(event.error, { type: 'unhandled' });
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(new Error(event.reason), { type: 'unhandled_promise' });
    });
  }

  logError(error: Error, context?: any) {
    const errorLog: ErrorLog = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date(),
    };

    // Store in memory
    this.errors.push(errorLog);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error tracked:', errorLog);
    }

    // Send to backend or external service
    this.sendToBackend(errorLog);
  }

  private async sendToBackend(errorLog: ErrorLog) {
    try {
      if (import.meta.env.VITE_SENTRY_DSN) {
        Sentry.captureException(new Error(errorLog.message), {
          extra: {
            context: errorLog.context,
            stack: errorLog.stack
          }
        });
      } else {
        // Fallback or development logging
        import.meta.env.DEV && console.log('Error logged locally:', errorLog);
      }
    } catch (err) {
      console.error('Failed to send error log:', err);
    }
  }

  getErrors(): ErrorLog[] {
    return this.errors;
  }

  clearErrors() {
    this.errors = [];
  }
}

export const errorTracker = new ErrorTracker();
