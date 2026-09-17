import React from 'react';

export class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unexpected application error.' };
  }

  componentDidCatch(error, info) {
    console.error('Pravedā application error:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, message: '' });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="pr-error-shell" role="alert">
        <div className="pr-error-card">
          <div className="pr-error-icon">!</div>
          <span className="pr-section-kicker">Pravedā</span>
          <h1>We couldn't load this screen.</h1>
          <p>The application hit an unexpected error. Your saved Supabase data has not been intentionally deleted.</p>
          {import.meta.env?.DEV && this.state.message ? (
            <details className="pr-error-details">
              <summary>Developer details</summary>
              <code>{this.state.message}</code>
            </details>
          ) : null}
          <div className="pr-error-actions">
            <button type="button" className="pr-primary-cta pr-primary-cta-dark" onClick={this.handleReset}>Try again</button>
            <button type="button" className="pr-secondary-cta-light" onClick={() => window.location.assign('/')}>Return home</button>
          </div>
        </div>
      </main>
    );
  }
}
