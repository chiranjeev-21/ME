import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, Fog } from 'three';
import type { Group } from 'three';
import type { UniverseSceneProps, WorldDefinition, WorldId } from '../../types';
import type { Point3 } from '../math.ts';
import {
  chapterReveal,
  expeditionProgress,
  interiorLandmark,
  interiorTransform,
  smoothRange,
} from '../scrollMath.ts';
import { SceneMarker } from '../SceneMarker';
import { useExpeditionLayer } from '../useExpeditionLayer';
import { ArchiveLibrary, RecoveryFoundry, ResearchObservatory } from './BuiltWorlds';
import { ContourGarden, OceanIsland } from './QuietWorlds';
import { CommunicationsCoast, ProjectSpaceport } from './SignalWorlds';
import { Ground, Sky } from './Scenery';
import { useWorldSignal } from './useWorldSignal';

const ATMOSPHERES: Record<
  WorldId,
  { top: string; horizon: string; ground: string; landmark: string }
> = {
  about: {
    top: '#102d42',
    horizon: '#465f69',
    ground: '#344f50',
    landmark: 'island-canopy',
  },
  engineering: {
    top: '#15242e',
    horizon: '#586264',
    ground: '#343d3e',
    landmark: 'recovery-gateway',
  },
  'ai-lab': {
    top: '#17152e',
    horizon: '#53526f',
    ground: '#35364d',
    landmark: 'research-observatory',
  },
  projects: {
    top: '#292c3c',
    horizon: '#786558',
    ground: '#65564c',
    landmark: 'spaceport-control',
  },
  creative: {
    top: '#183b3a',
    horizon: '#6c8271',
    ground: '#465d4d',
    landmark: 'contour-garden',
  },
  writing: {
    top: '#142634',
    horizon: '#526879',
    ground: '#424e53',
    landmark: 'archive-reading-lens',
  },
  contact: {
    top: '#30303c',
    horizon: '#87745c',
    ground: '#6c6251',
    landmark: 'communications-beacon',
  },
};

interface Props {
  world: WorldDefinition;
  position: Point3;
  journey: NonNullable<UniverseSceneProps['journey']>;
  interaction: UniverseSceneProps['interaction'];
  high: boolean;
  reducedMotion: boolean;
  projectMarkers: UniverseSceneProps['projectMarkers'];
  onProjectSelect: UniverseSceneProps['onProjectSelect'];
  onRendered: () => void;
}

function ScrollAtmosphere({
  world,
  journey,
  reducedMotion,
}: Pick<Props, 'world' | 'journey' | 'reducedMotion'>) {
  const { scene } = useThree();
  const fog = useMemo(() => new Fog('#030509', 300, 350), []);
  const orbitColor = useMemo(() => new Color('#030509'), []);
  const horizon = useMemo(() => new Color(ATMOSPHERES[world.id].horizon), [world.id]);
  useEffect(() => {
    const previousFog = scene.fog;
    scene.fog = fog;
    return () => {
      scene.fog = previousFog;
      if (scene.background instanceof Color) scene.background.copy(orbitColor);
    };
  }, [fog, orbitColor, scene]);
  useFrame(() => {
    const progress = expeditionProgress(journey.current, reducedMotion);
    const blend = smoothRange(progress.entry, 0.1, 0.8);
    fog.color.lerpColors(
      orbitColor,
      horizon,
      blend * chapterReveal(journey.current, reducedMotion)
    );
    fog.near = world.radius * 0.25 + (1 - blend) * 350;
    fog.far = world.radius * 4 + (1 - blend) * 700;
    if (scene.background instanceof Color) {
      scene.background.copy(fog.color);
    }
  }, -25);
  return null;
}

export function WorldEnvironment({
  world,
  position,
  journey,
  interaction,
  high,
  reducedMotion,
  projectMarkers,
  onProjectSelect,
  onRendered,
}: Props) {
  const root = useRef<Group>(null);
  const atmosphere = ATMOSPHERES[world.id];
  const transform = interiorTransform(position, world.radius);
  const signal = useWorldSignal(world.id, interaction, reducedMotion);
  useExpeditionLayer(root, journey, reducedMotion, 'interior');
  useFrame(() => {
    root.current?.position.set(
      position[0],
      position[1] - world.radius * 0.18,
      position[2] + world.radius * 0.12
    );
  }, -25);
  const scenery = { high, reducedMotion, signal, onRendered };
  return (
    <>
      <ScrollAtmosphere world={world} journey={journey} reducedMotion={reducedMotion} />
      <group ref={root} position={transform.position} scale={transform.scale}>
        <Sky top={atmosphere.top} horizon={atmosphere.horizon} />
        {world.id !== 'about' && <Ground color={atmosphere.ground} onRendered={onRendered} />}
        {world.id === 'about' && <OceanIsland {...scenery} />}
        {world.id === 'engineering' && <RecoveryFoundry {...scenery} />}
        {world.id === 'ai-lab' && <ResearchObservatory {...scenery} />}
        {world.id === 'projects' && (
          <ProjectSpaceport
            {...scenery}
            markers={projectMarkers}
            onProjectSelect={onProjectSelect}
          />
        )}
        {world.id === 'creative' && <ContourGarden {...scenery} />}
        {world.id === 'writing' && <ArchiveLibrary {...scenery} />}
        {world.id === 'contact' && <CommunicationsCoast {...scenery} />}
        <SceneMarker
          position={interiorLandmark(world.id)}
          attributes={{
            'data-world-environment': world.id,
            'data-environment-landmark': atmosphere.landmark,
          }}
        />
      </group>
    </>
  );
}
