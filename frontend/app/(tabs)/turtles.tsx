import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, SpeciesLabels } from '../../src/constants/colors';
import { TextStyles } from '../../src/constants/typography';
import { Spacing, Radii } from '../../src/constants/theme';
import { TurtleCard } from '../../src/components/turtle/TurtleCard';
import { useTurtles } from '../../src/hooks/useQueries';
import type { TurtleSpecies } from '../../src/types';

const SPECIES_FILTERS: Array<{ key: TurtleSpecies | 'all'; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'green', label: 'Green' },
  { key: 'loggerhead', label: 'Loggerhead' },
  { key: 'hawksbill', label: 'Hawksbill' },
  { key: 'leatherback', label: 'Leatherback' },
  { key: 'unknown', label: 'Unknown' },
];

export default function TurtlesScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [species, setSpecies] = useState<TurtleSpecies | undefined>(undefined);

  const { data, isLoading, refetch } = useTurtles({
    search: search || undefined,
    species,
    limit: 50,
  });

  return (
    <View style={styles.screen}>
      {/* ── Search Bar ──────────────────────────────────── */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by ID, location, notes..."
          placeholderTextColor={Colors.text.muted}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── Species Filter ───────────────────────────────── */}
      <FlatList
        data={SPECIES_FILTERS}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item }) => {
          const isActive = (item.key === 'all' && !species) || item.key === species;
          return (
            <TouchableOpacity
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setSpecies(item.key === 'all' ? undefined : item.key as TurtleSpecies)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      {/* ── Results Count ────────────────────────────────── */}
      {!isLoading && data && (
        <Text style={styles.resultsCount}>{data.total} turtle{data.total !== 1 ? 's' : ''}</Text>
      )}

      {/* ── Turtle List ──────────────────────────────────── */}
      {isLoading ? (
        <ActivityIndicator color={Colors.accent.teal} style={{ marginTop: Spacing.xl }} />
      ) : (
        <FlatList
          data={data?.items || []}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          onRefresh={refetch}
          refreshing={false}
          renderItem={({ item }) => (
            <TurtleCard
              turtle={item}
              onPress={() => router.push(`/turtle/${item.turtleId}`)}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="fish-outline" size={48} color={Colors.text.muted} />
              <Text style={styles.emptyTitle}>No turtles found</Text>
              <Text style={styles.emptySubtitle}>
                {search ? 'Try a different search term' : 'Identify your first turtle to get started'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg.primary },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.bg.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.default,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  searchInput: {
    flex: 1,
    ...TextStyles.body,
    color: Colors.text.primary,
    padding: 0,
  },

  filterRow: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  filterChipActive: {
    backgroundColor: Colors.accent.tealSubtle,
    borderColor: Colors.accent.tealBorder,
  },
  filterChipText: {
    ...TextStyles.label,
    color: Colors.text.muted,
  },
  filterChipTextActive: { color: Colors.accent.teal },

  resultsCount: {
    ...TextStyles.labelSmall,
    color: Colors.text.muted,
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
  },

  list: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'] },

  empty: { alignItems: 'center', paddingTop: Spacing['4xl'], gap: Spacing.md },
  emptyTitle: { ...TextStyles.h3, color: Colors.text.secondary },
  emptySubtitle: {
    ...TextStyles.bodySmall,
    color: Colors.text.muted,
    textAlign: 'center',
    maxWidth: 260,
  },
});
