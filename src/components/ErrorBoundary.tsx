import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
  }

  private handleReload = () => {
    // Clear any cached state that might cause the error
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-xl">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              O aplicativo encontrou um problema. Tente recarregar a página.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Recarregar App
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left text-xs text-gray-500">
                <summary className="cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
