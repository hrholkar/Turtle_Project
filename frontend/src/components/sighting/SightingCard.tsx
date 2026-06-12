import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii, UPLOADS_BASE_URL } from '../../constants/theme';
import { ConfidenceBadge, YearsBadge } from '../ui/Badges';
import { Ionicons } from '@expo/vector-icons';
import type { Sighting } from '../../types';

interface SightingCardProps {
  sighting: Sighting;
  turtleId?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export function SightingCard({ sighting, turtleId, onPress, style }: SightingCardProps) {
  const imageUri = sighting.image
    ? `${UPLOADS_BASE_URL}${sighting.image}`
    : null;

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
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera-outline" size={22} color={Colors.text.muted} />
          </View>
        )}
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
            <Ionicons name="location-outline" size={12} color={Colors.text.muted} />
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
    borderColor: Colors.border.default,
    overflow: 'hidden',
    gap: Spacing.md,
    padding: Spacing.md,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: Radii.md,
    overflow: 'hidden',
    backgroundColor: Colors.bg.tertiary,
    flexShrink: 0,
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    ...TextStyles.label,
    color: Colors.text.primary,
    fontWeight: '600',
  },
  turtleId: {
    ...TextStyles.mono,
    color: Colors.accent.teal,
    fontSize: 12,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  location: {
    ...TextStyles.labelSmall,
    color: Colors.text.muted,
    flex: 1,
  },
  badge: {
    marginTop: 2,
  },
});
