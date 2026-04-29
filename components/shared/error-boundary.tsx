"use client";

import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            alignItems: "center",
            background: "#040404",
            color: "#f8f3e8",
            display: "flex",
            flexDirection: "column",
            fontFamily: "system-ui, sans-serif",
            gap: "16px",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#ffc107", fontSize: "13px", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            HashTag Cafe
          </p>
          <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: "#aca48e", fontSize: "14px", margin: 0, maxWidth: "320px" }}>
            The app encountered an error. Please reload to continue.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              background: "#ffc107",
              border: "none",
              borderRadius: "12px",
              color: "#000",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 700,
              marginTop: "8px",
              padding: "12px 28px",
            }}
          >
            Reload app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
