import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { EvidencePhoto } from '@/features/novedades/lib/evidence-photo';
import { prepareEvidencePhoto } from '@/features/novedades/lib/evidence-photo-io';
import { useTheme } from '@/hooks/use-theme';

interface PhotoFieldProps {
  value: EvidencePhoto | null;
  onChange: (photo: EvidencePhoto | null) => void;
}

// La compresión final la hace `prepareEvidencePhoto`: aquí se evita comprimir dos veces.
const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 1,
};

/** Foto de evidencia opcional, tomada con la cámara o elegida de la galería. */
export function PhotoField({ value, onChange }: PhotoFieldProps) {
  const theme = useTheme();
  const [preparing, setPreparing] = useState(false);

  const handleResult = async (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;

    setPreparing(true);
    try {
      onChange(await prepareEvidencePhoto(asset));
    } catch {
      Alert.alert('No se pudo usar la foto', 'Inténtalo de nuevo o elige otra imagen.');
    } finally {
      setPreparing(false);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Sin acceso a la cámara', 'Permite el acceso en los ajustes o elige una foto.');
      return;
    }
    await handleResult(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
  };

  const pickPhoto = async () => {
    await handleResult(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const buttonStyle = [styles.button, { borderColor: theme.backgroundSelected }];

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable
          onPress={() => void takePhoto()}
          disabled={preparing}
          accessibilityRole="button"
          style={buttonStyle}
        >
          <ThemedText type="small">Tomar foto</ThemedText>
        </Pressable>
        <Pressable
          onPress={() => void pickPhoto()}
          disabled={preparing}
          accessibilityRole="button"
          style={buttonStyle}
        >
          <ThemedText type="small">Elegir de la galería</ThemedText>
        </Pressable>
      </View>

      {preparing && <ActivityIndicator accessibilityLabel="Preparando la foto" />}

      {value && !preparing && (
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
