import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii, Shadows } from '../../src/constants/theme';
import { StatCard } from '../../src/components/ui/StatCard';
import { SightingCard } from '../../src/components/sighting/SightingCard';
import { Button } from '../../src/components/ui/Button';
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

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent.blue}
        />
      }
    >
      {/* ── Welcome Header ─────────────────────────────────────── */}
      <View style={styles.welcomeHeader}>
        <View style={styles.welcomeTextGroup}>
          <Text style={styles.welcomeDate}>{today}</Text>
          <Text style={styles.welcomeTitle}>Welcome back, Researcher</Text>
        </View>
      </View>

      {/* ── Quick Actions ─────────────────────────────────────── */}
      <View style={styles.quickActions}>
        <Button 
          label="Identify Turtle" 
          variant="primary" 
          size="lg" 
          style={{ flex: 1 }}
          onPress={() => router.push('/(tabs)/upload')}
          leftIcon={<Ionicons name="scan" size={22} color={Colors.text.inverse} />}
        />
      </View>

      {/* ── Stats Strip ───────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PLATFORM STATISTICS</Text>
        {statsLoading ? (
          <ActivityIndicator color={Colors.accent.blue} style={{ marginTop: Spacing.lg }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard
              label="Total Turtles"
              value={stats?.totalTurtles ?? 0}
              accent="teal"
            />
            <StatCard
              label="Sightings"
              value={stats?.totalSightings ?? 0}
              accent="teal"
            />
            <StatCard
              label="Returning"
              value={stats?.returningTurtles ?? 0}
              accent="success"
            />
            <StatCard
              label="New Month"
              value={stats?.newTurtlesThisMonth ?? 0}
              accent="amber"
            />
          </View>
        )}
      </View>

      {/* ── Recent Sightings ──────────────────────────────────── */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>LATEST ACTIVITY</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/turtles')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        </View>

        {sightingsLoading ? (
          <ActivityIndicator color={Colors.accent.blue} style={{ marginTop: Spacing.lg }} />
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
            icon="water-outline"
            title="No recent activity"
            subtitle="Recent sightings and identifications will appear here."
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
      <Ionicons name={icon as any} size={48} color={Colors.text.disabled} />
      <Text style={emptyStyles.title}>{title}</Text>
      <Text style={emptyStyles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const emptyStyles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    paddingVertical: Spacing['3xl'], 
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    ...Shadows.sm,
  },
  title: { ...TextStyles.h3, color: Colors.text.secondary },
  subtitle: { ...TextStyles.body, color: Colors.text.muted, textAlign: 'center' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },
  content: { padding: Spacing.base, gap: Spacing.xl },

  // ── Welcome Header ──────────────────────────────────────────
  welcomeHeader: {
    paddingVertical: Spacing.sm,
  },
  welcomeTextGroup: {
    gap: 2,
  },
  welcomeDate: {
    ...TextStyles.label,
    color: Colors.text.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  welcomeTitle: {
    ...TextStyles.h1,
    color: Colors.text.primary,
  },

  // ── Quick Actions ───────────────────────────────────────────
  quickActions: { flexDirection: 'row', gap: Spacing.md },

  // ── Sections ────────────────────────────────────────────────
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: {
    ...TextStyles.overline,
    color: Colors.text.secondary,
  },
  seeAll: { ...TextStyles.label, color: Colors.accent.blue },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  sightingsList: { gap: Spacing.md },
});
