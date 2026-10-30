import type { Group, Material, Mesh, Raycaster, ShaderMaterial } from 'three';
import { unit } from './scrollMath.ts';

const noRaycast = (_raycaster: Raycaster) => {};

function opacityUniform(material: Material) {
  const shader = material as ShaderMaterial;
  return shader.isShaderMaterial ? shader.uniforms.uOpacity : undefined;
}

export function createExpeditionLayer(root: Group) {
  const materials = new Set<Material>();
  const meshes: { mesh: Mesh; raycast: Mesh['raycast'] }[] = [];
  const knownMeshes = new Set<Mesh>();
  const visible = root.visible;
  const markerOpacity = root.userData.expeditionOpacity;
  const collect = () =>
    root.traverse(object => {
      const mesh = object as Mesh;
      if (!mesh.material) return;
      const values = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      values.forEach(material => materials.add(material));
      if (mesh.raycast && !knownMeshes.has(mesh)) {
        knownMeshes.add(mesh);
        meshes.push({ mesh, raycast: mesh.raycast });
      }
    });
  const capture = (material: Material) => ({
    material,
    opacity: material.opacity,
    depthWrite: material.depthWrite,
    transparent: material.transparent,
    shaderOpacity: opacityUniform(material)?.value,
  });
  collect();
  const surfaces = Array.from(materials, capture);
  surfaces.forEach(({ material }) => {
    material.transparent = true;
    material.needsUpdate = true;
  });
  let previous = -1;
  const controller = {
    refresh() {
      const known = new Set(surfaces.map(surface => surface.material));
      collect();
      materials.forEach(material => {
        if (known.has(material)) return;
        surfaces.push(capture(material));
        material.transparent = true;
        material.needsUpdate = true;
      });
      const opacity = previous;
      previous = -1;
      if (opacity >= 0) controller.setOpacity(opacity);
    },
    setOpacity(value: number) {
      const opacity = unit(value);
      if (opacity === previous) return;
      previous = opacity;
      root.visible = opacity > 0.001;
      root.userData.expeditionOpacity = opacity;
      surfaces.forEach(({ material, opacity: base, depthWrite }) => {
        material.opacity = base * opacity;
        material.depthWrite = depthWrite && opacity > 0.995;
        const uniform = opacityUniform(material);
        if (uniform) uniform.value = opacity;
      });
      meshes.forEach(({ mesh, raycast }) => {
        mesh.raycast = opacity > 0.05 ? raycast : noRaycast;
      });
    },
    dispose() {
      root.visible = visible;
      if (markerOpacity === undefined) delete root.userData.expeditionOpacity;
      else root.userData.expeditionOpacity = markerOpacity;
      surfaces.forEach(({ material, opacity, depthWrite, transparent, shaderOpacity }) => {
        material.opacity = opacity;
        material.depthWrite = depthWrite;
        material.transparent = transparent;
        material.needsUpdate = true;
        const uniform = opacityUniform(material);
        if (uniform) uniform.value = shaderOpacity;
      });
      meshes.forEach(({ mesh, raycast }) => {
        mesh.raycast = raycast;
      });
    },
  };
  return controller;
}
