import { useLayoutEffect, useMemo, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { AnimationMixer, Box3, Vector3 } from 'three';
import type { Material, Mesh, Object3D, SkinnedMesh } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { useFrame } from '@react-three/fiber';
import type { ExpeditionFrame, WorldId } from '../../types';
import type { MutableRefObject } from 'react';
import { SceneMarker } from '../SceneMarker';

interface Props {
  url: string;
  height: number;
  clip?: string;
  reducedMotion: boolean;
  journey: MutableRefObject<ExpeditionFrame>;
  world: WorldId;
  onReady: () => void;
  phase?: number;
  stride?: MutableRefObject<number>;
}

export function Model({
  url,
  height,
  clip,
  reducedMotion,
  journey,
  world,
  onReady,
  phase = 0,
  stride,
}: Props) {
  const source = useGLTF(url);
  const instance = useMemo(() => {
    const model = clone(source.scene);
    const materials = new Set<Material>();
    model.traverse(object => {
      const mesh = object as Mesh;
      if (!mesh.material) return;
      const copy = (original: Material) => {
        const material = original.clone();
        materials.add(material);
        return material;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(copy) : copy(mesh.material);
    });
    const mixer = new AnimationMixer(model);
    const animation = source.animations.find(item => item.name === clip) || source.animations[0];
    if (animation) {
      mixer.clipAction(animation).play();
      mixer.setTime(phase);
    }
    // Skin bounds must use the posed clone, not stale matrices inherited from the cached asset.
    model.updateMatrixWorld(true);
    model.traverse(object => {
      const skin = object as SkinnedMesh;
      if (skin.isSkinnedMesh) {
        skin.skeleton.update();
        skin.computeBoundingBox();
      }
    });
    const bounds = new Box3().setFromObject(model);
    const center = bounds.getCenter(new Vector3());
    const scale = height / Math.max(bounds.getSize(new Vector3()).y, 0.01);
    const limbs = ['leftLeg', 'rightLeg', 'leftArm', 'rightArm'].map(name =>
      model.getObjectByName(name)
    );
    return {
      model,
      materials,
      mixer,
      scale,
      offset: [-center.x * scale, -bounds.min.y * scale, -center.z * scale] as [
        number,
        number,
        number,
      ],
      limbs,
    };
  }, [source.scene, source.animations, height, clip, phase]);
  const mixer = instance.mixer;
  useLayoutEffect(() => {
    onReady();
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(instance.model);
    };
  }, [mixer, instance, onReady]);
  useEffect(() => () => instance.materials.forEach(material => material.dispose()), [instance]);
  useFrame((_, delta) => {
    if (
      journey.current.world !== world ||
      journey.current.entry < 0.2 ||
      reducedMotion ||
      (!source.animations.length && !stride)
    )
      return;
    mixer.update(Math.min(delta, 0.05));
    if (stride)
      instance.limbs.forEach((limb: Object3D | undefined, index) => {
        if (limb) limb.rotation.x = stride.current * (index % 2 ? -1 : 1);
      });
  });
  return (
    <group position={instance.offset} scale={instance.scale} dispose={null}>
      <primitive object={instance.model} dispose={null} />
      <SceneMarker
        attributes={{ 'data-model': url.split('/').pop()?.replace('.glb', '') || 'model' }}
      />
    </group>
  );
}
