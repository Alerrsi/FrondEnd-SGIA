import type { ImagePickerAsset } from 'expo-image-picker';

import type { EvidencePhoto } from '@/features/novedades/lib/evidence-photo';

/** En web el selector ya entrega un `File`; se envía tal cual. */
export async function prepareEvidencePhoto(asset: ImagePickerAsset): Promise<EvidencePhoto> {
  const type = asset.mimeType ?? 'image/jpeg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `evidencia.${type.split('/')[1] ?? 'jpg'}`,
    type,
    size: asset.fileSize,
    file: asset.file,
  };
}

export function toUploadFile(photo: EvidencePhoto): Blob {
  if (!photo.file) throw new Error('La foto no tiene un archivo para enviar.');
  return photo.file;
}
