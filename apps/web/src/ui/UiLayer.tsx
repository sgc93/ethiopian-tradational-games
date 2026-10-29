import type { ReactNode } from 'react';
import './kit/kit.css';
import { useUiMetrics } from './useUiMetrics';

/** The scaled interface layer over the scene; every screen renders inside it. */
export function UiLayer({ children }: { children: ReactNode }) {
  const { compact } = useUiMetrics();
  return (
    <div className="ui-layer" data-compact={compact ? 'true' : 'false'}>
      {children}
    </div>
  );
}
