import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

export class SceneBoundary extends Component<
  { children: ReactNode; onError: (reason: string) => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    this.props.onError(
      'The 3D renderer could not start. All destinations remain available in Browse Mode.'
    );
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}
