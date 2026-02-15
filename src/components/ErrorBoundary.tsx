"use client";

import React, { Component, type ErrorInfo, type ReactNode } from "react";

// ---------------------------------------------------------------------------
// Props & State
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// ---------------------------------------------------------------------------
// ErrorBoundary
//
// A class-based error boundary (required by React) that catches rendering
// errors in its subtree and displays a styled recovery card matching the
// app's dark theme.
// ---------------------------------------------------------------------------

export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log to the console in development; this could be wired to an
    // external error-reporting service in production.
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Allow a completely custom fallback
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default styled error card
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-800 bg-gray-900/80 p-8 shadow-xl backdrop-blur">
            {/* Icon */}
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Heading */}
            <h2 className="mb-2 text-xl font-bold tracking-tight text-gray-100">
              Something went wrong
            </h2>

            {/* Description */}
            <p className="mb-6 text-sm leading-relaxed text-gray-400">
              An unexpected error occurred while rendering this part of the
              application. You can try again, and if the problem persists please
              refresh the page.
            </p>

            {/* Error details (collapsible in production, shown in dev) */}
            {this.state.error && (
              <details className="mb-6 rounded-xl border border-gray-700/50 bg-gray-800/50 p-4">
                <summary className="cursor-pointer text-xs font-semibold uppercase tracking-widest text-gray-500">
                  Error details
                </summary>
                <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-gray-400">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <>
                      {"\n\n"}
                      {this.state.error.stack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Retry button */}
            <button
              onClick={this.handleRetry}
              className="w-full rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:bg-indigo-500 hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
