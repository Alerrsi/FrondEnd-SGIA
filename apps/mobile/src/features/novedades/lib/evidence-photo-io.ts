import { File as DeviceFile } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ImagePickerAsset } from 'expo-image-picker';

import type { EvidencePhoto } from '@/features/novedades/lib/evidence-photo';

const MAX_SIDE_PX = 1600;
const JPEG_QUALITY = 0.7;

/** Reduce la foto y la deja en JPEG (también convierte HEIC): el servidor puede limitar la subida. */
export async function prepareEvidencePhoto(asset: ImagePickerAsset): Promise<EvidencePhoto> {
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_SIDE_PX) {
    context.resize(asset.width >= asset.height ? { width: MAX_SIDE_PX } : { height: MAX_SIDE_PX });
  }
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
  const file = new DeviceFile(saved.uri);

  return { uri: saved.uri, name: file.name, type: 'image/jpeg', size: file.size };
}

/** El `fetch` de Expo no admite partes `{ uri, name, type }` en `FormData`: necesita un `File` propio. */
export function toUploadFile(photo: EvidencePhoto): Blob {
  return new DeviceFile(photo.uri);
}
