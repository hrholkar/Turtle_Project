import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii } from '../../src/constants/theme';
import { useDashboardStats, useSpeciesBreakdown } from '../../src/hooks/useQueries';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../src/components/ui/Card';

export default function StatsScreen() {
  const { data: stats, isLoading } = useDashboardStats();
  const { data: speciesData } = useSpeciesBreakdown();

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent.blue} size="large" />
      </View>
    );
  }

  const returnRate = stats && stats.totalTurtles > 0
    ? Math.round((stats.returningTurtles / stats.totalTurtles) * 100)
    : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Conservation Health ───────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CONSERVATION HEALTH</Text>

        <Card style={styles.healthCard}>
          <View style={styles.returnRateCircle}>
            <Text style={styles.returnRateValue}>{returnRate}%</Text>
            <Text style={styles.returnRateLabel}>Return Rate</Text>
          </View>
          <View style={styles.healthMeta}>
            <HealthRow
              icon="repeat-outline"
              label="Returning turtles"
              value={stats?.returningTurtles ?? 0}
              color={Colors.status.success}
            />
            <HealthRow
              icon="add-circle-outline"
              label="Avg sightings/turtle"
              value={stats?.avgSightingsPerTurtle ?? 0}
              color={Colors.accent.blue}
            />
            <HealthRow
              icon="calendar-outline"
              label="New this month"
              value={stats?.newTurtlesThisMonth ?? 0}
              color={Colors.warm.amber}
            />
          </View>
        </Card>
      </View>

      {/* ── Key Metrics ───────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>KEY METRICS</Text>
        <View style={styles.metricsGrid}>
          <MetricBlock label="Total Turtles" value={stats?.totalTurtles ?? 0} color={Colors.accent.blue} />
          <MetricBlock label="Total Sightings" value={stats?.totalSightings ?? 0} color={Colors.accent.blue} />
        </View>
      </View>

      {/* ── Species Breakdown ─────────────────────────── */}
      {speciesData && speciesData.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SPECIES BREAKDOWN</Text>
          <Card style={styles.speciesCard}>
            {speciesData.map((item: { species: string; count: number }, i: number) => {
              const max = speciesData[0].count;
              const pct = max > 0 ? item.count / max : 0;
              return (
                <View key={item.species} style={styles.speciesRow}>
                  <Text style={styles.speciesName} numberOfLines={1}>
                    {item.species.replace('_', ' ')}
                  </Text>
                  <View style={styles.speciesBarBg}>
                    <View
                      style={[styles.speciesBar, { width: `${Math.max(pct * 100, 4)}%` }]}
                    />
                  </View>
                  <Text style={styles.speciesCount}>{item.count}</Text>
                </View>
              );
            })}
          </Card>
        </View>
      )}

      {/* ── Phase 2 Teaser ───────────────────────────── */}
      <Card style={styles.phase2Card}>
        <View style={styles.phase2Icon}>
          <Ionicons name="time-outline" size={24} color={Colors.status.pending} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.phase2Title}>Return Prediction</Text>
          <Text style={styles.phase2Subtitle}>
            Phase 2 feature — AI-powered return date prediction for individual turtles coming soon.
          </Text>
        </View>
      </Card>

      <View style={{ height: Spacing['2xl'] }} />
    </ScrollView>
  );
}

function HealthRow({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <View style={healthStyles.row}>
      <View style={[healthStyles.iconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon as any} size={14} color={color} />
      </View>
      <Text style={healthStyles.label}>{label}</Text>
      <Text style={[healthStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

function MetricBlock({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <Card style={metricStyles.block}>
      <Text style={[metricStyles.value, { color }]}>{value}</Text>
      <Text style={metricStyles.label}>{label}</Text>
    </Card>
  );
}

const healthStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: 6 },
  iconWrap: { width: 26, height: 26, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, ...TextStyles.bodySmall, color: Colors.text.secondary },
  value: { ...TextStyles.label, fontWeight: '700' },
});

const metricStyles = StyleSheet.create({
  block: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    padding: Spacing.base,
  },
  value: { fontSize: 36, fontWeight: '700', letterSpacing: -1 },
  label: { ...TextStyles.label, color: Colors.text.muted },
});

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: Colors.bg.primary, alignItems: 'center', justifyContent: 'center' },
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.xl },

  section: { gap: Spacing.md },
  sectionLabel: { ...TextStyles.overline, color: Colors.text.secondary },

  healthCard: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
    padding: Spacing.base,
  },
  returnRateCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: Colors.status.success,
    backgroundColor: Colors.status.successSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  returnRateValue: { fontSize: 22, fontWeight: '700', color: Colors.status.success },
  returnRateLabel: { fontSize: 10, color: Colors.status.success, fontWeight: '500' },
  healthMeta: { flex: 1 },

  metricsGrid: { flexDirection: 'row', gap: Spacing.md },

  speciesCard: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  speciesRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  speciesName: { width: 90, ...TextStyles.label, color: Colors.text.secondary, textTransform: 'capitalize' },
  speciesBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.bg.tertiary,
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  speciesBar: { height: '100%', backgroundColor: Colors.accent.blue, borderRadius: Radii.full },
  speciesCount: { width: 30, ...TextStyles.labelSmall, color: Colors.text.muted, textAlign: 'right' },

  phase2Card: {
    backgroundColor: Colors.status.pendingSubtle,
    borderColor: `${Colors.status.pending}30`,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.base,
  },
  phase2Icon: {
    width: 44,
    height: 44,
    borderRadius: Radii.md,
    backgroundColor: `${Colors.status.pending}20`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  phase2Title: { ...TextStyles.h3, color: Colors.status.pending },
  phase2Subtitle: { ...TextStyles.bodySmall, color: Colors.text.muted, marginTop: 2 },
});
