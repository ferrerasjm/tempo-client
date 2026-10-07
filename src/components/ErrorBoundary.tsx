import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { failed: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      "Cafe Tempo could not render the current screen.",
      error,
      info,
    );
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page narrow" role="alert">
        <p className="eyebrow">Something went wrong</p>
        <h1>This corner needs a quick reset.</h1>
        <p>
          Reload the page to try again. Your saved cafe data will remain on the
          server.
        </p>
        <div className="button-row">
          <button
            className="button"
            type="button"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
          <a className="text-link" href="/">
            Return to Cafe Entrance
          </a>
        </div>
      </main>
    );
  }
}
