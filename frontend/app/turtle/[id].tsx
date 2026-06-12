import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, SpeciesLabels } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, Shadows, UPLOADS_BASE_URL } from '../../src/constants/theme';
import { SightingCard } from '../../src/components/sighting/SightingCard';
import { Button } from '../../src/components/ui/Button';
import { YearsBadge } from '../../src/components/ui/Badges';
import { useTurtle, useTurtleSightings, useDeleteTurtle } from '../../src/hooks/useQueries';
import { turtleService } from '../../src/services/turtle.service';
import { useQueryClient } from '@tanstack/react-query';

export default function TurtleProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editNotes, setEditNotes] = useState('');

  const { data: turtle, isLoading } = useTurtle(id);
  const { data: sightingsData, isLoading: sightingsLoading } = useTurtleSightings(id);
  const deleteMutation = useDeleteTurtle();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent.teal} size="large" />
      </View>
    );
  }

  if (!turtle) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: Colors.text.primary }}>Turtle not found.</Text>
      </View>
    );
  }

  const imageUri = turtle.profileImage ? `${UPLOADS_BASE_URL}${turtle.profileImage}` : null;
  const yearsSinceSeen = Math.floor(
    (Date.now() - new Date(turtle.latestSightingDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  const trackingYears = Math.floor(
    (new Date(turtle.latestSightingDate).getTime() - new Date(turtle.firstSightingDate).getTime()) /
    (1000 * 60 * 60 * 24 * 365.25)
  );

  const handleDelete = () => {
    Alert.alert(
      'Delete Turtle',
      `Are you sure you want to delete ${turtle.turtleId}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(turtle.turtleId);
            router.back();
          },
        },
      ]
    );
  };

  const handleSaveNotes = async () => {
    await turtleService.update(turtle.turtleId, { notes: editNotes });
    queryClient.invalidateQueries({ queryKey: ['turtle', id] });
    setEditing(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Hero Image ────────────────────────────────── */}
      <View style={styles.heroWrap}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.heroImage} resizeMode="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="fish-outline" size={64} color={Colors.text.muted} />
            <Text style={styles.heroPlaceholderText}>No profile image</Text>
          </View>
        )}

        {/* Gradient-style overlay with turtle ID */}
        <View style={styles.heroOverlay}>
          <Text style={styles.heroTurtleId}>{turtle.turtleId}</Text>
          <Text style={styles.heroSpecies}>{SpeciesLabels[turtle.species] || turtle.species}</Text>
        </View>
      </View>

      {/* ── Last Seen Banner ─────────────────────────── */}
      <View style={styles.lastSeenBanner}>
        <Ionicons name="time-outline" size={18} color={Colors.warm.amber} />
        <Text style={styles.lastSeenText}>
          {yearsSinceSeen === 0
            ? 'Last recorded this year'
            : `Last recorded ${yearsSinceSeen} year${yearsSinceSeen !== 1 ? 's' : ''} ago`}
        </Text>
        <YearsBadge years={yearsSinceSeen} />
      </View>

      {/* ── Turtle Details ───────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Field Record</Text>

        <InfoRow label="Turtle ID" value={turtle.turtleId} mono />
        <InfoRow label="Species" value={SpeciesLabels[turtle.species] || turtle.species} />
        <InfoRow label="Gender" value={turtle.gender === 'unknown' ? 'Not determined' : turtle.gender} />
        {turtle.birthLocation && <InfoRow label="Birth Location" value={turtle.birthLocation} />}
        {turtle.birthDate && (
          <InfoRow
            label="Birth Date"
            value={new Date(turtle.birthDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
          />
        )}
        <InfoRow
          label="First Sighting"
          value={new Date(turtle.firstSightingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
        <InfoRow
          label="Latest Sighting"
          value={new Date(turtle.latestSightingDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
        />
        <InfoRow label="Total Sightings" value={String(turtle.totalSightings)} />
        {trackingYears > 0 && (
          <InfoRow label="Tracking Duration" value={`${trackingYears} year${trackingYears !== 1 ? 's' : ''}`} />
        )}
      </View>

      {/* ── Notes ────────────────────────────────────── */}
      <View style={styles.card}>
        <View style={styles.notesHeader}>
          <Text style={styles.cardTitle}>Field Notes</Text>
          <TouchableOpacity onPress={() => { setEditNotes(turtle.notes || ''); setEditing(!editing); }}>
            <Text style={styles.editLink}>{editing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {editing ? (
          <>
            <TextInput
              style={styles.notesInput}
              value={editNotes}
              onChangeText={setEditNotes}
              multiline
              numberOfLines={4}
              placeholder="Enter field notes..."
              placeholderTextColor={Colors.text.muted}
              textAlignVertical="top"
            />
            <Button label="Save Notes" variant="primary" size="sm" onPress={handleSaveNotes} />
          </>
        ) : (
          <Text style={styles.notesText}>
            {turtle.notes || 'No field notes recorded.'}
          </Text>
        )}
      </View>

      {/* ── Sighting History ─────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sighting History ({sightingsData?.total || 0})</Text>

        {sightingsLoading ? (
          <ActivityIndicator color={Colors.accent.teal} />
        ) : sightingsData?.items && sightingsData.items.length > 0 ? (
          <View style={styles.sightingsList}>
            {sightingsData.items.map((sighting) => (
              <SightingCard
                key={sighting._id}
                sighting={sighting}
              />
            ))}
          </View>
        ) : (
          <Text style={styles.noSightings}>No sighting records</Text>
        )}
      </View>

      {/* ── Danger Zone ──────────────────────────────── */}
      <View style={styles.dangerZone}>
        <Button
          label="Delete Turtle Record"
          variant="danger"
          onPress={handleDelete}
          loading={deleteMutation.isPending}
          leftIcon={<Ionicons name="trash-outline" size={16} color={Colors.status.error} />}
        />
      </View>

      <View style={{ height: Spacing['3xl'] }} />
    </ScrollView>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={infoStyles.row}>
      <Text style={infoStyles.label}>{label}</Text>
      <Text style={[infoStyles.value, mono && infoStyles.mono]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  label: { ...TextStyles.bodySmall, color: Colors.text.muted, flex: 1 },
  value: { ...TextStyles.body, color: Colors.text.primary, flex: 2, textAlign: 'right', textTransform: 'capitalize' },
  mono: { fontFamily: 'monospace', color: Colors.accent.teal },
});

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { gap: Spacing.base },

  heroWrap: {
    height: 260,
    backgroundColor: Colors.bg.secondary,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%' },
  heroPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  heroPlaceholderText: { ...TextStyles.body, color: Colors.text.muted },
  heroOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(11, 25, 41, 0.85)',
    padding: Spacing.base,
    gap: 2,
  },
  heroTurtleId: {
    fontFamily: 'monospace',
    fontSize: 22,
    fontWeight: '700',
    color: Colors.accent.teal,
    letterSpacing: 1,
  },
  heroSpecies: { ...TextStyles.body, color: Colors.text.secondary },

  lastSeenBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warm.amberSubtle,
    borderWidth: 1,
    borderColor: Colors.warm.amberBorder,
    marginHorizontal: Spacing.base,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  lastSeenText: { ...TextStyles.body, color: Colors.warm.amber, flex: 1, fontWeight: '500' },

  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    gap: 0,
  },
  cardTitle: { ...TextStyles.h3, color: Colors.text.secondary, marginBottom: Spacing.sm },

  notesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  editLink: { ...TextStyles.label, color: Colors.accent.teal },
  notesInput: {
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.md,
    padding: Spacing.md,
    ...TextStyles.body,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    minHeight: 80,
  },
  notesText: { ...TextStyles.body, color: Colors.text.secondary, lineHeight: 22 },

  section: { marginHorizontal: Spacing.base, gap: Spacing.md },
  sectionTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  sightingsList: { gap: Spacing.md },
  noSightings: { ...TextStyles.body, color: Colors.text.muted, textAlign: 'center', paddingVertical: Spacing.xl },

  dangerZone: { marginHorizontal: Spacing.base },
});
