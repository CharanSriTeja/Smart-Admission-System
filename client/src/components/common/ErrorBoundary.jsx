import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="login-bg min-h-screen flex items-center justify-center p-6 relative">
          {/* Floating Orbs */}
          <div className="login-orb" />
          <div className="login-orb" />
          
          <div className="relative z-10 w-full max-w-md animate-scale-in">
            <div className="glass-card backdrop-blur-xl bg-white/40 dark:bg-primary-950/40 p-8 rounded-2xl shadow-xl border border-white/20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6 shadow-lg shadow-red-500/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                An unexpected error occurred in the application. Please try reloading or returning home.
              </p>
              
              {this.state.error?.message && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-left overflow-x-auto max-h-32 text-xs font-mono text-red-700 dark:text-red-400">
                  {this.state.error.message}
                </div>
              )}
              
              <div className="flex gap-4">
                <button
                  onClick={this.handleReset}
                  className="flex-1 glass-button py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-red-500/25 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reload Page
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                    window.location.href = '/';
                  }}
                  className="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
