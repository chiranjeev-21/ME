import type { MutableRefObject } from 'react';
import { OrbitalScene } from './OrbitalScene';
import type { OrbitalPresetName } from './camera.ts';

/** Development-only full-screen view used to tune the scene and render posters. */
export default function SceneHarness({
  preset,
  progress,
}: {
  preset: OrbitalPresetName;
  progress: MutableRefObject<number>;
}) {
  return (
    <div style={{ position: 'fixed', inset: 0 }} data-harness={preset}>
      <OrbitalScene
        preset={preset}
        progress={progress}
        poster={{ wide: '', tall: '' }}
        onLive={() => document.documentElement.setAttribute('data-scene-live', 'true')}
      />
    </div>
  );
}
