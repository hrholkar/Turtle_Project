import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, SpeciesLabels } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii, Shadows } from '../../constants/theme';
import { YearsBadge } from '../ui/Badges';
import { UPLOADS_BASE_URL } from '../../constants/theme';
import type { Turtle } from '../../types';
import { Ionicons } from '@expo/vector-icons';

interface TurtleCardProps {
  turtle: Turtle;
  onPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
}

export function TurtleCard({ turtle, onPress, style, compact = false }: TurtleCardProps) {
  const imageUri = turtle.profileImage
    ? `${UPLOADS_BASE_URL}${turtle.profileImage}`
    : null;

  const yearsSinceSeen = Math.floor(
    (Date.now() - new Date(turtle.latestSightingDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.containerCompact, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image */}
      <View style={[styles.imageWrap, compact && styles.imageWrapCompact]}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="fish-outline" size={compact ? 20 : 28} color={Colors.text.muted} />
          </View>
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.turtleId} numberOfLines={1}>{turtle.turtleId}</Text>
          {!compact && <YearsBadge years={yearsSinceSeen} />}
        </View>

        <Text style={styles.species}>{SpeciesLabels[turtle.species] || turtle.species}</Text>

        <View style={styles.meta}>
          <MetaPill
            icon="eye-outline"
            label={`${turtle.totalSightings} sighting${turtle.totalSightings !== 1 ? 's' : ''}`}
          />
          {turtle.gender !== 'unknown' && (
            <MetaPill
              icon={turtle.gender === 'male' ? 'male-outline' : 'female-outline'}
              label={turtle.gender}
            />
          )}
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={Colors.text.muted}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
}

function MetaPill({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.metaPill}>
      <Ionicons name={icon as any} size={11} color={Colors.text.muted} />
      <Text style={styles.metaLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.sm,
  },
  containerCompact: {
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  imageWrap: {
    width: 64,
    height: 64,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.bg.tertiary,
  },
  imageWrapCompact: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  turtleId: {
    ...TextStyles.mono,
    color: Colors.accent.teal,
    fontWeight: '700',
    flex: 1,
  },
  species: {
    ...TextStyles.bodySmall,
    color: Colors.text.secondary,
  },
  meta: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaLabel: {
    ...TextStyles.labelSmall,
    color: Colors.text.muted,
    textTransform: 'capitalize',
  },
  chevron: {
    marginLeft: 'auto',
  },
});
