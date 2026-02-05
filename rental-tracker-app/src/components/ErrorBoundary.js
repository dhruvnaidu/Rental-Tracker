import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 p-4">
          <div className="card w-96 bg-base-100 shadow-xl border-l-4 border-error">
            <div className="card-body items-center text-center">
              <h2 className="card-title text-error text-2xl font-black">Oops!</h2>
              <p className="py-2">Something went wrong in this section.</p>
              <div className="card-actions">
                <button 
                  className="btn btn-primary btn-sm" 
                  onClick={() => window.location.reload()}
                >
                  Reload Page
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