import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, MatchStrengthColors } from '../../constants/colors';
import { TextStyles } from '../../constants/typography';
import { Spacing, Radii } from '../../constants/theme';
import type { MatchStrength } from '../../types';

interface ConfidenceBadgeProps {
  score: number;           // 0–1
  matchStrength?: MatchStrength;
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

const strengthLabels: Record<MatchStrength, string> = {
  strong: 'STRONG MATCH',
  probable: 'PROBABLE MATCH',
  new: 'NEW TURTLE',
};

export function ConfidenceBadge({ score, matchStrength, size = 'md', style }: ConfidenceBadgeProps) {
  const strength: MatchStrength = matchStrength || (
    score >= 0.85 ? 'strong' : score >= 0.65 ? 'probable' : 'new'
  );
  const color = MatchStrengthColors[strength];
  const bg = `${color}18`;

  const pct = Math.round(score * 100);

  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: `${color}40` }, style]}>
      {size === 'md' && (
        <Text style={[styles.label, { color }]}>{strengthLabels[strength]}</Text>
      )}
      <Text style={[
        size === 'sm' ? styles.scoreSm : styles.score,
        { color }
      ]}>
        {pct}%
      </Text>
    </View>
  );
}

interface YearsBadgeProps {
  years: number;
  style?: ViewStyle;
}

export function YearsBadge({ years, style }: YearsBadgeProps) {
  const label = years === 0
    ? 'This year'
    : years === 1
      ? '1 yr ago'
      : `${years} yrs ago`;

  return (
    <View style={[styles.yearsBadge, style]}>
      <Text style={styles.yearsText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  score: {
    ...TextStyles.label,
    fontWeight: '700',
  },
  scoreSm: {
    fontSize: 11,
    fontWeight: '700',
  },
  yearsBadge: {
    backgroundColor: Colors.warm.amberSubtle,
    borderColor: Colors.warm.amberBorder,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radii.full,
  },
  yearsText: {
    ...TextStyles.labelSmall,
    color: Colors.warm.amber,
    fontWeight: '600',
  },
});
