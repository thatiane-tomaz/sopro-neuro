import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorCount: 0
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error);
    console.error('Error Info:', errorInfo);
    
    // Track error count to prevent infinite reload loops
    this.setState(prevState => ({
      errorCount: prevState.errorCount + 1
    }));
  }

  private handleReload = () => {
    // Only clear storage if we've had multiple errors (potential infinite loop)
    if (this.state.errorCount > 2) {
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error clearing storage:', e);
      }
    }
    window.location.reload();
  };

  private handleGoHome = () => {
    // Clear just the problematic state and go to home
    try {
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing session storage:', e);
    }
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full text-center shadow-xl">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Ops! Algo deu errado
            </h1>
            <p className="text-gray-600 mb-4 text-sm">
              O aplicativo encontrou um problema. Tente recarregar a página.
            </p>
            <div className="space-y-2">
              <button
                onClick={this.handleReload}
                className="w-full bg-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-primary/90 transition-colors"
              >
                Recarregar App
              </button>
              <button
                onClick={this.handleGoHome}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Voltar ao Início
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left text-xs text-gray-500">
                <summary className="cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.error.stack && (
                    <>
                      {'\n\n'}
                      {this.state.error.stack}
                    </>
                  )}
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
