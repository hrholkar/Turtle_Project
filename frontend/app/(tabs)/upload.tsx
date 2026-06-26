import React, { useState, useRef } from 'react';
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
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, Shadows } from '../../src/constants/theme';
import { sightingService } from '../../src/services/index';
import { Button } from '../../src/components/ui/Button';
import { Card } from '../../src/components/ui/Card';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMB_SIZE = (SCREEN_WIDTH - Spacing.base * 2 - Spacing.md * 2) / 3;

type UploadState = 'idle' | 'processing' | 'error';
type ImageSide = 'AUTO' | 'LEFT' | 'RIGHT';

export default function UploadScreen() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [state, setState] = useState<UploadState>('idle');
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locFetching, setLocFetching] = useState(false);
  const [imageSide, setImageSide] = useState<ImageSide>('AUTO');
  const locationFetchedRef = useRef(false);

  // ── Location helpers ─────────────────────────────────────────────────────────

  const fetchLocation = async () => {
    if (locationFetchedRef.current) return; // only fetch once
    locationFetchedRef.current = true;
    setLocFetching(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setLocFetching(false); return; }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      const [address] = await Location.reverseGeocodeAsync(loc.coords).catch(() => [null]);
      if (address) {
        const parts = [address.city, address.region, address.country].filter(Boolean);
        setLocation(parts.join(', '));
      }
    } finally {
      setLocFetching(false);
    }
  };

  const refreshLocation = async () => {
    locationFetchedRef.current = false;
    setCoords(null);
    setLocation('');
    await fetchLocation();
  };

  // ── Image pickers ────────────────────────────────────────────────────────────

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: 10,
    });
    if (!result.canceled && result.assets.length > 0) {
      const uris = result.assets.map(a => a.uri);
      addImages(uris);
    }
  };

  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
    });
    if (!result.canceled) {
      addImages([result.assets[0].uri]);
    }
  };

  const addImages = (uris: string[]) => {
    const isFirst = images.length === 0;
    setImages(prev => [...prev, ...uris]);
    if (isFirst) {
      fetchLocation();
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── Identify ──────────────────────────────────────────────────────────────────

  const handleIdentify = async () => {
    if (images.length === 0) return;
    setState('processing');
    try {
      const meta = {
        location:    location || undefined,
        latitude:    coords?.lat,
        longitude:   coords?.lng,
        notes:       notes || undefined,
        sightingDate: new Date().toISOString(),
        image_side:  imageSide,
      };

      const results = await Promise.all(
        images.map(uri => sightingService.identify(uri, meta))
      );

      router.push({
        pathname: '/result',
        params: { resultData: JSON.stringify(results[0]), allResults: JSON.stringify(results) },
      });
    } catch (err: any) {
      setState('error');
      Alert.alert('Identification failed', err.message || 'Please try again.');
    }
  };

  const reset = () => {
    setImages([]);
    setState('idle');
    setNotes('');
    setLocation('');
    setCoords(null);
    setImageSide('AUTO');
    locationFetchedRef.current = false;
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  const hasImages = images.length > 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {!hasImages ? (
        <View style={styles.uploadZone}>
          <Ionicons name="scan-outline" size={56} color={Colors.text.disabled} />
          <Text style={styles.uploadTitle}>Capture or Upload</Text>
          <Text style={styles.uploadSubtitle}>
            Select multiple images of the turtle's neck region for best results
          </Text>
          <View style={styles.uploadButtons}>
            <Button
              label="Camera"
              variant="secondary"
              onPress={pickFromCamera}
              leftIcon={<Ionicons name="camera" size={20} color={Colors.accent.blue} />}
              style={{ flex: 1 }}
            />
            <Button
              label="Gallery"
              variant="secondary"
              onPress={pickFromGallery}
              leftIcon={<Ionicons name="images" size={20} color={Colors.accent.blue} />}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : (
        <>
          {/* ── Image Grid ───────────────────────────────────────────── */}
          <Card style={styles.gridSection}>
            <View style={styles.gridHeader}>
              <Text style={styles.gridTitle}>
                {images.length} image{images.length > 1 ? 's' : ''} selected
              </Text>
              <TouchableOpacity onPress={reset} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {images.map((uri, index) => (
                <View key={`${uri}-${index}`} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.thumbRemove}
                    onPress={() => removeImage(index)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={22} color={Colors.status.error} />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
              ))}
              <TouchableOpacity style={styles.addMoreTile} onPress={pickFromGallery} activeOpacity={0.7}>
                <Ionicons name="add" size={28} color={Colors.accent.blue} />
                <Text style={styles.addMoreText}>Add more</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.appendCameraBtn} onPress={pickFromCamera} activeOpacity={0.8}>
              <Ionicons name="camera-outline" size={18} color={Colors.accent.blue} />
              <Text style={styles.appendCameraText}>Take another photo</Text>
            </TouchableOpacity>
          </Card>

          {/* ── Metadata ─────────────────────────────────────────────── */}
          <Card style={styles.metaSection}>
            <Text style={styles.metaTitle}>Sighting Details</Text>

            <View style={styles.fieldRow}>
              <Ionicons name="location-outline" size={18} color={Colors.text.muted} />
              <TextInput
                style={styles.input}
                placeholder="Location (auto-detected)"
                placeholderTextColor={Colors.text.disabled}
                value={location}
                onChangeText={setLocation}
              />
              <TouchableOpacity onPress={refreshLocation} style={styles.detectBtn} disabled={locFetching}>
                {locFetching
                  ? <ActivityIndicator size="small" color={Colors.accent.blue} />
                  : <Ionicons name="navigate" size={16} color={Colors.accent.blue} />}
              </TouchableOpacity>
            </View>

            {coords && (
              <Text style={styles.coordsText}>
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </Text>
            )}

            <View style={[styles.fieldRow, styles.notesRow]}>
              <Ionicons name="document-text-outline" size={18} color={Colors.text.muted} style={styles.notesIcon} />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Field notes (optional)"
                placeholderTextColor={Colors.text.disabled}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </Card>

          {/* ── Image Side Selector ────────────────────────── */}
          <Card style={styles.sideSection}>
            <Text style={styles.sideTitle}>Image Side</Text>
            <View style={styles.sideRow}>
              {(['AUTO', 'LEFT', 'RIGHT'] as ImageSide[]).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sideBtn, imageSide === s && styles.sideBtnActive]}
                  onPress={() => setImageSide(s)}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioCircle}>
                    {imageSide === s && <View style={styles.radioFill} />}
                  </View>
                  <Text style={[styles.sideBtnText, imageSide === s && styles.sideBtnTextActive]}>
                    {s === 'AUTO' ? '\u26A1 Auto Detect' : s === 'LEFT' ? '\u25C0 Left' : 'Right \u25B6'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* ── Identify Button ─────────────────────────── */}
          <Button
            label={state === 'processing' ? `Analyzing ${images.length} image${images.length > 1 ? 's' : ''}...` : `Identify Turtle (${images.length})`}
            variant="primary"
            size="lg"
            onPress={handleIdentify}
            loading={state === 'processing'}
            disabled={state === 'processing'}
            leftIcon={state !== 'processing' ? <Ionicons name="scan" size={22} color={Colors.text.inverse} /> : undefined}
          />

          {/* ── Tips ─────────────────────────────────────────────────── */}
          <Card style={styles.tips}>
            <Text style={styles.tipsTitle}>Photography tips</Text>
            <Tip icon="sunny-outline" text="Good lighting improves accuracy" />
            <Tip icon="resize-outline" text="Focus on neck and head region" />
            <Tip icon="images-outline" text="Multiple angles increase confidence" />
          </Card>
        </>
      )}
    </ScrollView>
  );
}

function Tip({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={tipStyles.row}>
      <Ionicons name={icon as any} size={16} color={Colors.accent.blue} />
      <Text style={tipStyles.text}>{text}</Text>
    </View>
  );
}
const tipStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  text: { ...TextStyles.bodySmall, color: Colors.text.secondary },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.xl, paddingBottom: Spacing['3xl'] },

  uploadZone: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii['2xl'],
    borderWidth: 2,
    borderColor: Colors.border.subtle,
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
    maxWidth: 280,
  },
  uploadButtons: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md, width: '100%' },

  gridSection: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridTitle: { ...TextStyles.h3, color: Colors.text.primary },
  clearAllBtn: { paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  clearAllText: { ...TextStyles.label, color: Colors.status.error },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  thumbWrapper: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radii.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumb: { width: '100%', height: '100%' },
  thumbRemove: {
    position: 'absolute',
    top: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 99,
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 3,
    left: 3,
    backgroundColor: Colors.accent.blue,
    borderRadius: Radii.full,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  primaryBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  addMoreTile: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: Radii.md,
    borderWidth: 1.5,
    borderColor: Colors.accent.blueBorder,
    borderStyle: 'dashed',
    backgroundColor: Colors.bg.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addMoreText: { ...TextStyles.label, color: Colors.accent.blue, fontSize: 10 },
  appendCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
  },
  appendCameraText: { ...TextStyles.label, color: Colors.accent.blue },

  metaSection: {
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

  sideSection: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  sideTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  sideRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  sideBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.tertiary,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  sideBtnActive: {
    borderColor: Colors.accent.blue,
    backgroundColor: Colors.accent.blueSubtle,
  },
  sideBtnText: { ...TextStyles.label, color: Colors.text.muted, fontSize: 11 },
  sideBtnTextActive: { color: Colors.accent.blue, fontWeight: '700' },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: Colors.border.subtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioFill: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent.blue,
  },

  tips: {
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  tipsTitle: { ...TextStyles.label, color: Colors.text.muted, marginBottom: Spacing.xs },
});
