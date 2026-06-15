import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, MatchStrengthColors, SpeciesLabels } from '../src/constants/colors';
import { TextStyles } from '../src/constants/typography';
import { Spacing, Radii, Shadows, UPLOADS_BASE_URL } from '../src/constants/theme';
import { ConfidenceBadge, YearsBadge } from '../src/components/ui/Badges';
import { Button } from '../src/components/ui/Button';
import type { IdentifyResult, MatchStrength } from '../src/types';

const matchStrengthMessages: Record<MatchStrength, string> = {
  strong: 'Strong match found — this turtle is in the database.',
  probable: 'Probable match — please review and verify.',
  new: 'No matching turtle found — submitted for verification.',
};

export default function ResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ resultData: string }>();

  let result: IdentifyResult | null = null;
  try {
    result = JSON.parse(params.resultData || '{}');
  } catch {}

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

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Result Header ─────────────────────────────── */}
      <View style={[styles.resultHeader, { borderColor: `${strengthColor}40`, backgroundColor: `${strengthColor}10` }]}>
        <Ionicons
          name={isMatch ? 'checkmark-circle' : strength === 'probable' ? 'alert-circle' : 'add-circle'}
          size={48}
          color={strengthColor}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.resultTitle, { color: strengthColor }]}>
            {isMatch ? 'Turtle Identified' : strength === 'probable' ? 'Possible Match' : 'New Turtle'}
          </Text>
          <Text style={styles.resultSubtitle}>{matchStrengthMessages[strength]}</Text>
        </View>
      </View>

      {/* ── Match Found Branch ───────────────────────── */}
      {isMatch && result.turtle && (
        <>
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Matched Turtle</Text>
              {result.confidence != null && (
                <ConfidenceBadge score={result.confidence} matchStrength={strength} />
              )}
            </View>

            <View style={styles.turtleRow}>
              {result.turtle.profileImage && (
                <Image
                  source={{ uri: `${UPLOADS_BASE_URL}${result.turtle.profileImage}` }}
                  style={styles.turtleThumb}
                  resizeMode="cover"
                />
              )}
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.turtleId}>{result.turtle.turtleId}</Text>
                <Text style={styles.turtleSpecies}>
                  {SpeciesLabels[result.turtle.species] || result.turtle.species}
                </Text>
                <Text style={styles.turtleSightings}>
                  {result.turtle.totalSightings} total sighting{result.turtle.totalSightings !== 1 ? 's' : ''}
                </Text>
              </View>
            </View>

            {/* Years since last seen */}
            {result.yearsSinceSeen !== undefined && (
              <View style={styles.yearsBanner}>
                <Ionicons name="time-outline" size={16} color={Colors.warm.amber} />
                <Text style={styles.yearsBannerText}>
                  {result.yearsSinceLabel || `Last recorded ${result.yearsSinceSeen} years ago`}
                </Text>
                <YearsBadge years={result.yearsSinceSeen} />
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              label="View Turtle Profile"
              variant="primary"
              size="lg"
              onPress={() => router.push(`/turtle/${result!.turtle!.turtleId}`)}
              leftIcon={<Ionicons name="fish" size={18} color={Colors.text.inverse} />}
            />
            <Button
              label="Identify Another"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(tabs)/upload')}
            />
          </View>
        </>
      )}

      {/* ── Pending Branch ────────────────────────────── */}
      {!isMatch && result.pending && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Submission Status</Text>

            <View style={styles.pendingInfo}>
              <Ionicons name="hourglass-outline" size={32} color={Colors.status.pending} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={styles.pendingTitle}>Awaiting Admin Review</Text>
                <Text style={styles.pendingSubtitle}>
                  Your sighting has been submitted for verification.
                  An admin will review and create a new turtle profile if appropriate.
                </Text>
              </View>
            </View>

            {result.allMatches.length > 0 && (
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedTitle}>
                  Closest possible matches ({result.allMatches.length})
                </Text>
                {result.allMatches.slice(0, 3).map((match, i) => (
                  <View key={match.turtleId} style={styles.matchRow}>
                    <Text style={styles.matchRank}>#{match.rank}</Text>
                    <Text style={styles.matchId}>{match.turtleId}</Text>
                    <ConfidenceBadge score={match.score} size="sm" />
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.actions}>
            <Button
              label="Review Pending"
              variant="ghost"
              size="lg"
              onPress={() => router.push('/(tabs)/pending')}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent.teal} />}
            />
            <Button
              label="Identify Another"
              variant="secondary"
              size="lg"
              onPress={() => router.push('/(tabs)/upload')}
            />
          </View>
        </>
      )}

      {/* ── Processing Details ───────────────────────── */}
      <View style={styles.metaCard}>
        <Text style={styles.metaTitle}>Processing Details</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Match type</Text>
          <Text style={[styles.metaValue, { color: strengthColor }]}>
            {strength.charAt(0).toUpperCase() + strength.slice(1)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Candidates compared</Text>
          <Text style={styles.metaValue}>{result.allMatches.length}</Text>
        </View>
        {result.confidence != null && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Top similarity score</Text>
            <Text style={styles.metaValue}>{Math.round(result.confidence * 100)}%</Text>
          </View>
        )}
      </View>

      <View style={{ height: Spacing['2xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.base },

  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
    padding: Spacing.base,
  },
  resultTitle: { fontSize: 20, fontWeight: '700', letterSpacing: -0.3 },
  resultSubtitle: { ...TextStyles.bodySmall, color: Colors.text.secondary, marginTop: 2 },

  card: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.base,
    gap: Spacing.md,
  },
  cardTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  turtleRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  turtleThumb: { width: 72, height: 72, borderRadius: Radii.md },
  turtleId: { fontFamily: 'monospace', fontSize: 18, fontWeight: '700', color: Colors.accent.teal },
  turtleSpecies: { ...TextStyles.body, color: Colors.text.secondary },
  turtleSightings: { ...TextStyles.label, color: Colors.text.muted },

  yearsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warm.amberSubtle,
    borderWidth: 1,
    borderColor: Colors.warm.amberBorder,
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  yearsBannerText: { ...TextStyles.body, color: Colors.warm.amber, flex: 1, fontWeight: '500' },

  actions: { gap: Spacing.md },

  pendingInfo: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  pendingTitle: { ...TextStyles.h3, color: Colors.status.pending },
  pendingSubtitle: { ...TextStyles.bodySmall, color: Colors.text.secondary },
  suggestedSection: { gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border.subtle, paddingTop: Spacing.md },
  suggestedTitle: { ...TextStyles.label, color: Colors.text.muted },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  matchRank: { ...TextStyles.labelSmall, color: Colors.text.muted, width: 24 },
  matchId: { ...TextStyles.mono, color: Colors.accent.teal, flex: 1 },

  metaCard: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    padding: Spacing.base,
    gap: 0,
  },
  metaTitle: { ...TextStyles.label, color: Colors.text.muted, marginBottom: Spacing.sm },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  metaLabel: { ...TextStyles.bodySmall, color: Colors.text.muted },
  metaValue: { ...TextStyles.label, color: Colors.text.primary, fontWeight: '600' },
});
