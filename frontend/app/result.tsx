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
import { Card } from '../src/components/ui/Card';
import type { IdentifyResult, MatchStrength } from '../src/types';

const matchStrengthMessages: Record<MatchStrength, string> = {
  strong:   'Strong match found — this turtle is in the database.',
  probable: 'Probable match — please review and verify.',
  new:      'No matching turtle found — submitted for verification.',
};

// ── Helper: render one top-match row ─────────────────────────────────────────
function TopMatchRow({
  rank,
  identity,
  similarity,
  species,
  firstSeen,
  latestSeen,
  location,
  isTop,
}: {
  rank: number;
  identity: string;
  similarity: number;   // 0-100 %
  species?: string;
  firstSeen?: number;
  latestSeen?: number;
  location?: string;
  isTop: boolean;
}) {
  const color = isTop ? Colors.accent.blue : Colors.text.muted;
  return (
    <View style={[matchRowStyles.container, isTop && matchRowStyles.topContainer]}>
      <View style={matchRowStyles.rankBadge}>
        <Text style={[matchRowStyles.rankText, { color }]}>#{rank}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={matchRowStyles.headerRow}>
          <Text style={[matchRowStyles.identity, { color }]}>{identity}</Text>
          <View style={[matchRowStyles.simBadge, { backgroundColor: isTop ? Colors.accent.blue : Colors.bg.tertiary }]}>
            <Text style={[matchRowStyles.simText, { color: isTop ? '#fff' : Colors.text.secondary }]}>
              {similarity.toFixed(2)}%
            </Text>
          </View>
        </View>
        {species && (
          <Text style={matchRowStyles.meta}>{species}</Text>
        )}
        {(firstSeen || latestSeen || location) ? (
          <Text style={matchRowStyles.metaSub}>
            {[
              firstSeen && latestSeen && firstSeen !== latestSeen
                ? `${firstSeen}–${latestSeen}`
                : firstSeen
                ? `${firstSeen}`
                : null,
              location || null,
            ]
              .filter(Boolean)
              .join('  ·  ')}
          </Text>
        ) : null}
      </View>
    </View>
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
  },
  topContainer: {
    backgroundColor: Colors.accent.blueSubtle,
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 0,
    marginBottom: 2,
  },
  rankBadge: {
    width: 28,
    alignItems: 'center',
    paddingTop: 2,
  },
  rankText: { fontFamily: 'monospace', fontSize: 13, fontWeight: '700' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  identity: { fontFamily: 'monospace', fontSize: 16, fontWeight: '700', flex: 1 },
  simBadge: {
    borderRadius: Radii.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  simText: { fontSize: 12, fontWeight: '700' },
  meta:    { ...TextStyles.bodySmall, color: Colors.text.secondary, marginTop: 2 },
  metaSub: { ...TextStyles.label, color: Colors.text.muted, fontSize: 11, marginTop: 1 },
});


// ── Main result screen ─────────────────────────────────────────────────────────
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

  const isMatch      = result.type === 'match';
  const strength     = result.matchStrength;
  const strengthColor = MatchStrengthColors[strength];

  // Extract top-3 matches from allMatches
  const top3 = result.allMatches?.slice(0, 3) ?? [];

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

      {/* ── Match Found Branch ────────────────────────── */}
      {isMatch && result.turtle && (
        <>
          {/* Primary turtle card */}
          <Card style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardTitle}>Best Match</Text>
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
          </Card>

          {/* Top-3 matches */}
          {top3.length > 1 && (
            <Card style={styles.card}>
              <Text style={styles.cardTitle}>Top {top3.length} Candidates</Text>
              {top3.map((m, i) => (
                <TopMatchRow
                  key={m.turtleId}
                  rank={i + 1}
                  identity={m.turtleId}
                  similarity={parseFloat((m.score * 100).toFixed(2))}
                  isTop={i === 0}
                />
              ))}
            </Card>
          )}

          <View style={styles.actions}>
            <Button
              label="View Turtle Profile"
              variant="primary"
              size="lg"
              onPress={() => router.push(`/turtle/${result!.turtle!.turtleId}`)}
              leftIcon={<Ionicons name="water" size={18} color={Colors.text.inverse} />}
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

      {/* ── Pending / New Turtle Branch ───────────────── */}
      {!isMatch && result.pending && (
        <>
          <Card style={styles.card}>
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

            {/* Closest possible matches from top-3 */}
            {top3.length > 0 && (
              <View style={styles.suggestedSection}>
                <Text style={styles.suggestedTitle}>
                  Closest possible matches ({top3.length})
                </Text>
                {top3.map((match, i) => (
                  <TopMatchRow
                    key={match.turtleId}
                    rank={i + 1}
                    identity={match.turtleId}
                    similarity={parseFloat((match.score * 100).toFixed(2))}
                    isTop={false}
                  />
                ))}
              </View>
            )}
          </Card>

          <View style={styles.actions}>
            <Button
              label="Review Pending"
              variant="ghost"
              size="lg"
              onPress={() => router.push('/(tabs)/pending')}
              leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={Colors.accent.blue} />}
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
      <Card style={styles.metaCard}>
        <Text style={styles.metaTitle}>Processing Details</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Match type</Text>
          <Text style={[styles.metaValue, { color: strengthColor }]}>
            {strength.charAt(0).toUpperCase() + strength.slice(1)}
          </Text>
        </View>
        {result.predictedSpecies && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Predicted species</Text>
            <Text style={styles.metaValue} numberOfLines={1}>{result.predictedSpecies}</Text>
          </View>
        )}
        {result.imageSide && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Image side</Text>
            <Text style={styles.metaValue}>{result.imageSide}</Text>
          </View>
        )}
        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Candidates compared</Text>
          <Text style={styles.metaValue}>{result.allMatches?.length ?? 0}</Text>
        </View>
        {result.confidence != null && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Top similarity</Text>
            <Text style={styles.metaValue}>{Math.round(result.confidence * 100)}%</Text>
          </View>
        )}
        {result.newIdentity && (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Auto-assigned ID</Text>
            <Text style={[styles.metaValue, { color: Colors.accent.blue, fontFamily: 'monospace' }]}>
              {result.newIdentity}
            </Text>
          </View>
        )}
      </Card>

      <View style={{ height: Spacing['2xl'] }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen:  { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.base },

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

  card: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  cardTitle:     { ...TextStyles.h3, color: Colors.text.secondary },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  turtleRow:     { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
  turtleThumb:   { width: 72, height: 72, borderRadius: Radii.md },
  turtleId:      { fontFamily: 'monospace', fontSize: 18, fontWeight: '700', color: Colors.accent.blue },
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

  pendingInfo:    { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  pendingTitle:   { ...TextStyles.h3, color: Colors.status.pending },
  pendingSubtitle: { ...TextStyles.bodySmall, color: Colors.text.secondary },
  suggestedSection: {
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    paddingTop: Spacing.md,
  },
  suggestedTitle: { ...TextStyles.label, color: Colors.text.muted },

  metaCard: {
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
  metaValue: { ...TextStyles.label,     color: Colors.text.primary, fontWeight: '600' },
});
