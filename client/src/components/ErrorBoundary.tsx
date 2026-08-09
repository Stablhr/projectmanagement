import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-canvas p-6">
          <div className="max-w-md rounded-xl border border-line bg-surface p-6 shadow-sm">
            <h1 className="mb-2 text-lg font-semibold text-ink">
              Something went wrong
            </h1>
            <p className="mb-4 text-sm text-danger">
              {this.state.error.message || String(this.state.error)}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="rounded-lg bg-primary-500 px-4 py-2 text-sm font-medium text-white hover:bg-primary-600"
            >
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
