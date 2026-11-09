import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { EvidencePhoto } from '@/features/novedades/lib/evidence-photo';
import { useTheme } from '@/hooks/use-theme';

interface PhotoFieldProps {
  value: EvidencePhoto | null;
  onChange: (photo: EvidencePhoto | null) => void;
}

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.7,
};

function toPhoto(asset: ImagePicker.ImagePickerAsset): EvidencePhoto {
  const type = asset.mimeType ?? 'image/jpeg';
  return {
    uri: asset.uri,
    name: asset.fileName ?? `evidencia.${type.split('/')[1] ?? 'jpg'}`,
    type,
    size: asset.fileSize,
    file: asset.file,
  };
}

/** Foto de evidencia opcional, tomada con la cámara o elegida de la galería. */
export function PhotoField({ value, onChange }: PhotoFieldProps) {
  const theme = useTheme();

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Sin acceso a la cámara', 'Permite el acceso en los ajustes o elige una foto.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onChange(toPhoto(result.assets[0]));
  };

  const pickPhoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (!result.canceled && result.assets[0]) onChange(toPhoto(result.assets[0]));
  };

  const buttonStyle = [styles.button, { borderColor: theme.backgroundSelected }];

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable onPress={() => void takePhoto()} accessibilityRole="button" style={buttonStyle}>
          <ThemedText type="small">Tomar foto</ThemedText>
        </Pressable>
        <Pressable onPress={() => void pickPhoto()} accessibilityRole="button" style={buttonStyle}>
          <ThemedText type="small">Elegir de la galería</ThemedText>
        </Pressable>
      </View>

      {value && (
        <View style={styles.preview}>
          <Image
            source={{ uri: value.uri }}
            style={styles.image}
            contentFit="cover"
            accessibilityLabel="Foto de evidencia seleccionada"
          />
          <Pressable onPress={() => onChange(null)} accessibilityRole="button" hitSlop={8}>
            <ThemedText type="small" themeColor="textSecondary">
              Quitar foto
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
});
