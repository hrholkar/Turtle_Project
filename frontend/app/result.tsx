import { sightingService } from '../src/services/index';
import React, { useState } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,

} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, MatchStrengthColors, SpeciesLabels } from '../src/constants/colors';
import { TextStyles } from '../src/constants/typography';
import { Spacing, Radii, Shadows, UPLOADS_BASE_URL } from '../src/constants/theme';
import { ConfidenceBadge, YearsBadge } from '../src/components/ui/Badges';
import { Button } from '../src/components/ui/Button';
import { Card } from '../src/components/ui/Card';
import { turtleService } from '../src/services/turtle.service';
import type { IdentifyResult, MatchStrength, TurtleSpecies, TurtleGender } from '../src/types';


const matchStrengthMessages: Record<MatchStrength, string> = {
  strong:   'Strong match found — this turtle is in the database.',
  probable: 'Probable match — please review and verify.',
  new:      'No confident match found — this may be a new turtle.',
};

function TopMatchRow({
  rank,
  identity,
  similarity,
  species,
  isTop,
  onSelect,
  selected
}: {
  rank: number;
  identity: string;
  similarity: number;
  species?: string;
  isTop: boolean;
  onSelect?: () => void;
  selected?: boolean;
}) {
  const color = selected ? Colors.text.inverse : (isTop ? Colors.accent.blue : Colors.text.muted);
  return (
    <TouchableOpacity
      activeOpacity={onSelect ? 0.7 : 1}
      onPress={onSelect}
      style={[
        matchRowStyles.container,
        isTop && matchRowStyles.topContainer,
        selected && matchRowStyles.selectedContainer
      ]}
    >
      <View style={matchRowStyles.rankBadge}>
        <Text style={[matchRowStyles.rankText, { color }]}>#{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={matchRowStyles.headerRow}>
          <Text style={[matchRowStyles.identity, { color }]}>{identity}</Text>
          <View style={[matchRowStyles.simBadge, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : isTop ? Colors.accent.blue : Colors.bg.tertiary }]}>
            <Text style={[matchRowStyles.simText, { color: selected || isTop ? '#fff' : Colors.text.secondary }]}>
              {similarity.toFixed(2)}%
            </Text>
          </View>
        </View>
        {species && (
          <Text style={[matchRowStyles.meta, { color: selected ? '#eee' : Colors.text.secondary }]}>{species}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const matchRowStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
    paddingHorizontal: Spacing.sm,
    borderRadius: Radii.md,
  },
  topContainer: {
    backgroundColor: Colors.accent.blueSubtle,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  selectedContainer: {
    backgroundColor: Colors.accent.blue,
    borderBottomWidth: 0,
  },
  rankBadge: { width: 28, alignItems: 'center', paddingTop: 2 },
  rankText: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  identity: { fontFamily: 'monospace', fontSize: 16, fontWeight: '700', flex: 1 },
  simBadge: { borderRadius: Radii.full, paddingHorizontal: Spacing.sm, paddingVertical: 2 },
  simText: { fontSize: 12, fontWeight: '700' },
  meta: { ...TextStyles.bodySmall, marginTop: 2 },
});

// ── Species & Gender picker options ──────────────────────────────────────────
const SPECIES_OPTIONS: { label: string; value: TurtleSpecies }[] = [
  { label: 'Unknown Species', value: 'unknown' },
  { label: 'Green Turtle',    value: 'green' },
  { label: 'Loggerhead',      value: 'loggerhead' },
  { label: 'Leatherback',     value: 'leatherback' },
  { label: 'Hawksbill',       value: 'hawksbill' },
  { label: "Kemp's Ridley",   value: 'kemp_ridley' },
  { label: 'Olive Ridley',    value: 'olive_ridley' },
  { label: 'Flatback',        value: 'flatback' },
];

const GENDER_OPTIONS: { label: string; value: TurtleGender }[] = [
  { label: 'Unknown', value: 'unknown' },
  { label: 'Female',  value: 'female' },
  { label: 'Male',    value: 'male' },
];

// ── RegisterTurtleModal ───────────────────────────────────────────────────────
function RegisterTurtleModal({
  visible,
  imageUri,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  imageUri?: string;
  onClose: () => void;
  onSuccess: (turtleId: string) => void;
}) {
  const [species, setSpecies]       = useState<TurtleSpecies>('unknown');
  const [gender, setGender]         = useState<TurtleGender>('unknown');
  const [birthLocation, setBirthLocation] = useState('');
  const [notes, setNotes]           = useState('');
  const [loading, setLoading]       = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('species', species);
      formData.append('gender', gender);
      formData.append('firstSightingDate', new Date().toISOString());
      if (birthLocation.trim()) formData.append('birthLocation', birthLocation.trim());
      if (notes.trim())         formData.append('notes', notes.trim());

      // Attach the sighting image as the profile image
      if (imageUri) {
        let finalUri = imageUri;
        if (imageUri.startsWith('http')) {
          const localUri = `${FileSystem.cacheDirectory}turtle_profile_${Date.now()}.jpg`;
          await FileSystem.downloadAsync(imageUri, localUri);
          finalUri = localUri;
        }

        formData.append('profileImage', {
          uri: finalUri,
          name: 'turtle_profile.jpg',
          type: 'image/jpeg',
        } as unknown as Blob);
      }

      const turtle = await turtleService.create(formData);
      onSuccess(turtle.turtleId);
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message || 'Could not register turtle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: Colors.bg.primary }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={modalStyles.header}>
          <View style={modalStyles.headerLeft}>
            <Ionicons name="add-circle" size={24} color={Colors.accent.blue} />
            <Text style={modalStyles.headerTitle}>Register New Turtle</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={modalStyles.closeBtn} id="close-register-modal">
            <Ionicons name="close" size={22} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={modalStyles.body} showsVerticalScrollIndicator={false}>

          {/* Image preview */}
          {imageUri ? (
            <View style={modalStyles.imagePreviewWrap}>
              <Image source={{ uri: imageUri }} style={modalStyles.imagePreview} resizeMode="cover" />
              <View style={modalStyles.imageLabel}>
                <Ionicons name="image-outline" size={14} color={Colors.text.muted} />
                <Text style={modalStyles.imageLabelText}>Sighting image will be used as profile photo</Text>
              </View>
            </View>
          ) : null}

          {/* Species picker */}
          <Text style={modalStyles.fieldLabel}>Species</Text>
          <View style={modalStyles.optionGroup}>
            {SPECIES_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                id={`species-${opt.value}`}
                style={[modalStyles.optionChip, species === opt.value && modalStyles.optionChipActive]}
                onPress={() => setSpecies(opt.value)}
              >
                <Text style={[modalStyles.optionChipText, species === opt.value && modalStyles.optionChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Gender picker */}
          <Text style={modalStyles.fieldLabel}>Gender</Text>
          <View style={[modalStyles.optionGroup, { flexDirection: 'row' }]}>
            {GENDER_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                id={`gender-${opt.value}`}
                style={[modalStyles.optionChip, modalStyles.optionChipFlex, gender === opt.value && modalStyles.optionChipActive]}
                onPress={() => setGender(opt.value)}
              >
                <Text style={[modalStyles.optionChipText, gender === opt.value && modalStyles.optionChipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Birth Location */}
          <Text style={modalStyles.fieldLabel}>Birth / Nesting Location <Text style={modalStyles.optional}>(optional)</Text></Text>
          <TextInput
            id="birth-location-input"
            style={modalStyles.textInput}
            placeholder="e.g. Lakshadweep Beach, India"
            placeholderTextColor={Colors.text.disabled}
            value={birthLocation}
            onChangeText={setBirthLocation}
          />

          {/* Notes */}
          <Text style={modalStyles.fieldLabel}>Field Notes <Text style={modalStyles.optional}>(optional)</Text></Text>
          <TextInput
            id="notes-input"
            style={[modalStyles.textInput, modalStyles.textInputMulti]}
            placeholder="Any distinguishing marks, behaviour, or context…"
            placeholderTextColor={Colors.text.disabled}
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />

          {/* Submit */}
          <TouchableOpacity
            id="register-turtle-submit"
            style={[modalStyles.submitBtn, loading && { opacity: 0.6 }]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={Colors.text.inverse} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={Colors.text.inverse} />
                <Text style={modalStyles.submitBtnText}>Register Turtle</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: Spacing['3xl'] }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const modalStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerTitle: { ...TextStyles.h3, color: Colors.text.primary },
  closeBtn: {
    padding: Spacing.sm,
    borderRadius: Radii.full,
    backgroundColor: Colors.bg.tertiary,
  },
  body: { padding: Spacing.base, gap: Spacing.sm },

  imagePreviewWrap: { borderRadius: Radii.lg, overflow: 'hidden', marginBottom: Spacing.sm },
  imagePreview:     { width: '100%', height: 180 },
  imageLabel:       { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.sm, backgroundColor: Colors.bg.tertiary },
  imageLabelText:   { ...TextStyles.label, color: Colors.text.muted, fontSize: 11 },

  fieldLabel: { ...TextStyles.label, color: Colors.text.secondary, marginTop: Spacing.md },
  optional:   { color: Colors.text.disabled, fontWeight: '400' },

  optionGroup:      { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  optionChip:       {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 1.5,
    borderColor: Colors.border.accent,
    backgroundColor: Colors.bg.secondary,
  },
  optionChipFlex:   { flex: 1, alignItems: 'center' },
  optionChipActive: { backgroundColor: Colors.accent.blue, borderColor: Colors.accent.blue },
  optionChipText:   { ...TextStyles.label, color: Colors.text.secondary, fontSize: 13 },
  optionChipTextActive: { color: Colors.text.inverse },

  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: Radii.md,
    padding: Spacing.md,
    color: Colors.text.primary,
    backgroundColor: Colors.bg.secondary,
    ...TextStyles.body,
    marginTop: Spacing.xs,
  },
  textInputMulti: { minHeight: 100, textAlignVertical: 'top' },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.blue,
    borderRadius: Radii.lg,
    padding: Spacing.base,
    marginTop: Spacing.xl,
    ...Shadows.md,
  },
  submitBtnText: { ...TextStyles.h3, color: Colors.text.inverse },
});


export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultData: string; meta: string }>();
  const [registerModalVisible, setRegisterModalVisible] = useState(false);


  let result: IdentifyResult | null = null;
  let meta: any = {};
  try {
    result = JSON.parse(params.resultData || '{}');
    meta = JSON.parse(params.meta || '{}');
  } catch {}

  const [isSubmitting, setIsSubmitting] = useState(false);

  const imagePath = result?.imageUrl;
  const sightingImageUri = imagePath ? `${UPLOADS_BASE_URL}${imagePath}` : undefined;
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(result?.type === 'match' ? result.allMatches?.[0]?.turtleId : null);
  const [showTop3, setShowTop3] = useState(false);

  if (!result) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: Colors.text.primary }}>No result data.</Text>
      </View>
    );
  }

  const isMatch = result.type === 'match';
  const strength = result.matchStrength;
  const strengthColor = MatchStrengthColors[strength];
  const top3 = result.allMatches?.slice(0, 3) ?? [];
  const selectedMatch = top3.find(m => m.turtleId === selectedMatchId) || top3[0];

  const handleConfirmSighting = async () => {
    if (!selectedMatch) return;
    setIsSubmitting(true);
    try {
      await sightingService.createManual({
        turtleId: selectedMatch.turtleId,
        imageUrl: imagePath!,
        location: meta.location,
        latitude: meta.latitude,
        longitude: meta.longitude,
        sightingDate: meta.sightingDate,
        notes: meta.notes,
        confidenceScore: selectedMatch.score,
      });
      Alert.alert('Success', 'Sighting confirmed!', [
        { text: 'OK', onPress: () => router.push(`/turtle/${selectedMatch.turtleId}`) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to confirm sighting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = () => {
    router.push({
      pathname: '/register-turtle',
      params: { 
        meta: JSON.stringify(meta),
        imageUrl: imagePath,
        newIdentity: result!.newIdentity
      }
    });
  };



  const handleRegistered = (turtleId: string) => {
    setRegisterModalVisible(false);
    router.replace(`/turtle/${turtleId}`);
  };

  return (
    <>
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Result Header ─────────────────────────────── */}

      <View style={[styles.resultHeader, { borderColor: `${strengthColor}40`, backgroundColor: `${strengthColor}10` }]}>
        <Ionicons name={isMatch ? 'checkmark-circle' : 'help-circle'} size={48} color={strengthColor} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultTitle, { color: strengthColor }]}>
            {isMatch ? 'Turtle Identified' : 'No Confident Match'}
          </Text>
          <Text style={styles.resultSubtitle}>{matchStrengthMessages[strength]}</Text>
        </View>
      </View>

      {/* ── NEW: Prominent registration banner for 'new' match ─────────── */}
      {strength === 'new' && (
        <View style={styles.registerBanner}>
          <View style={styles.registerBannerLeft}>
            <Ionicons name="fish" size={28} color={Colors.accent.blue} />
            <View style={{ flex: 1 }}>
              <Text style={styles.registerBannerTitle}>New turtle sighted!</Text>
              <Text style={styles.registerBannerSub}>
                No match found. Add this turtle to the database so future sightings can be tracked.
              </Text>
            </View>
          </View>
          <TouchableOpacity
            id="register-new-turtle-btn"
            style={styles.registerBannerBtn}
            onPress={() => setRegisterModalVisible(true)}
          >
            <Ionicons name="add-circle" size={16} color={Colors.text.inverse} />
            <Text style={styles.registerBannerBtnText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Match Found Branch ────────────────────────── */}

      {isMatch && result.turtle && (
        <>
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Best Match</Text>
              {result.confidence != null && <ConfidenceBadge score={result.confidence} matchStrength={strength} />}
            </View>
            <View style={styles.turtleRow}>
              {result.turtle.profileImage && (
                <Image source={{ uri: `${UPLOADS_BASE_URL}${result.turtle.profileImage}` }} style={styles.turtleThumb} />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.turtleId}>{result.turtle.turtleId}</Text>
                <Text style={styles.turtleSpecies}>{SpeciesLabels[result.turtle.species] || result.turtle.species}</Text>
                <Text style={styles.turtleSightings}>{result.turtle.totalSightings} total sightings</Text>
              </View>
            </View>
          </Card>

          <View style={styles.actions}>
            <Button
              label="View Turtle Profile"
              variant="primary"
              size="lg"
              onPress={() => router.push(`/turtle/${result!.turtle!.turtleId}`)}
              leftIcon={<Ionicons name="water" size={18} color={Colors.text.inverse} />}
            />
            {/* PROBABLE: offer to register as a different turtle */}
            {strength === 'probable' && (
              <Button
                label="Not this turtle? Register as new"
                variant="ghost"
                size="lg"
                onPress={() => setRegisterModalVisible(true)}
                leftIcon={<Ionicons name="add-circle-outline" size={18} color={Colors.accent.blue} />}
              />
            )}
            <Button
              label="Identify Another"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(tabs)/upload')}
            />
          </View>
        </>

      )}

      {(isMatch || showTop3) && top3.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Top {top3.length} Candidates</Text>
          {top3.map((m, i) => (
            <TopMatchRow
              key={m.turtleId}
              rank={i + 1}
              identity={m.turtleId}
              similarity={parseFloat((m.score * 100).toFixed(2))}
              isTop={i === 0 && !showTop3}
              selected={selectedMatchId === m.turtleId}
              onSelect={() => setSelectedMatchId(m.turtleId)}
            />
          ))}
        </Card>
      )}

      {(isMatch || (showTop3 && selectedMatchId)) && (
        <View style={styles.actions}>
          <Button
            label={`Confirm Sighting for ${selectedMatchId}`}
            variant="primary"
            size="lg"
            loading={isSubmitting}
            onPress={handleConfirmSighting}
          />
          <Button label="Cancel" variant="ghost" size="lg" onPress={() => router.push('/(tabs)/upload')} />
          
          {isMatch && (
            <View style={{ marginTop: Spacing.sm, gap: Spacing.md }}>
              <View style={{ height: 1, backgroundColor: Colors.border.subtle }} />
              <Text style={{ ...TextStyles.body, color: Colors.text.secondary, textAlign: 'center' }}>
                Not the same turtle?
              </Text>
              <Button
                label="Register as New Turtle"
                variant="secondary"
                size="lg"
                onPress={() => setRegisterModalVisible(true)}
              />
            </View>
          )}
        </View>
      )}
    </ScrollView>

    {/* ── Register New Turtle Modal ──────────────────────── */}
    <RegisterTurtleModal
      visible={registerModalVisible}
      imageUri={sightingImageUri}
      onClose={() => setRegisterModalVisible(false)}
      onSuccess={handleRegistered}
    />
  </>  
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen:  { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.base },

  // ── Register banner (shown when matchStrength === 'new') ───────────────────
  registerBanner: {
    borderRadius: Radii.xl,
    borderWidth: 1.5,
    borderColor: Colors.accent.blueBorder,
    backgroundColor: Colors.accent.blueSubtle,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  registerBannerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  registerBannerTitle: { ...TextStyles.h3, color: Colors.accent.blue },
  registerBannerSub:   { ...TextStyles.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  registerBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent.blue,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  registerBannerBtnText: { ...TextStyles.label, color: Colors.text.inverse, fontWeight: '700' },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.base,
  },
  resultTitle:    { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },

  resultSubtitle: { ...TextStyles.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  card: { padding: Spacing.base, gap: Spacing.md },
  cardTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  turtleRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  turtleThumb: { width: 72, height: 72, borderRadius: Radii.md },
  turtleId: { fontFamily: 'monospace', fontSize: 18, fontWeight: '700', color: Colors.accent.blue },
  turtleSpecies: { ...TextStyles.body, color: Colors.text.secondary },
  turtleSightings: { ...TextStyles.label, color: Colors.text.muted },
  actions: { gap: Spacing.md },
});
