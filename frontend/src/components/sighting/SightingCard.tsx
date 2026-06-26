import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii, Shadows, UPLOADS_BASE_URL } from '../../constants/theme';
import { ConfidenceBadge, YearsBadge } from '../ui/Badges';
import { Ionicons } from '@expo/vector-icons';
import type { Sighting } from '../../types';

interface SightingCardProps {
  sighting: Sighting;
  turtleId?: string;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
}

export function SightingCard({ sighting, turtleId, onPress, style }: SightingCardProps) {
  const imageUri = sighting.image
    ? `${UPLOADS_BASE_URL}${sighting.image}`
    : 'https://images.unsplash.com/photo-1544605481-9b7e719ab2c7?q=80&w=400&auto=format&fit=crop';

  const date = new Date(sighting.sightingDate);
  const dateStr = date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Image thumbnail */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.date}>{dateStr}</Text>
          {sighting.yearsSinceLastSeen !== undefined && (
            <YearsBadge years={sighting.yearsSinceLastSeen} />
          )}
        </View>

        {turtleId && (
          <Text style={styles.turtleId}>{turtleId}</Text>
        )}

        {sighting.location && (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.location} numberOfLines={1}>{sighting.location}</Text>
          </View>
        )}

        {sighting.confidenceScore !== undefined && (
          <ConfidenceBadge score={sighting.confidenceScore} size="sm" style={styles.badge} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.md,
  },
  imageWrap: {
    width: 80,
    height: 80,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.bg.tertiary,
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  content: {
    flex: 1,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  date: {
    ...TextStyles.h3,
    color: Colors.text.primary,
  },
  turtleId: {
    ...TextStyles.mono,
    color: Colors.accent.blue,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  location: {
    ...TextStyles.bodySmall,
    color: Colors.text.secondary,
    flex: 1,
  },
  badge: {
    marginTop: Spacing.xs,
  },
});
