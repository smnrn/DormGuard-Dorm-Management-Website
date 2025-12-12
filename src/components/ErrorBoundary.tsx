import { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full border-2 border-red-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-600">
                <AlertTriangle className="w-6 h-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-900 mb-2">
                  <strong>Error:</strong>
                </p>
                <p className="text-red-700 text-sm font-mono">
                  {this.state.error?.toString()}
                </p>
              </div>

              {this.state.errorInfo && (
                <details className="bg-slate-100 border border-slate-300 rounded-lg p-4">
                  <summary className="cursor-pointer text-slate-700 mb-2">
                    <strong>Error Details</strong>
                  </summary>
                  <pre className="text-xs text-slate-600 overflow-auto max-h-64">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-3">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Reload Page
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    console.log('Error State:', this.state);
                    alert('Error details logged to console. Press F12 to view.');
                  }}
                >
                  Show Console
                </Button>
              </div>

              <div className="text-sm text-slate-600 mt-4">
                <p>If this issue persists:</p>
                <ol className="list-decimal list-inside space-y-1 mt-2">
                  <li>Open Developer Tools (F12)</li>
                  <li>Check the Console tab for errors</li>
                  <li>Check the Network tab for failed requests</li>
                  <li>Try clearing your browser cache</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
