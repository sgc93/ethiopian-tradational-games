// The part of three's bundled meshoptimizer simplifier the head build uses (it ships without types).
declare module 'three/examples/jsm/libs/meshopt_simplifier.module.js' {
  export const MeshoptSimplifier: {
    ready: Promise<void>;
    /** Returns the kept triangles' indices and the error reached, relative to the mesh's size. */
    simplify(
      indices: Uint32Array,
      positions: Float32Array,
      stride: number,
      targetIndexCount: number,
      targetError: number,
      flags?: string[],
    ): [Uint32Array, number];
  };
}
