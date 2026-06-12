import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii } from '../../src/constants/theme';
import { StatCard } from '../../src/components/ui/StatCard';
import { SightingCard } from '../../src/components/sighting/SightingCard';
import { useDashboardStats, useRecentSightings, usePendingVerifications } from '../../src/hooks/useQueries';

export default function HomeScreen() {
  const router = useRouter();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useDashboardStats();

  const {
    data: recentSightings,
    isLoading: sightingsLoading,
    refetch: refetchSightings,
  } = useRecentSightings(6);

  const { data: pendingData } = usePendingVerifications('pending');

  const isLoading = statsLoading || sightingsLoading;
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchSightings()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.teal}
        />
      }
    >
      {/* ── Header Banner ─────────────────────────────────────── */}
      <View style={styles.banner}>
        <View style={styles.bannerText}>
          <Text style={styles.greeting}>Conservation Field Log</Text>
          <Text style={styles.bannerTitle}>Sea Turtle{'\n'}Re-Identification</Text>
        </View>
        <View style={styles.bannerIcon}>
          <Ionicons name="fish" size={52} color={Colors.accent.teal} style={{ opacity: 0.25 }} />
        </View>
      </View>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push('/(tabs)/upload')}
          activeOpacity={0.8}
        >
          <Ionicons name="scan" size={22} color={Colors.text.inverse} />
          <Text style={styles.actionBtnTextPrimary}>Identify Turtle</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnSecondary]}
          onPress={() => router.push('/(tabs)/pending')}
          activeOpacity={0.8}
        >
          <View style={styles.actionBtnIconRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color={Colors.accent.teal} />
            {(pendingData?.total || 0) > 0 && (
              <View style={styles.actionBadge}>
                <Text style={styles.actionBadgeText}>{pendingData!.total}</Text>
              </View>
            )}
          </View>
          <Text style={styles.actionBtnTextSecondary}>Review Pending</Text>
        </TouchableOpacity>
      </View>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>OVERVIEW</Text>
        {statsLoading ? (
          <ActivityIndicator color={Colors.accent.teal} style={{ marginTop: Spacing.lg }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Turtles"
              value={stats?.totalTurtles ?? 0}
              accent="teal"
            />
            <StatCard
              label="Total Sightings"
              value={stats?.totalSightings ?? 0}
              accent="teal"
            />
            <StatCard
              label="Returning"
              value={stats?.returningTurtles ?? 0}
              accent="success"
            />
            <StatCard
              label="New This Month"
              value={stats?.newTurtlesThisMonth ?? 0}
              accent="amber"
            />
          </View>
        )}
      </View>

      {/* ── Recent Sightings ──────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT SIGHTINGS</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/turtles')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {sightingsLoading ? (
          <ActivityIndicator color={Colors.accent.teal} style={{ marginTop: Spacing.lg }} />
        ) : recentSightings && recentSightings.length > 0 ? (
          <View style={styles.sightingsList}>
            {recentSightings.map((sighting) => (
              <SightingCard
                key={sighting._id}
                sighting={sighting}
                turtleId={sighting.turtleId}
                onPress={() => router.push(`/turtle/${sighting.turtleId}`)}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon="camera-outline"
            title="No sightings yet"
            subtitle="Upload a turtle image to record the first sighting"
          />
        )}
      </View>

      {/* Padding at bottom */}
      <View style={{ height: Spacing['2xl'] }} />
    </ScrollView>
  );
}

function EmptyState({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <View style={emptyStyles.container}>
      <Ionicons name={icon as any} size={40} color={Colors.text.muted} />
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: Spacing['3xl'], gap: Spacing.sm },
  title: { ...TextStyles.h3, color: Colors.text.secondary },
  subtitle: { ...TextStyles.bodySmall, color: Colors.text.muted, textAlign: 'center', maxWidth: 260 },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.xl },

  // ── Banner ──────────────────────────────────────────────────
  banner: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.xl,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bannerText: { flex: 1 },
  greeting: {
    ...TextStyles.overline,
    color: Colors.accent.teal,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  bannerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text.primary,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  bannerIcon: { opacity: 1 },

  // ── Quick Actions ───────────────────────────────────────────
  quickActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: {
    flex: 1,
    borderRadius: Radii.lg,
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionBtnPrimary: { backgroundColor: Colors.accent.teal },
  actionBtnSecondary: {
    backgroundColor: Colors.bg.secondary,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  actionBtnTextPrimary: { ...TextStyles.h3, color: Colors.text.inverse },
  actionBtnTextSecondary: { ...TextStyles.h3, color: Colors.text.primary },
  actionBtnIconRow: { position: 'relative' },
  actionBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    backgroundColor: Colors.status.error,
    borderRadius: 999,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  actionBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },

  // ── Sections ────────────────────────────────────────────────
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: {
    ...TextStyles.overline,
    color: Colors.text.muted,
    letterSpacing: 1.5,
  },
  seeAll: { ...TextStyles.label, color: Colors.accent.teal },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sightingsList: { gap: Spacing.md },
});
