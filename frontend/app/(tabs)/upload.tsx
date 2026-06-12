import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, Shadows } from '../../src/constants/theme';
import { sightingService } from '../../src/services/index';

type UploadState = 'idle' | 'processing' | 'error';

export default function UploadScreen() {
  const router = useRouter();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [state, setState] = useState<UploadState>('idle');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (!result.canceled) setImageUri(result.assets[0].uri);
  };

  const detectLocation = async () => {
    const perm = await Location.requestForegroundPermissionsAsync();
    if (!perm.granted) return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });

    // Reverse geocode
    const [address] = await Location.reverseGeocodeAsync(loc.coords).catch(() => [null]);
    if (address) {
      const parts = [address.city, address.region, address.country].filter(Boolean);
      setLocation(parts.join(', '));
    }
  };

  const handleIdentify = async () => {
    if (!imageUri) return;
    setState('processing');
    try {
      const result = await sightingService.identify(imageUri, {
        location: location || undefined,
        latitude: coords?.lat,
        longitude: coords?.lng,
        notes: notes || undefined,
        sightingDate: new Date().toISOString(),
      });

      router.push({
        pathname: '/result',
        params: { resultData: JSON.stringify(result) },
      });
    } catch (err: any) {
      setState('error');
      Alert.alert('Identification failed', err.message || 'Please try again.');
    }
  };

  const reset = () => {
    setImageUri(null);
    setState('idle');
    setNotes('');
    setLocation('');
    setCoords(null);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Upload Zone ──────────────────────────────────────── */}
      {!imageUri ? (
        <View style={styles.uploadZone}>
          <Ionicons name="scan-outline" size={56} color={Colors.text.muted} />
          <Text style={styles.uploadTitle}>Capture or Upload</Text>
          <Text style={styles.uploadSubtitle}>
            Photograph the turtle's neck region for best identification results
          </Text>
          <View style={styles.uploadButtons}>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickFromCamera} activeOpacity={0.8}>
              <Ionicons name="camera" size={22} color={Colors.accent.teal} />
              <Text style={styles.uploadBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickFromGallery} activeOpacity={0.8}>
              <Ionicons name="images" size={22} color={Colors.accent.teal} />
              <Text style={styles.uploadBtnText}>Gallery</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          {/* ── Preview ─────────────────────────────────────── */}
          <View style={styles.previewContainer}>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeBtn} onPress={reset}>
              <Ionicons name="close-circle" size={28} color={Colors.status.error} />
            </TouchableOpacity>
            <View style={styles.previewOverlay}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.status.success} />
              <Text style={styles.previewOverlayText}>Image captured</Text>
            </View>
          </View>

          {/* ── Metadata ────────────────────────────────────── */}
          <View style={styles.metaSection}>
            <Text style={styles.metaTitle}>Sighting Details</Text>

            {/* Location */}
            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={18} color={Colors.text.muted} />
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                placeholderTextColor={Colors.text.muted}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity onPress={detectLocation} style={styles.detectBtn}>
                <Ionicons name="navigate" size={16} color={Colors.accent.teal} />
              </TouchableOpacity>
            </View>

            {coords && (
              <Text style={styles.coordsText}>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </Text>
            )}

            {/* Notes */}
            <View style={[styles.fieldRow, styles.notesRow]}>
              <Ionicons name="document-text-outline" size={18} color={Colors.text.muted} style={styles.notesIcon} />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Field notes (optional)"
                placeholderTextColor={Colors.text.muted}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* ── Identify Button ──────────────────────────────── */}
          <TouchableOpacity
            style={[styles.identifyBtn, state === 'processing' && styles.identifyBtnDisabled]}
            onPress={handleIdentify}
            disabled={state === 'processing'}
            activeOpacity={0.85}
          >
            {state === 'processing' ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color={Colors.text.inverse} />
                <Text style={styles.identifyBtnText}>Analyzing neck patterns...</Text>
              </View>
            ) : (
              <View style={styles.processingRow}>
                <Ionicons name="scan" size={22} color={Colors.text.inverse} />
                <Text style={styles.identifyBtnText}>Run Identification</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Tips ────────────────────────────────────────── */}
          <View style={styles.tips}>
            <Text style={styles.tipsTitle}>Photography tips</Text>
            <Tip icon="sunny-outline" text="Good lighting improves accuracy" />
            <Tip icon="resize-outline" text="Focus on neck and head region" />
            <Tip icon="images-outline" text="Clear, unobstructed view works best" />
          </View>
        </>
      )}
    </ScrollView>
  );
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={tipStyles.row}>
      <Ionicons name={icon as any} size={14} color={Colors.accent.teal} />
      <Text style={tipStyles.text}>{text}</Text>
    </View>
  );
}
const tipStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { ...TextStyles.bodySmall, color: Colors.text.muted },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing['3xl'] },

  uploadZone: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii['2xl'],
    borderWidth: 2,
    borderColor: Colors.border.default,
    borderStyle: 'dashed',
    padding: Spacing['4xl'],
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  uploadTitle: { ...TextStyles.h2, color: Colors.text.primary },
  uploadSubtitle: {
    ...TextStyles.body,
    color: Colors.text.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
  uploadButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.tealSubtle,
    borderWidth: 1,
    borderColor: Colors.accent.tealBorder,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
  },
  uploadBtnText: { ...TextStyles.h3, color: Colors.accent.teal },

  previewContainer: {
    borderRadius: Radii.xl,
    overflow: 'hidden',
    backgroundColor: Colors.bg.secondary,
    position: 'relative',
    ...Shadows.md,
  },
  preview: { width: '100%', height: 280 },
  removeBtn: { position: 'absolute', top: Spacing.md, right: Spacing.md },
  previewOverlay: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  previewOverlayText: { ...TextStyles.label, color: Colors.status.success },

  metaSection: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  metaTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  notesRow: { alignItems: 'flex-start', paddingVertical: Spacing.md },
  notesIcon: { marginTop: 2 },
  input: {
    flex: 1,
    ...TextStyles.body,
    color: Colors.text.primary,
    padding: 0,
  },
  notesInput: { minHeight: 60 },
  detectBtn: { padding: 4 },
  coordsText: { ...TextStyles.mono, color: Colors.text.muted, fontSize: 11, marginLeft: Spacing.xl },

  identifyBtn: {
    backgroundColor: Colors.accent.teal,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadows.teal,
  },
  identifyBtnDisabled: { opacity: 0.7 },
  identifyBtnText: { ...TextStyles.h3, color: Colors.text.inverse, fontWeight: '700' },
  processingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },

  tips: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  tipsTitle: { ...TextStyles.label, color: Colors.text.muted, marginBottom: Spacing.xs },
});
