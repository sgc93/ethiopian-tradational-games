import { Component, Suspense, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { useBoardTextures } from '../textures';
import { BLUEPRINT } from './blueprint';
import type { Detail } from './bodyGeometry';
import { placeHead } from './headGeometry';
import { useBoardGeometry, type BoardGeometry } from './useBoardGeometry';
import { woodMaterial } from './woodMaterial';

/** The body's three (wood, sides, bowls), then the heads' and the horns'. */
type Materials = [THREE.Material, THREE.Material, THREE.Material, THREE.Material, THREE.Material];

function BoardMeshes({ geometry, materials }: { geometry: BoardGeometry; materials: Materials }) {
  const body = materials.slice(0, 3);
  const [, , , headWood, hornWood] = materials;
  const heads = useMemo(
    () =>
      (['A', 'B'] as const).map((end) => ({
        end,
        head: placeHead(geometry.head.clone(), end, BLUEPRINT),
        hornL: placeHead(geometry.hornL.clone(), end, BLUEPRINT),
        hornR: placeHead(geometry.hornR.clone(), end, BLUEPRINT),
      })),
    [geometry],
  );
  return (
    <group>
      <mesh geometry={geometry.body} material={body} castShadow receiveShadow />
      {heads.map((h) => (
        <group key={h.end}>
          <mesh geometry={h.head} material={headWood} castShadow receiveShadow />
          <mesh geometry={h.hornL} material={hornWood} castShadow receiveShadow />
          <mesh geometry={h.hornR} material={hornWood} castShadow receiveShadow />
        </group>
      ))}
    </group>
  );
}

function TexturedBoard({ geometry }: { geometry: BoardGeometry }) {
  const textures = useBoardTextures();
  const materials = useMemo(() => woodMaterial(textures), [textures]);
  return <BoardMeshes geometry={geometry} materials={materials} />;
}

/** Plain wanza-coloured wood, for when the textures cannot be loaded (offline before they were cached). */
function PlainBoard({ geometry }: { geometry: BoardGeometry }) {
  const materials = useMemo((): Materials => {
    const wood = new THREE.MeshPhysicalMaterial({ color: '#8a5a34', roughness: 0.52, clearcoat: 0.28, clearcoatRoughness: 0.42 });
    const bowls = new THREE.MeshStandardMaterial({ color: '#5e3b20', roughness: 0.5 });
    return [wood, wood, bowls, wood, wood];
  }, []);
  return <BoardMeshes geometry={geometry} materials={materials} />;
}

/** Shows the fallback when loading the textures throws, so a missing file never costs the board. */
class TextureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/** The carved board: body, two ibex heads and their horns. Nothing until the geometry is built. */
export function Board({ detail = 'full' }: { detail?: Detail }) {
  const geometry = useBoardGeometry(detail);
  if (!geometry) return null;
  return (
    <TextureBoundary fallback={<PlainBoard geometry={geometry} />}>
      <Suspense fallback={<PlainBoard geometry={geometry} />}>
        <TexturedBoard geometry={geometry} />
      </Suspense>
    </TextureBoundary>
  );
}
