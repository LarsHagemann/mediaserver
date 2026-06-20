import { Component, type ReactNode } from "react";

type Props = {
  /** Identifies the failing plugin in the fallback message and console. */
  pluginName: string;
  children: ReactNode;
};

type State = {
  hasError: boolean;
};

/**
 * Isolates third-party plugin render output so a throw inside a plugin cannot
 * take down the surrounding view.
 */
export class PluginErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`Plugin "${this.props.pluginName}" failed to render:`, error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-xs text-text-muted italic">
          {this.props.pluginName} failed to render.
        </div>
      );
    }
    return this.props.children;
  }
}
