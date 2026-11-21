import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Camera, ImageIcon, Trash2 } from 'lucide-react-native';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import type { EvidencePhoto } from '@/features/novedades/lib/evidence-photo';
import { prepareEvidencePhoto } from '@/features/novedades/lib/evidence-photo-io';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing } from '@/theme';

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

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Button
          title="Tomar foto"
          variant="secondary"
          size="sm"
          onPress={() => void takePhoto()}
          disabled={preparing}
          icon={(color) => <Camera size={16} color={color} aria-hidden />}
          style={styles.flex}
        />
        <Button
          title="Galería"
          variant="secondary"
          size="sm"
          onPress={() => void pickPhoto()}
          disabled={preparing}
          accessibilityHint="Elige una foto de la galería"
          icon={(color) => <ImageIcon size={16} color={color} aria-hidden />}
          style={styles.flex}
        />
      </View>

      {preparing && <ActivityIndicator color={theme.inkMuted} accessibilityLabel="Preparando la foto" />}

      {value && !preparing && (
        <View style={styles.preview}>
          <Image
            source={{ uri: value.uri }}
            style={[styles.image, { borderColor: theme.line }]}
            contentFit="cover"
            accessibilityLabel="Foto de evidencia seleccionada"
          />
          <Button
            title="Quitar foto"
            variant="ghost"
            size="sm"
            onPress={() => onChange(null)}
            icon={(color) => <Trash2 size={16} color={color} aria-hidden />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.sm },
  flex: { flex: 1 },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  image: { width: 72, height: 72, borderRadius: radius.md, borderWidth: 1 },
});
