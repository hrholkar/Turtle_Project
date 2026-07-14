import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Colors, SpeciesLabels } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii, Shadows } from '../../constants/theme';
import { YearsBadge } from '../ui/Badges';
import { UPLOADS_BASE_URL } from '../../constants/theme';
import type { Turtle } from '../../types';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../ui/Button';

interface TurtleCardProps {
  turtle: Turtle;
  onPress?: () => void;
  style?: ViewStyle | ViewStyle[];
  compact?: boolean;
}

export function TurtleCard({ turtle, onPress, style, compact = false }: TurtleCardProps) {
  // Using a beautiful placeholder from Unsplash for missing images
  const imageUri = turtle.profileImage
    ? `${UPLOADS_BASE_URL}${turtle.profileImage}`
    : 'https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?q=80&w=600&auto=format&fit=crop';

  const yearsSinceSeen = Math.floor(
    (Date.now() - new Date(turtle.latestSightingDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  return (
    <View style={[styles.container, style]}>
      {/* Large Image Header */}
      <View style={styles.imageWrap}>
        <Image source={{ uri: imageUri }} style={styles.image} resizeMode="cover" />
        <View style={styles.badgeContainer}>
          <View style={styles.speciesBadge}>
            <Text style={styles.speciesBadgeText}>{SpeciesLabels[turtle.species] || turtle.species}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.headerRow}>
          <Text style={styles.turtleId} numberOfLines={1}>{turtle.turtleId}</Text>
          <YearsBadge years={yearsSinceSeen} />
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="eye-outline" size={14} color={Colors.text.muted} />
            <Text style={styles.metaText}>{turtle.totalSightings} Sightings</Text>
          </View>
          {turtle.gender !== 'unknown' && (
            <View style={styles.metaItem}>
              <Ionicons name={turtle.gender === 'male' ? 'male-outline' : 'female-outline'} size={14} color={Colors.text.muted} />
              <Text style={styles.metaText}>{turtle.gender}</Text>
            </View>
          )}
        </View>

        <Button 
          label="View Details" 
          variant="primary" 
          size="md" 
          style={styles.actionButton}
          onPress={onPress}
          rightIcon={<Ionicons name="arrow-forward" size={16} color={Colors.text.inverse} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.bg.secondary,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border.subtle,
    overflow: 'hidden',
    ...Shadows.md,
  },
  imageWrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: Colors.bg.tertiary,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
  },
  speciesBadge: {
    backgroundColor: 'rgba(7, 29, 44, 0.75)', // Yale Blue 900 with opacity
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  speciesBadgeText: {
    ...TextStyles.label,
    color: Colors.white,
  },
  content: {
    padding: Spacing.base,
    gap: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  turtleId: {
    ...TextStyles.h2,
    color: Colors.text.primary,
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...TextStyles.bodySmall,
    color: Colors.text.secondary,
    textTransform: 'capitalize',
  },
  actionButton: {
    marginTop: Spacing.xs,
  },
});
