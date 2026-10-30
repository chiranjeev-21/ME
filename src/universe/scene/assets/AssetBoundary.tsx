import { Component, Suspense } from 'react';
import type { ReactNode } from 'react';

class LocalAssetBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function AssetBoundary({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return (
    <LocalAssetBoundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </LocalAssetBoundary>
  );
}
