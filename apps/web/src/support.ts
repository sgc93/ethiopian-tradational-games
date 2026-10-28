/** True when the browser can give us a WebGL 2 context, which the 3D board needs. */
export function supportsWebGL2(doc: Document = document): boolean {
  try {
    return Boolean(doc.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}
