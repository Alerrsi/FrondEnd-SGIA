import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import { Button } from './button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleReload = () => {
    window.location.reload();
  };

  override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-6 text-center shadow-xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 mb-3">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Ocurrió un error inesperado al renderizar el módulo
          </h2>
          <p className="mt-1 max-w-md text-xs text-zinc-600 dark:text-zinc-400 font-mono">
            {this.state.error?.message || 'Error desconocido'}
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="text-xs"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
              Reintentar
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={this.handleReload}
              className="text-xs"
            >
              Recargar página
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
