'use client';

import { Component, type ReactNode, type ErrorInfo } from 'react';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo,
    });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  handleReportIssue = (): void => {
    const subject = encodeURIComponent('Application Error Report');
    const body = encodeURIComponent(
      `Error: ${this.state.error?.message || 'Unknown error'}\n\n` +
      `Stack: ${this.state.error?.stack || 'No stack trace'}\n\n` +
      `Component Stack: ${this.state.errorInfo?.componentStack || 'No component stack'}`
    );
    window.location.href = `mailto:support@cortexbuild.com?subject=${subject}&body=${body}`;
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-12 h-12 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-6">
              We encountered an unexpected error. This has been logged and we&apos;ll work to fix it.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 text-left">
                <div className="bg-gray-100 rounded-lg p-4 text-xs font-mono overflow-auto max-h-40">
                  <p className="font-bold text-red-600 mb-2">{this.state.error.message}</p>
                  <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-3">
                <Button
                  onClick={this.handleReload}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  className="flex-1 flex items-center justify-center gap-2"
                  variant="secondary"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              </div>

              <Button
                onClick={this.handleReportIssue}
                className="w-full flex items-center justify-center gap-2"
                variant="outline"
              >
                <Mail className="w-4 h-4" />
                Report Issue
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface PageErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function PageError({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
}: PageErrorProps): ReactNode {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="text-center p-8">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600 mb-6">{message}</p>

        {onRetry && (
          <Button onClick={onRetry} variant="default">
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

interface AsyncErrorProps {
  error: Error | null;
  reset?: () => void;
}

export function AsyncError({ error, reset }: AsyncErrorProps): ReactNode {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-red-900 mb-2">Error</h3>
      <p className="text-red-700 mb-4">{error.message}</p>
      {reset && (
        <Button onClick={reset} variant="default" size="sm">
          Try Again
        </Button>
      )}
    </div>
  );
}
