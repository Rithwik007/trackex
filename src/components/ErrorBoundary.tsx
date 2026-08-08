import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[React ErrorBoundary caught error]:', error, errorInfo);
  }

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          background: '#0B0B0F',
          color: '#F5F5F7',
          textAlign: 'center',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: '#8A8A93', maxWidth: 360, marginBottom: 20 }}>
            {this.state.error?.message || 'An unexpected error occurred. Please try reloading.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '10px 20px',
              borderRadius: 12,
              background: '#00D9A3',
              color: '#0B0B0F',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Reload App
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
