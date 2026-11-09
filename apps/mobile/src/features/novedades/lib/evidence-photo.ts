/** Foto elegida en el formulario. `file` solo existe en web. */
export interface EvidencePhoto {
  uri: string;
  name: string;
  type: string;
  size?: number;
  file?: File;
}

export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;
export const PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
